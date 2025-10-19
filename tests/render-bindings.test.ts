import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('@render decorator - property and attribute bindings', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should bind properties with .property syntax', async () => {
    @element('test-property-binding')
    class TestPropertyBinding extends HTMLElement {
      @property()
      inputValue = 'initial value';

      @render()
      renderContent() {
        return html`<input .value=${this.inputValue} />`;
      }
    }

    const el = document.createElement('test-property-binding') as TestPropertyBinding;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('initial value');

    // Change property
    el.inputValue = 'updated value';
    await new Promise(resolve => queueMicrotask(resolve));

    expect(input.value).toBe('updated value');
  });

  it('should bind boolean attributes with ?attribute syntax', async () => {
    @element('test-boolean-binding')
    class TestBooleanBinding extends HTMLElement {
      @property({ type: Boolean })
      isDisabled = false;

      @property({ type: Boolean })
      isChecked = false;

      @render()
      renderContent() {
        return html`
          <button ?disabled=${this.isDisabled}>Button</button>
          <input type="checkbox" ?checked=${this.isChecked} />
        `;
      }
    }

    const el = document.createElement('test-boolean-binding') as TestBooleanBinding;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    const checkbox = el.shadowRoot?.querySelector('input') as HTMLInputElement;

    // Initially false
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);

    // Set to true
    el.isDisabled = true;
    el.isChecked = true;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(button.hasAttribute('disabled')).toBe(true);
    expect(checkbox.hasAttribute('checked')).toBe(true);

    // Set back to false
    el.isDisabled = false;
    el.isChecked = false;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(button.hasAttribute('disabled')).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);
  });

  it('should bind regular attributes', async () => {
    @element('test-attribute-binding')
    class TestAttributeBinding extends HTMLElement {
      @property()
      linkHref = 'https://example.com';

      @property()
      imageAlt = 'Test Image';

      @render()
      renderContent() {
        return html`
          <a href=${this.linkHref}>Link</a>
          <img alt=${this.imageAlt} />
        `;
      }
    }

    const el = document.createElement('test-attribute-binding') as TestAttributeBinding;
    container.appendChild(el);
    await el.ready;

    const link = el.shadowRoot?.querySelector('a');
    const img = el.shadowRoot?.querySelector('img');

    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(img?.getAttribute('alt')).toBe('Test Image');

    // Update attributes
    el.linkHref = 'https://new-url.com';
    el.imageAlt = 'New Alt Text';
    await new Promise(resolve => queueMicrotask(resolve));

    expect(link?.getAttribute('href')).toBe('https://new-url.com');
    expect(img?.getAttribute('alt')).toBe('New Alt Text');
  });

  it('should handle class attribute binding', async () => {
    @element('test-class-binding')
    class TestClassBinding extends HTMLElement {
      @property()
      className = 'initial-class';

      @render()
      renderContent() {
        return html`<div class=${this.className}>Content</div>`;
      }
    }

    const el = document.createElement('test-class-binding') as TestClassBinding;
    container.appendChild(el);
    await el.ready;

    const div = el.shadowRoot?.querySelector('div');
    expect(div?.className).toBe('initial-class');

    el.className = 'updated-class';
    await new Promise(resolve => queueMicrotask(resolve));

    expect(div?.className).toBe('updated-class');
  });

  it('should handle style attribute binding', async () => {
    @element('test-style-binding')
    class TestStyleBinding extends HTMLElement {
      @property()
      styleValue = 'color: red;';

      @render()
      renderContent() {
        return html`<div style=${this.styleValue}>Styled</div>`;
      }
    }

    const el = document.createElement('test-style-binding') as TestStyleBinding;
    container.appendChild(el);
    await el.ready;

    const div = el.shadowRoot?.querySelector('div') as HTMLElement;
    expect(div.style.color).toBe('red');

    el.styleValue = 'color: blue; font-size: 20px;';
    await new Promise(resolve => queueMicrotask(resolve));

    expect(div.style.color).toBe('blue');
    expect(div.style.fontSize).toBe('20px');
  });

  it('should bind complex objects to properties', async () => {
    @element('test-custom-element')
    class TestCustomElement extends HTMLElement {
      @property({ type: Object })
      complexData: any = null;

      @render()
      renderContent() {
        return html`<div>${this.complexData?.name || 'No data'}</div>`;
      }
    }

    @element('test-object-binding')
    class TestObjectBinding extends HTMLElement {
      @property({ type: Object })
      data = { name: 'Test', value: 123 };

      @render()
      renderContent() {
        return html`<test-custom-element .complexData=${this.data}></test-custom-element>`;
      }
    }

    const el = document.createElement('test-object-binding') as TestObjectBinding;
    container.appendChild(el);
    await el.ready;

    const customEl = el.shadowRoot?.querySelector('test-custom-element') as any;
    await customEl.ready; // Wait for child element to be ready too

    expect(customEl.complexData).toEqual({ name: 'Test', value: 123 });
    expect(customEl.shadowRoot?.textContent).toBe('Test');
  });

  it('should handle null and undefined in bindings', async () => {
    @element('test-null-undefined')
    class TestNullUndefined extends HTMLElement {
      @property()
      nullValue: string | null = null;

      @property()
      undefinedValue: string | undefined = undefined;

      @render()
      renderContent() {
        return html`
          <div class="null">${this.nullValue}</div>
          <div class="undefined">${this.undefinedValue}</div>
        `;
      }
    }

    const el = document.createElement('test-null-undefined') as TestNullUndefined;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.null')?.textContent).toBe('');
    expect(el.shadowRoot?.querySelector('.undefined')?.textContent).toBe('');

    el.nullValue = 'not null';
    el.undefinedValue = 'defined';
    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.shadowRoot?.querySelector('.null')?.textContent).toBe('not null');
    expect(el.shadowRoot?.querySelector('.undefined')?.textContent).toBe('defined');
  });

  it('should handle number bindings', async () => {
    @element('test-number-binding')
    class TestNumberBinding extends HTMLElement {
      @property({ type: Number })
      count = 42;

      @property({ type: Number })
      percentage = 0.75;

      @render()
      renderContent() {
        return html`
          <div class="count">${this.count}</div>
          <div class="percentage">${this.percentage}</div>
        `;
      }
    }

    const el = document.createElement('test-number-binding') as TestNumberBinding;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('42');
    expect(el.shadowRoot?.querySelector('.percentage')?.textContent).toBe('0.75');

    el.count = 100;
    el.percentage = 1.5;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('100');
    expect(el.shadowRoot?.querySelector('.percentage')?.textContent).toBe('1.5');
  });
});
