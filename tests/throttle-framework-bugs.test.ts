import { describe, it, expect, afterEach } from 'vitest';
import { element, dispatch, request, respond, controller } from '../packages/core/src/index';
import { attachController } from '../packages/core/src/controller';

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// @respond throttle — mirror of the @request throttle bug; throttled respond
// resolves caller's @request promise to `undefined` instead of queuing.
// ---------------------------------------------------------------------------

describe('@respond throttle must not resolve caller with undefined', () => {
  it('a rapid third @request against a throttled @respond gets a real value', async () => {
    const ctrlName = `rctrl-${Math.random().toString(36).slice(2, 8)}`;
    const elName = `relem-${Math.random().toString(36).slice(2, 8)}`;
    const chName = `rchan-${Math.random().toString(36).slice(2, 8)}`;

    @controller(ctrlName)
    class Responder {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }

      @respond(chName, { throttle: 50 })
      handle(p: any) { return { value: p.n * 2 }; }
    }

    @element(elName)
    class Caller extends HTMLElement {
      @request(chName)
      async *ask(n: number): any {
        const r = await (yield { n });
        return r;
      }
    }

    const el = document.createElement(elName) as any;
    document.body.appendChild(el);
    await el.ready;
    await attachController(el, ctrlName);
    await new Promise(r => setTimeout(r, 20));

    // 3 synchronous calls: call 1 leading (sync), call 2 schedules trailing,
    // call 3 hits `if (throttleTimeout) return Promise.resolve(undefined)`.
    const [a, b, c] = await Promise.all([el.ask(1), el.ask(2), el.ask(3)]);

    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(c).toBeDefined();  // bug: c resolves to undefined
  });
});

// ---------------------------------------------------------------------------
// @request throttle — a boundary call that cancels the scheduled trailing call
// must still settle the promises queued for it, not orphan them forever.
// ---------------------------------------------------------------------------

describe('@request throttle must not orphan trailing callers', () => {
  it('a boundary call that cancels the pending trailing call still settles queued callers', async () => {
    const rnd = () => Math.random().toString(36).slice(2, 8);
    const ctrlName = `qctrl-${rnd()}`;
    const elName = `qelem-${rnd()}`;
    const chName = `qchan-${rnd()}`;

    @controller(ctrlName)
    class Responder {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }

      @respond(chName)
      handle(p: any) { return { value: p.n * 2 }; }
    }

    @element(elName)
    class Caller extends HTMLElement {
      @request(chName, { throttle: 50 })
      async *ask(n: number): any {
        const r = await (yield { n });
        return r;
      }
    }

    const el = document.createElement(elName) as any;
    document.body.appendChild(el);
    await el.ready;
    await attachController(el, ctrlName);
    await new Promise((r) => setTimeout(r, 20));

    const p1 = el.ask(1);   // leading call — runs immediately
    const p2 = el.ask(2);   // within window — schedules a trailing call, queues its resolver

    // Block the event loop past the throttle window so the trailing timer for
    // p2 cannot fire before the next call runs.
    const until = Date.now() + 70;
    // eslint-disable-next-line no-empty
    while (Date.now() < until) { /* busy-wait, holds the main thread */ }

    const p3 = el.ask(3);   // remaining <= 0 → cancels p2's still-pending trailing timer

    // p2 must not hang: everything settles well inside the guard timeout.
    const outcome = await Promise.race([
      Promise.allSettled([p1, p2, p3]).then(() => 'settled'),
      new Promise((r) => setTimeout(() => r('HUNG'), 1000)),
    ]);
    expect(outcome).toBe('settled');

    const [, r2] = await Promise.all([p1, p2, p3]);
    expect(r2).toBeDefined(); // the queued caller got a real value, not undefined
  });
});

// ---------------------------------------------------------------------------
// @dispatch throttle trailing dispatches the LATEST detail, not the first.
// ---------------------------------------------------------------------------

describe('@dispatch throttle: trailing event carries latest detail', () => {
  it('rapid emissions 10→20→30 result in trailing event with detail 30, not 10', async () => {
    const elName = `dispatch-throttle-${Math.random().toString(36).slice(2, 8)}`;
    let lastValue = 0;

    @element(elName)
    class Emitter extends HTMLElement {
      @dispatch('value-changed', { throttle: 60 })
      emit() { return { value: lastValue }; }
    }

    const el = document.createElement(elName) as any;
    document.body.appendChild(el);
    await el.ready;

    const details: number[] = [];
    el.addEventListener('value-changed', (e: any) => details.push(e.detail.value));

    // Fire rapidly with changing values. Trailing call should carry the latest.
    lastValue = 10; el.emit();   // leading — fires with 10
    lastValue = 20; el.emit();   // suppressed
    lastValue = 30; el.emit();   // suppressed — this is the LATEST value

    await new Promise(r => setTimeout(r, 120));   // wait for trailing

    // We expect: [10 (leading), 30 (trailing latest)]
    // Bug: [10 (leading), 10 (trailing stale)]
    expect(details).toContain(30);
  });
});
