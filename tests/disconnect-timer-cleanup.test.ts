import { describe, it, expect, afterEach, vi } from 'vitest';
import { element, property, render, dispatch, html } from '../packages/core/src/index';
import { RENDER_TIMERS, PENDING_RECONNECT_RENDER } from '../packages/core/src/symbols';

// A render() or @dispatch() scheduled with debounce/throttle arms a setTimeout
// stored on the element. On disconnect those timers must be cleared so they
// don't fire on a dead element and retain it until they expire. A pending
// render is replayed on reconnect; a pending dispatch is dropped.
describe('disconnect clears render/dispatch debounce-throttle timers', () => {
  const els: HTMLElement[] = [];
  afterEach(() => {
    els.splice(0).forEach((el) => el.remove());
  });

  it('clears a pending debounced render timer on disconnect and arms a reconnect replay', async () => {
    @element('test-render-timer-leak')
    class TestRenderTimerLeak extends HTMLElement {
      @property({ attribute: false }) count = 0;
      @render({ debounce: 40 })
      tpl() { return html`<span>${this.count}</span>`; }
    }

    const el = document.createElement('test-render-timer-leak') as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready; // initial render is immediate (debounce is bypassed on connect)
    expect(el.shadowRoot.querySelector('span').textContent).toBe('0');

    el.count = 5;   // arms the 40ms debounce timer
    expect(el[RENDER_TIMERS]?.debounce).toBeTruthy();

    el.remove();    // disconnect before the timer fires
    expect(el[RENDER_TIMERS]?.debounce ?? null).toBeNull(); // timer cleared
    expect(el[PENDING_RECONNECT_RENDER]).toBe(true);        // replay armed

    // Reconnect replays the dropped render (re-honoring the component's own
    // debounce, so allow the interval to elapse).
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 80));
    expect(el.shadowRoot.querySelector('span').textContent).toBe('5');
  });

  it('cancels a pending debounced dispatch when the element disconnects', async () => {
    const handler = vi.fn();

    @element('test-dispatch-timer-leak')
    class TestDispatchTimerLeak extends HTMLElement {
      @render()
      tpl() { return html`<div></div>`; }

      @dispatch('boom', { debounce: 30 })
      fire() { return { ok: true }; }
    }

    const el = document.createElement('test-dispatch-timer-leak') as any;
    el.addEventListener('boom', handler);
    document.body.appendChild(el);
    els.push(el);
    await el.ready;

    el.fire();   // arms the 30ms debounced dispatch
    el.remove(); // disconnect before it fires

    await new Promise((r) => setTimeout(r, 60));
    // Without cleanup the timer fires this.dispatchEvent on the detached node,
    // reaching the listener still bound to the element.
    expect(handler).not.toHaveBeenCalled();
  });

  it('preserves the @render throttle cooldown across a plain reparent', async () => {
    let renders = 0;

    @element('test-throttle-reparent')
    class TestThrottleReparent extends HTMLElement {
      @property({ attribute: false }) n = 0;
      // Large window so the timing is unambiguous.
      @render({ throttle: 10000 })
      tpl() { renders++; return html`<span>${this.n}</span>`; }
    }

    const p1 = document.createElement('div');
    const p2 = document.createElement('div');
    document.body.append(p1, p2);
    els.push(p1, p2);

    const el = document.createElement('test-throttle-reparent') as any;
    p1.appendChild(el);
    await el.ready;                 // initial render is immediate (throttle bypassed)
    const afterMount = renders;

    el.n = 1;                       // first throttled call → renders now, sets lastThrottle
    await new Promise((r) => setTimeout(r, 20));
    const afterFirst = renders;
    expect(afterFirst).toBe(afterMount + 1);

    // Plain reparent: disconnect + reconnect. No render timer was pending, so
    // nothing to replay — and the throttle cooldown must survive the move.
    el.remove();
    await new Promise((r) => setTimeout(r, 5)); // let disconnect cleanup run
    p2.appendChild(el);
    await el.ready;

    el.n = 2;                       // within the 10s window → must be throttled, not immediate
    await new Promise((r) => setTimeout(r, 20));
    expect(renders).toBe(afterFirst);
  });
});
