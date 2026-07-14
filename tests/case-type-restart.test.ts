import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

// A <case> value whose TYPE changes but stringifies the same (number 1 vs
// string '1' — e.g. a default number replaced by a router param, which is
// always a string) selects the SAME <when> branch and must not tear it down
// and re-insert it. Doing so detaches/reattaches everything inside the branch,
// restarting media, losing focus, and re-firing child connect/disconnect.

// Fixed-tag child that counts its connectedCallback (a dynamic tag name can't
// be interpolated into a template, so it must be a literal in the markup).
let connects = 0;
const CHILD_TAG = 'case-branch-lifecycle-child';
if (!customElements.get(CHILD_TAG)) {
  customElements.define(CHILD_TAG, class extends HTMLElement {
    connectedCallback() { connects++; }
  });
}

describe('<case> does not restart a branch on a same-key type change', () => {
  const els: HTMLElement[] = [];
  afterEach(() => {
    els.splice(0).forEach((e) => e.remove());
  });

  it('keeps the selected branch mounted when 1 (number) becomes "1" (string)', async () => {
    connects = 0;

    const tag = `case-type-host-${Math.random().toString(36).slice(2, 8)}`;
    @element(tag)
    class Host extends HTMLElement {
      // Boolean flag flips the case value between number 1 and string '1',
      // computed inline so a typed property doesn't coerce it back.
      @property({ type: Boolean, attribute: false }) useString = false;
      @render()
      renderContent() {
        const tab = this.useString ? '1' : 1;
        return html`
          <case ${tab}>
            <when value="1"><case-branch-lifecycle-child></case-branch-lifecycle-child></when>
            <when value="2"><span>two</span></when>
          </case>
        `;
      }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;

    // First render mounted the '1' branch child exactly once.
    expect(connects).toBe(1);

    // Router-style: the number 1 becomes the string '1'. Same branch.
    el.useString = true;
    await new Promise((r) => queueMicrotask(r));

    // The branch must NOT have been detached and re-inserted.
    expect(connects).toBe(1);
    expect(el.shadowRoot.querySelector(CHILD_TAG)).toBeTruthy();
  });

  it('still switches branches when the value actually changes', async () => {
    const tag = `case-switch-host-${Math.random().toString(36).slice(2, 8)}`;
    @element(tag)
    class Host extends HTMLElement {
      @property() tab: any = 'a';
      @render()
      renderContent() {
        return html`
          <case ${this.tab}>
            <when value="a"><span class="a">A</span></when>
            <when value="b"><span class="b">B</span></when>
          </case>
        `;
      }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.a')).toBeTruthy();

    el.tab = 'b';
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.a')).toBeFalsy();
    expect(el.shadowRoot.querySelector('.b')).toBeTruthy();
  });
});
