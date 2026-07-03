import { describe, it, expect, vi, afterEach } from 'vitest';
import { element, property, watch, render, html } from '../src/index';

// A camelCase explicit `attribute:` name must still be observed. The DOM
// lowercases attribute names, so observedAttributes has to carry the lowercase
// form or attributeChangedCallback never fires — @watch and re-render silently
// break for that attribute even though reading the property works.
describe('@property with a camelCase attribute name', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('observes and reacts to a camelCase attribute set via the DOM', async () => {
    const watchSpy = vi.fn();
    const tag = `camel-attr-${Math.random().toString(36).slice(2, 8)}`;

    @element(tag)
    class C extends HTMLElement {
      @property({ attribute: 'myCamelAttr' }) label = '';
      @watch('label') onLabel(o: string, n: string) { watchSpy(o, n); }
      @render() r() { return html`<div class="v">${this.label}</div>`; }
    }

    // observedAttributes must contain the lowercase form the DOM will store.
    expect((C as any).observedAttributes).toContain('mycamelattr');

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    watchSpy.mockClear();

    el.setAttribute('myCamelAttr', 'hello'); // DOM stores this as 'mycamelattr'
    await new Promise((r) => queueMicrotask(r));

    expect(watchSpy).toHaveBeenCalled();
    expect(el.shadowRoot.querySelector('.v').textContent).toBe('hello');
  });
});
