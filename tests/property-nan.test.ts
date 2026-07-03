import { describe, it, expect, vi, afterEach } from 'vitest';
import { element, property, watch, render, html } from '../src/index';

// A property whose value is NaN must not be treated as changed on every set:
// the default dirty-check is `oldValue !== newValue`, and NaN !== NaN is true,
// so re-setting NaN (or an attribute that keeps parsing to NaN) re-fires
// watchers and re-renders forever.
describe('@property NaN dirty-check', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('does not re-fire the watcher when a Number property stays NaN', async () => {
    const watchSpy = vi.fn();
    const tag = `nan-prop-${Math.random().toString(36).slice(2, 8)}`;

    @element(tag)
    class C extends HTMLElement {
      @property({ type: Number, attribute: false }) qty = 0;
      @watch('qty') onQty() { watchSpy(); }
      @render() r() { return html`<div>${this.qty}</div>`; }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    watchSpy.mockClear();

    el.qty = NaN; // 0 → NaN: a genuine change, fires once
    await new Promise((r) => queueMicrotask(r));
    el.qty = NaN; // NaN → NaN: no change, must not fire again
    await new Promise((r) => queueMicrotask(r));

    expect(watchSpy).toHaveBeenCalledTimes(1);
  });
});
