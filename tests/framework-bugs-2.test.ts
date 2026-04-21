import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { element, property, render, html } from '../src/index';

// Framework-level bug audit: batch 2. Each test is expected to FAIL today
// (`.fails`) and will flip to red once someone fixes the bug, signalling it's
// time to drop the `.fails` marker.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// #1 — @request throttle silently discards: second rapid call returns
//      Promise.resolve() (undefined) instead of a promise tied to the
//      eventual handler response. src/request-response.ts:137
// ---------------------------------------------------------------------------

describe('@request throttle must not resolve to undefined', () => {
  it('throttled @request returns the handler result even on coalesced calls', async () => {
    const { request, respond, controller } = await import('../src/index');
    const { attachController } = await import('../src/controller');

    const ctrlName = `tctrl-${Math.random().toString(36).slice(2, 8)}`;
    const elName = `telem-${Math.random().toString(36).slice(2, 8)}`;
    const chName = `tchan-${Math.random().toString(36).slice(2, 8)}`;

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
    await new Promise(r => setTimeout(r, 20));

    const first = el.ask(1);
    const second = el.ask(2);    // lands while throttle window is active
    const [a, b] = await Promise.all([first, second]);

    // Before the fix: `b` was `undefined` because the throttle branch
    // returned `Promise.resolve()` without queuing a resolver.
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// #2 — @debounce / @throttle timers survive disconnect: fire on dead element.
//      src/method-decorators.ts:82-88, 146-177
// ---------------------------------------------------------------------------

describe('@debounce timer does not fire after disconnect', () => {
  it('disconnected element does not run its debounced method', async () => {
    const { debounce } = await import('../src/method-decorators');
    const calls: string[] = [];

    @element('debounce-leak')
    class D extends HTMLElement {
      @debounce(30)
      run() { calls.push('ran'); }
    }

    const el = document.createElement('debounce-leak') as any;
    document.body.appendChild(el);
    await el.ready;

    el.run();
    el.remove();                         // disconnect BEFORE debounce fires
    await new Promise(r => setTimeout(r, 80));

    expect(calls).toEqual([]);           // must not have fired
  });
});

// ---------------------------------------------------------------------------
// #3 — Router has no in-flight abort: rapid navigate() calls race.
//      src/router.ts:448-486
// ---------------------------------------------------------------------------

describe('router aborts stale in-flight navigations', () => {
  it('rapid navigate(a) then navigate(b) ends on b, not a', async () => {
    const { Router } = await import('../src/index');
    const container = document.createElement('div');
    container.id = 'router-abort-test';
    document.body.appendChild(container);

    const router = Router({ target: '#router-abort-test', type: 'hash' });

    router.page({ tag: 'slow-page-a', routes: ['/a'],
      guards: [async () => { await new Promise(r => setTimeout(r, 60)); return true; }]
    })(class extends HTMLElement { connectedCallback() { this.textContent = 'A'; } });

    router.page({ tag: 'fast-page-b', routes: ['/b'] })(
      class extends HTMLElement { connectedCallback() { this.textContent = 'B'; } }
    );

    router.initialize();
    const [, ] = await Promise.all([router.navigate('/a'), router.navigate('/b')]);
    await new Promise(r => setTimeout(r, 100));

    const finalTag = container.firstElementChild?.tagName?.toLowerCase();
    expect(finalTag).toBe('fast-page-b');
  });
});

// ---------------------------------------------------------------------------
// #4 — transitions.parseStyles splits on `:` — drops URL values.
//      src/transitions.ts:14-23
// ---------------------------------------------------------------------------

describe('transitions.parseStyles handles values containing `:`', () => {
  it('url values with http:// survive parsing intact', async () => {
    // parseStyles isn't exported; exercise it via the transition machinery
    // by inspecting its observable effect. For a direct test we import the
    // function through a side channel.
    const mod: any = await import('../src/transitions');

    // If the function is exported — direct test.
    if (typeof mod.parseStyles === 'function') {
      const parsed = mod.parseStyles(`background: url('https://x/y.png')`);
      expect(parsed.background).toBe(`url('https://x/y.png')`);
      return;
    }

    // Otherwise: indirect test via performTransition on a dummy element.
    // Skip path: declare the bug by asserting exported surface for now.
    throw new Error('parseStyles not reachable for a direct test');
  });
});

// ---------------------------------------------------------------------------
// #5 — @context debounce/throttle share CONTEXT_TIMER slot on the element.
//      An element with one debounced and one throttled handler corrupts each
//      other's timer state. src/context.ts:113-124, 150-152
// ---------------------------------------------------------------------------

describe('@context debounce and throttle do not corrupt each other', () => {
  it('throttled handler still fires when a debounced handler is also present', async () => {
    const { context } = await import('../src/index');
    const { setupContextHandler } = await import('../src/context');
    const { CONTEXT_HANDLER, CONTEXT_REGISTER } = await import('../src/symbols');
    const fired: string[] = [];

    @element('context-timer-collision')
    class X extends HTMLElement {
      @context({ debounce: 50 })
      a() { fired.push('debounced'); }

      @context({ throttle: 200 })
      b() { fired.push('throttled'); }
    }

    const el = document.createElement('context-timer-collision') as any;
    document.body.appendChild(el);
    await el.ready;

    // Stub a minimal Context instance so setupContextHandler wires the handlers
    (el as any)[CONTEXT_HANDLER] = {
      [CONTEXT_REGISTER]: () => {},
    };
    setupContextHandler(el);

    const ctx: any = { application: {}, navigation: { route: '/', params: {}, placards: [] } };
    (el as any).__wrapped_a?.(ctx);
    (el as any).__wrapped_b?.(ctx);

    await new Promise(r => setTimeout(r, 120));

    expect(fired).toContain('throttled');  // fires immediately (first call under throttle)
    expect(fired).toContain('debounced');  // fires after 50ms
  });
});

// ---------------------------------------------------------------------------
// #6 — useNativeElementControllers selector filter bug.
//      `:not([class*="-"])` filters by CLASS attribute, not tag name.
//      Any element with a hyphenated class (BEM/Tailwind/Bootstrap) is
//      silently skipped. src/controller.ts:288, 296
// ---------------------------------------------------------------------------

describe('native element controllers ignore class-name hyphens', () => {
  it('controller attaches to a DESCENDANT native element with hyphenated class', async () => {
    const { controller, useNativeElementControllers } = await import('../src/index');
    const calls: string[] = [];

    @controller('hyphen-class-ctrl')
    class Ctrl {
      constructor(_el: HTMLElement) { calls.push('attached'); }
      attach() {}
      detach() {}
    }

    useNativeElementControllers();

    // The added node is a wrapper; the element with controller is a descendant.
    // The MutationObserver queries descendants with `[controller]:not([class*="-"])`
    // which silently excludes hyphenated-class elements.
    const wrapper = document.createElement('section');
    wrapper.innerHTML = `<div controller="hyphen-class-ctrl" class="btn-primary"></div>`;
    document.body.appendChild(wrapper);

    await new Promise(r => setTimeout(r, 50));
    expect(calls).toContain('attached');
  });
});
