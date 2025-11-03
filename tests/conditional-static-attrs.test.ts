import { describe, it, expect, beforeEach } from 'vitest';
import { element, render, html, property } from '../src/index';

describe('Conditional Static Attributes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should preserve static attributes on elements inside <if>', async () => {
    @element('test-child-cond')
    class TestChildCond extends HTMLElement {}

    @element('test-parent-cond')
    class TestParentCond extends HTMLElement {
      @property() show = true;

      @render()
      renderContent() {
        return html`
          <if ${this.show}>
            <test-child-cond
              auto-start
              tap-start
              pick-first
              camera="back"
            ></test-child-cond>
          </if>
        `;
      }
    }

    const parent = document.createElement('test-parent-cond') as TestParentCond;
    document.body.appendChild(parent);
    await parent.ready;

    const child = parent.shadowRoot!.querySelector('test-child-cond');
    expect(child).toBeTruthy();

    // Check static attributes
    expect(child!.hasAttribute('auto-start')).toBe(true);
    expect(child!.hasAttribute('tap-start')).toBe(true);
    expect(child!.hasAttribute('pick-first')).toBe(true);
    expect(child!.getAttribute('camera')).toBe('back');
  });

  it('should preserve attributes when toggling conditional', async () => {
    @element('test-child-toggle')
    class TestChildToggle extends HTMLElement {}

    @element('test-parent-toggle')
    class TestParentToggle extends HTMLElement {
      @property() show = true;

      @render()
      renderContent() {
        return html`
          <if ${this.show}>
            <test-child-toggle
              auto-start
              tap-start
              pick-first
              camera="back"
            ></test-child-toggle>
          </if>
        `;
      }
    }

    const parent = document.createElement('test-parent-toggle') as TestParentToggle;
    document.body.appendChild(parent);
    await parent.ready;

    // Check initial state
    let child = parent.shadowRoot!.querySelector('test-child-toggle');
    expect(child).toBeTruthy();
    expect(child!.hasAttribute('auto-start')).toBe(true);

    // Hide
    parent.show = false;
    await parent.ready;
    child = parent.shadowRoot!.querySelector('test-child-toggle');
    expect(child).toBeFalsy(); // Element should be hidden

    // Show again
    parent.show = true;
    await parent.ready;
    child = parent.shadowRoot!.querySelector('test-child-toggle');
    expect(child).toBeTruthy();

    // Attributes should still be there
    expect(child!.hasAttribute('auto-start')).toBe(true);
    expect(child!.hasAttribute('tap-start')).toBe(true);
    expect(child!.hasAttribute('pick-first')).toBe(true);
    expect(child!.getAttribute('camera')).toBe('back');
  });
});
