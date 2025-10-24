import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('Property Attribute Synchronization - Adding Attributes', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should react when adding attribute that did not exist before', async () => {
    @element('test-add-attr')
    class TestAddAttr extends HTMLElement {
      @property({ type: String })
      variant: string = 'default';

      @render()
      renderContent() {
        return html`<div class="variant-${this.variant}">Test</div>`;
      }
    }

    const el = document.createElement('test-add-attr') as any;
    container.appendChild(el);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Initially no variant attribute
    expect(el.hasAttribute('variant')).toBe(false);
    expect(el.variant).toBe('default');
    expect(el.shadowRoot?.querySelector('.variant-default')).toBeTruthy();

    // Add variant attribute
    el.setAttribute('variant', 'circle');

    await new Promise(resolve => setTimeout(resolve, 10));

    // Should update property and re-render
    expect(el.variant).toBe('circle');
    expect(el.shadowRoot?.querySelector('.variant-circle')).toBeTruthy();
  });

  it('should react when changing newly added attribute', async () => {
    @element('test-change-attr')
    class TestChangeAttr extends HTMLElement {
      @property({ type: String })
      size: string = 'medium';

      @render()
      renderContent() {
        return html`<div class="size-${this.size}">Test</div>`;
      }
    }

    const el = document.createElement('test-change-attr') as any;
    container.appendChild(el);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Add attribute
    el.setAttribute('size', 'small');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.shadowRoot?.querySelector('.size-small')).toBeTruthy();

    // Change it
    el.setAttribute('size', 'large');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.shadowRoot?.querySelector('.size-large')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.size-small')).toBeFalsy();
  });
});
