import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

// A child inside an <if> that is FALSE on first render must never be connected.
// Previously the children were placed in the live template fragment, so they
// fired connectedCallback (when the template mounted) and then disconnectedCallback
// (when the first commit hid the branch) — running mount side effects spuriously
// on every load.
let connects = 0;
let disconnects = 0;
const CHILD_TAG = 'if-hidden-lifecycle-child';
if (!customElements.get(CHILD_TAG)) {
  customElements.define(CHILD_TAG, class extends HTMLElement {
    connectedCallback() { connects++; }
    disconnectedCallback() { disconnects++; }
  });
}

describe('<if> hidden on first render does not connect its children', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('never fires connect/disconnect for a branch that starts hidden', async () => {
    connects = 0;
    disconnects = 0;

    const tag = `if-hidden-host-${Math.random().toString(36).slice(2, 8)}`;
    @element(tag)
    class Host extends HTMLElement {
      @property({ type: Boolean, attribute: false }) show = false;
      @render()
      r() {
        return html`<if ${this.show}><if-hidden-lifecycle-child></if-hidden-lifecycle-child></if>`;
      }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;

    // Hidden branch: the child must never have been connected or disconnected.
    expect(connects).toBe(0);
    expect(disconnects).toBe(0);

    // Showing it connects the child exactly once.
    el.show = true;
    await new Promise((r) => queueMicrotask(r));
    expect(connects).toBe(1);
    expect(el.shadowRoot.querySelector(CHILD_TAG)).toBeTruthy();

    // Hiding it disconnects once.
    el.show = false;
    await new Promise((r) => queueMicrotask(r));
    expect(disconnects).toBe(1);
    expect(el.shadowRoot.querySelector(CHILD_TAG)).toBeFalsy();
  });
});
