import { describe, it, expect, beforeEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * Tests to reproduce boolean attribute issues with DocumentFragment and template.innerHTML
 * These scenarios mimic how the differential renderer creates elements
 */
describe('Boolean Attributes in DocumentFragment', () => {
  @element('test-bool-elem')
  class TestBoolElement extends HTMLElement {
    @property({ type: Boolean, attribute: 'enabled' })
    enabled: boolean = false;

    @property({ type: Boolean, attribute: 'auto-start' })
    autoStart: boolean = false;

    @property({ attribute: 'label' })
    label: string = '';
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should preserve boolean attributes when element created in DocumentFragment', async () => {
    const fragment = document.createDocumentFragment();
    const elem = document.createElement('test-bool-elem');
    elem.setAttribute('enabled', '');
    elem.setAttribute('auto-start', '');
    elem.setAttribute('label', 'test');

    fragment.appendChild(elem);

    // Check attributes in fragment
    expect(elem.hasAttribute('enabled')).toBe(true);
    expect(elem.hasAttribute('auto-start')).toBe(true);
    expect(elem.getAttribute('label')).toBe('test');

    // Append to DOM
    document.body.appendChild(fragment);
    await (elem as any).ready;

    // Check attributes after DOM connection
    expect(elem.hasAttribute('enabled')).toBe(true);
    expect(elem.hasAttribute('auto-start')).toBe(true);
    expect(elem.getAttribute('label')).toBe('test');

    // Check property values
    expect((elem as any).enabled).toBe(true);
    expect((elem as any).autoStart).toBe(true);
    expect((elem as any).label).toBe('test');
  });

  it('should preserve boolean attributes when created via template.innerHTML', async () => {
    const template = document.createElement('template');
    template.innerHTML = `
      <test-bool-elem
        enabled
        auto-start
        label="test"
      ></test-bool-elem>
    `;

    const elem = template.content.querySelector('test-bool-elem')!;
    expect(elem).toBeTruthy();

    // Check attributes in template
    expect(elem.hasAttribute('enabled')).toBe(true);
    expect(elem.hasAttribute('auto-start')).toBe(true);
    expect(elem.getAttribute('label')).toBe('test');

    // Clone and append to DOM
    const clone = template.content.cloneNode(true) as DocumentFragment;
    document.body.appendChild(clone);

    const connectedElem = document.body.querySelector('test-bool-elem')!;
    await (connectedElem as any).ready;

    // Check attributes after DOM connection
    expect(connectedElem.hasAttribute('enabled')).toBe(true);
    expect(connectedElem.hasAttribute('auto-start')).toBe(true);
    expect(connectedElem.getAttribute('label')).toBe('test');

    // Check property values
    expect((connectedElem as any).enabled).toBe(true);
    expect((connectedElem as any).autoStart).toBe(true);
    expect((connectedElem as any).label).toBe('test');
  });

  it('should preserve boolean attributes when parent element uses @render', async () => {
    @element('test-parent')
    class TestParent extends HTMLElement {
      @property() showChild = true;

      @render()
      view() {
        return html`
          <div>
            <if ${this.showChild}>
              <test-bool-elem
                enabled
                auto-start
                label="from-parent"
              ></test-bool-elem>
            </if>
          </div>
        `;
      }
    }

    const parent = document.createElement('test-parent') as TestParent;
    document.body.appendChild(parent);
    await parent.ready;

    const child = parent.shadowRoot!.querySelector('test-bool-elem')!;
    expect(child).toBeTruthy();

    // Check attributes
    expect(child.hasAttribute('enabled')).toBe(true);
    expect(child.hasAttribute('auto-start')).toBe(true);
    expect(child.getAttribute('label')).toBe('from-parent');

    // Check property values
    expect((child as any).enabled).toBe(true);
    expect((child as any).autoStart).toBe(true);
    expect((child as any).label).toBe('from-parent');
  });

  it('should handle multiple re-renders without losing boolean attributes', async () => {
    @element('test-rerender-parent')
    class TestRerenderParent extends HTMLElement {
      @property() counter = 0;

      @render()
      view() {
        return html`
          <div>
            <p>Counter: ${this.counter}</p>
            <test-bool-elem
              enabled
              auto-start
              label="counter-${this.counter}"
            ></test-bool-elem>
          </div>
        `;
      }
    }

    const parent = document.createElement('test-rerender-parent') as TestRerenderParent;
    document.body.appendChild(parent);
    await parent.ready;

    // Initial render
    let child = parent.shadowRoot!.querySelector('test-bool-elem')!;
    expect(child.hasAttribute('enabled')).toBe(true);
    expect(child.hasAttribute('auto-start')).toBe(true);
    expect((child as any).enabled).toBe(true);
    expect((child as any).autoStart).toBe(true);

    // Trigger re-render
    parent.counter = 1;
    await new Promise(resolve => setTimeout(resolve, 50));

    child = parent.shadowRoot!.querySelector('test-bool-elem')!;
    expect(child.hasAttribute('enabled')).toBe(true);
    expect(child.hasAttribute('auto-start')).toBe(true);
    expect((child as any).enabled).toBe(true);
    expect((child as any).autoStart).toBe(true);

    // Trigger another re-render
    parent.counter = 2;
    await new Promise(resolve => setTimeout(resolve, 50));

    child = parent.shadowRoot!.querySelector('test-bool-elem')!;
    expect(child.hasAttribute('enabled')).toBe(true);
    expect(child.hasAttribute('auto-start')).toBe(true);
    expect((child as any).enabled).toBe(true);
    expect((child as any).autoStart).toBe(true);
  });
});
