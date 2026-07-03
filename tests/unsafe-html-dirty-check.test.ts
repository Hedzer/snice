import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html, unsafeHTML } from '../src/index';

// unsafeHTML can't diff arbitrary markup, but when the HTML STRING is unchanged
// it must not clear + re-parse the subtree — doing so destroys live DOM state
// (typed input values, focus, scroll) inside the block on every unrelated
// re-render of the enclosing template.
describe('unsafeHTML dirty-check', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('preserves live DOM inside unsafeHTML across an unrelated re-render', async () => {
    @element('unsafe-preserve')
    class UnsafePreserve extends HTMLElement {
      @property() other = 0;
      markup = '<input class="note">';

      @render()
      renderContent() {
        return html`<div class="count">${this.other}</div><section>${unsafeHTML(this.markup)}</section>`;
      }
    }

    const el = document.createElement('unsafe-preserve') as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;

    const input = el.shadowRoot.querySelector('input.note') as HTMLInputElement;
    input.value = 'typed by user';

    // Re-render triggered by an UNRELATED property; markup is unchanged.
    el.other = 1;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.count').textContent).toBe('1');

    const inputAfter = el.shadowRoot.querySelector('input.note') as HTMLInputElement;
    expect(inputAfter).toBe(input);                 // same element, not recreated
    expect(inputAfter.value).toBe('typed by user'); // typed value survives
  });

  it('still re-parses when the HTML string actually changes', async () => {
    @element('unsafe-update')
    class UnsafeUpdate extends HTMLElement {
      @property() markup = '<span class="v">one</span>';

      @render()
      renderContent() {
        return html`<section>${unsafeHTML(this.markup)}</section>`;
      }
    }

    const el = document.createElement('unsafe-update') as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.v').textContent).toBe('one');

    el.markup = '<span class="v">two</span>';
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.v').textContent).toBe('two');
  });
});
