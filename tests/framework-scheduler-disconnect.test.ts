import { describe, it, expect, afterEach } from 'vitest';
import { element, render, property, html } from '../src/index';

afterEach(() => { document.body.innerHTML = ''; });

// RenderScheduler batches renders in a microtask. If an element is detached
// between the schedule and flush, performRender still runs against it.
// After fix, flush skips disconnected elements.

describe('RenderScheduler: skips disconnected elements in flush', () => {
  it('does not render a detached element queued via property change', async () => {
    let renderCalls = 0;

    @element('snice-scheduler-disconnect-test')
    class Target extends HTMLElement {
      @property({ type: Number, attribute: false })
      count = 0;

      @render()
      template() {
        renderCalls++;
        return html/*html*/`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('snice-scheduler-disconnect-test') as any;
    document.body.appendChild(el);
    await el.ready;

    const before = renderCalls;

    // Queue a re-render via property change, then immediately detach the
    // element BEFORE the microtask flush.
    el.count = 5;
    el.remove();

    // Let microtask flush.
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 10));

    // With the bug: renderCalls incremented (flush ran performRender on detached el).
    // With the fix: renderCalls unchanged.
    expect(renderCalls).toBe(before);
  });

  it('still renders normally when element stays connected', async () => {
    let renderCalls = 0;

    @element('snice-scheduler-connected-test')
    class T extends HTMLElement {
      @property({ type: Number, attribute: false })
      n = 0;
      @render()
      t() {
        renderCalls++;
        return html/*html*/`<p>${this.n}</p>`;
      }
    }

    const el = document.createElement('snice-scheduler-connected-test') as any;
    document.body.appendChild(el);
    await el.ready;
    const before = renderCalls;

    el.n = 1;
    await new Promise(r => setTimeout(r, 10));
    expect(renderCalls).toBeGreaterThan(before);
    expect(el.shadowRoot.textContent).toContain('1');
  });
});
