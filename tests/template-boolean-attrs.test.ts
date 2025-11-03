import { describe, it, expect, beforeEach } from 'vitest';
import { element, render, html } from '../src/index';

describe('Template Boolean Attributes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should preserve static boolean attributes in templates', async () => {
    @element('test-child-bool')
    class TestChildBool extends HTMLElement {}

    @element('test-parent-bool')
    class TestParentBool extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <test-child-bool
            auto-start
            tap-start
            pick-first
            camera="back"
          ></test-child-bool>
        `;
      }
    }

    const parent = document.createElement('test-parent-bool') as TestParentBool;
    document.body.appendChild(parent);
    await parent.ready;

    const child = parent.shadowRoot!.querySelector('test-child-bool')!;

    // All attributes should be present
    expect(child.hasAttribute('auto-start')).toBe(true);
    expect(child.hasAttribute('tap-start')).toBe(true);
    expect(child.hasAttribute('pick-first')).toBe(true);
    expect(child.getAttribute('camera')).toBe('back');
  });

  it('should preserve boolean attributes with empty string values', async () => {
    @element('test-child-empty')
    class TestChildEmpty extends HTMLElement {}

    @element('test-parent-empty')
    class TestParentEmpty extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <test-child-empty
            enabled=""
            disabled=""
            value="test"
          ></test-child-empty>
        `;
      }
    }

    const parent = document.createElement('test-parent-empty') as TestParentEmpty;
    document.body.appendChild(parent);
    await parent.ready;

    const child = parent.shadowRoot!.querySelector('test-child-empty')!;

    expect(child.hasAttribute('enabled')).toBe(true);
    expect(child.hasAttribute('disabled')).toBe(true);
    expect(child.getAttribute('value')).toBe('test');
  });
});
