import { describe, it, expect, vi, afterEach } from 'vitest';
import { element, property, watch, render, html } from '../src/index';

// The documented `hasChanged` @property option must replace the default `===`
// dirty-check: return false to suppress an update (e.g. deep-equal objects),
// true to force one. Previously it was accepted by the type + docs but never
// invoked, so `===` was always used.
describe('@property hasChanged comparator', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('suppresses deep-equal updates and allows genuine ones', async () => {
    const watchSpy = vi.fn();
    const tag = `has-changed-${Math.random().toString(36).slice(2, 8)}`;

    @element(tag)
    class C extends HTMLElement {
      @property({ attribute: false, hasChanged: (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b) })
      config: any = { x: 1 };

      @watch('config')
      onConfig(o: any, n: any) { watchSpy(o, n); }

      @render()
      r() { return html`<div>${JSON.stringify(this.config)}</div>`; }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    watchSpy.mockClear();

    // Deep-equal but a new reference — hasChanged returns false → no update.
    el.config = { x: 1 };
    await new Promise((r) => queueMicrotask(r));
    expect(watchSpy).not.toHaveBeenCalled();

    // Genuinely different — hasChanged returns true → watcher fires once.
    el.config = { x: 2 };
    await new Promise((r) => queueMicrotask(r));
    expect(watchSpy).toHaveBeenCalledTimes(1);
  });

  it('forces an update on a mutated-in-place value when hasChanged says so', async () => {
    const watchSpy = vi.fn();
    const tag = `has-changed-ref-${Math.random().toString(36).slice(2, 8)}`;

    @element(tag)
    class C extends HTMLElement {
      // Always-changed comparator: even the same reference re-notifies.
      @property({ attribute: false, hasChanged: () => true })
      items: any[] = [];

      @watch('items')
      onItems() { watchSpy(); }

      @render()
      r() { return html`<div>${this.items.length}</div>`; }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    watchSpy.mockClear();

    const arr = el.items;
    arr.push(1);
    el.items = arr; // same reference — default === would skip; hasChanged forces it
    await new Promise((r) => queueMicrotask(r));
    expect(watchSpy).toHaveBeenCalledTimes(1);
  });
});
