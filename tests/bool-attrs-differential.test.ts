import { describe, it, expect, beforeEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * Tests that mimic the exact differential rendering flow
 * to reproduce boolean attribute removal issues
 */
describe('Boolean Attributes with Differential Rendering', () => {
  @element('diff-child')
  class DiffChild extends HTMLElement {
    @property({ type: Boolean, attribute: 'flag-a' })
    flagA: boolean = false;

    @property({ type: Boolean, attribute: 'flag-b' })
    flagB: boolean = false;

    @property({ type: Boolean, attribute: 'flag-c' })
    flagC: boolean = false;

    @property({ attribute: 'name' })
    name: string = '';
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should preserve attributes when template is parsed and cloned', async () => {
    // Step 1: Create template string (what @render returns)
    const templateString = `
      <diff-child
        flag-a
        flag-b
        flag-c
        name="test"
      ></diff-child>
    `;

    // Step 2: Parse into template element
    const template = document.createElement('template');
    template.innerHTML = templateString;

    // Step 3: Check parsed template content
    const inTemplate = template.content.querySelector('diff-child')!;
    expect(inTemplate.hasAttribute('flag-a')).toBe(true);
    expect(inTemplate.hasAttribute('flag-b')).toBe(true);
    expect(inTemplate.hasAttribute('flag-c')).toBe(true);

    // Step 4: Clone the template (what differential renderer does)
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const inClone = clone.querySelector('diff-child')!;
    expect(inClone.hasAttribute('flag-a')).toBe(true);
    expect(inClone.hasAttribute('flag-b')).toBe(true);
    expect(inClone.hasAttribute('flag-c')).toBe(true);

    // Step 5: Append to DOM (triggers connectedCallback)
    document.body.appendChild(clone);
    const inDom = document.body.querySelector('diff-child')!;
    await (inDom as any).ready;

    // Step 6: Verify attributes survived DOM connection
    expect(inDom.hasAttribute('flag-a')).toBe(true);
    expect(inDom.hasAttribute('flag-b')).toBe(true);
    expect(inDom.hasAttribute('flag-c')).toBe(true);

    // Step 7: Verify properties reflect attributes
    expect((inDom as any).flagA).toBe(true);
    expect((inDom as any).flagB).toBe(true);
    expect((inDom as any).flagC).toBe(true);
  });

  it('should preserve attributes through createElement and setAttribute flow', async () => {
    // Alternative flow: create element then set attributes
    const elem = document.createElement('diff-child');

    // Set attributes before DOM connection
    elem.setAttribute('flag-a', '');
    elem.setAttribute('flag-b', '');
    elem.setAttribute('flag-c', '');
    elem.setAttribute('name', 'manual');

    // Verify attributes set
    expect(elem.hasAttribute('flag-a')).toBe(true);
    expect(elem.hasAttribute('flag-b')).toBe(true);
    expect(elem.hasAttribute('flag-c')).toBe(true);

    // Connect to DOM
    document.body.appendChild(elem);
    await (elem as any).ready;

    // Verify attributes survived
    expect(elem.hasAttribute('flag-a')).toBe(true);
    expect(elem.hasAttribute('flag-b')).toBe(true);
    expect(elem.hasAttribute('flag-c')).toBe(true);

    // Verify properties
    expect((elem as any).flagA).toBe(true);
    expect((elem as any).flagB).toBe(true);
    expect((elem as any).flagC).toBe(true);
  });

  it('should handle rapid property access during initialization', async () => {
    // Test race condition: accessing properties immediately after creation
    const elem = document.createElement('diff-child');
    elem.setAttribute('flag-a', '');
    elem.setAttribute('flag-b', '');

    // Access properties before DOM connection (might trigger setters)
    const initialFlagA = (elem as any).flagA;
    const initialFlagB = (elem as any).flagB;

    // Attributes should still be present
    expect(elem.hasAttribute('flag-a')).toBe(true);
    expect(elem.hasAttribute('flag-b')).toBe(true);

    document.body.appendChild(elem);
    await (elem as any).ready;

    // After connection, should still have attributes
    expect(elem.hasAttribute('flag-a')).toBe(true);
    expect(elem.hasAttribute('flag-b')).toBe(true);
    expect((elem as any).flagA).toBe(true);
    expect((elem as any).flagB).toBe(true);
  });

  it('should handle nested elements with boolean attributes', async () => {
    @element('diff-parent')
    class DiffParent extends HTMLElement {
      @property() count = 0;

      @render()
      view() {
        return html`
          <div>
            <diff-child flag-a flag-b name="child1"></diff-child>
            <diff-child flag-b flag-c name="child2"></diff-child>
            <diff-child flag-a flag-c name="child3"></diff-child>
          </div>
        `;
      }
    }

    const parent = document.createElement('diff-parent') as DiffParent;
    document.body.appendChild(parent);
    await parent.ready;

    const children = parent.shadowRoot!.querySelectorAll('diff-child');
    expect(children.length).toBe(3);

    // Child 1: flag-a, flag-b
    expect(children[0].hasAttribute('flag-a')).toBe(true);
    expect(children[0].hasAttribute('flag-b')).toBe(true);
    expect(children[0].hasAttribute('flag-c')).toBe(false);

    // Child 2: flag-b, flag-c
    expect(children[1].hasAttribute('flag-a')).toBe(false);
    expect(children[1].hasAttribute('flag-b')).toBe(true);
    expect(children[1].hasAttribute('flag-c')).toBe(true);

    // Child 3: flag-a, flag-c
    expect(children[2].hasAttribute('flag-a')).toBe(true);
    expect(children[2].hasAttribute('flag-b')).toBe(false);
    expect(children[2].hasAttribute('flag-c')).toBe(true);
  });

  it('should handle programmatic attribute setting after connection', async () => {
    const elem = document.createElement('diff-child');
    document.body.appendChild(elem);
    await (elem as any).ready;

    // Initially no attributes
    expect(elem.hasAttribute('flag-a')).toBe(false);
    expect((elem as any).flagA).toBe(false);

    // Set attribute programmatically after connection
    elem.setAttribute('flag-a', '');

    // Should update property
    expect(elem.hasAttribute('flag-a')).toBe(true);
    expect((elem as any).flagA).toBe(true);

    // Set property programmatically
    (elem as any).flagB = true;

    // Should update attribute
    expect(elem.hasAttribute('flag-b')).toBe(true);
    expect((elem as any).flagB).toBe(true);
  });
});
