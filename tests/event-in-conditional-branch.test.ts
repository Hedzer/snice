import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

// An event handler bound inside a conditional branch that is HIDDEN on first
// render is committed while its element is off-DOM (in the branch's parked
// fragment). The handler's `this` must still be the host component once the
// branch is shown and the event fires — not null.
describe('event handlers bound inside a hidden conditional branch', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('binds the correct `this` when a <case> branch is shown after first render', async () => {
    let clickedThis: unknown = 'unset';

    @element('cond-event-case')
    class CondEventCase extends HTMLElement {
      @property() tab = 'a';
      onB() { clickedThis = this; }

      @render()
      renderContent() {
        return html`
          <case ${this.tab}>
            <when value="a"><span class="a">A</span></when>
            <when value="b"><button class="b" @click=${this.onB}>B</button></when>
          </case>
        `;
      }
    }

    const el = document.createElement('cond-event-case') as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;                       // 'b' branch bound while hidden/off-DOM

    el.tab = 'b';
    await new Promise((r) => queueMicrotask(r));

    const btn = el.shadowRoot.querySelector('button.b') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();

    expect(clickedThis).toBe(el);
  });
});
