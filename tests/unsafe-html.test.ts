import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, unsafeHTML } from '../src/index';

describe('unsafeHTML - raw HTML rendering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render raw HTML without escaping', async () => {
    @element('test-unsafe-html')
    class TestUnsafeHTML extends HTMLElement {
      @property()
      htmlContent = '<span class="raw">Hello</span>';

      @render()
      renderContent() {
        return html`<div class="container">${unsafeHTML(this.htmlContent)}</div>`;
      }
    }

    const el = document.createElement('test-unsafe-html') as TestUnsafeHTML;
    container.appendChild(el);
    await el.ready;

    // Check that the span element was actually created, not escaped
    const span = el.shadowRoot?.querySelector('.container .raw') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.tagName).toBe('SPAN');
    expect(span.textContent).toBe('Hello');
  });

  it('should escape regular string interpolation for XSS protection', async () => {
    @element('test-escaped-html')
    class TestEscapedHTML extends HTMLElement {
      @property()
      htmlContent = '<span class="dangerous">XSS</span>';

      @render()
      renderContent() {
        return html`<div class="container">${this.htmlContent}</div>`;
      }
    }

    const el = document.createElement('test-escaped-html') as TestEscapedHTML;
    container.appendChild(el);
    await el.ready;

    // Check that the HTML was escaped (no span element created)
    const span = el.shadowRoot?.querySelector('.container .dangerous');
    expect(span).toBeNull();

    // Check that the text content contains escaped HTML
    const containerText = el.shadowRoot?.querySelector('.container')?.textContent;
    expect(containerText).toContain('<span');
    expect(containerText).toContain('XSS');
  });

  it('should handle complex HTML structures with unsafeHTML', async () => {
    @element('test-complex-unsafe-html')
    class TestComplexUnsafeHTML extends HTMLElement {
      @property()
      htmlContent = `
        <div class="nested">
          <h1 class="title">Title</h1>
          <p class="description">Description</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;

      @render()
      renderContent() {
        return html`<div class="wrapper">${unsafeHTML(this.htmlContent)}</div>`;
      }
    }

    const el = document.createElement('test-complex-unsafe-html') as TestComplexUnsafeHTML;
    container.appendChild(el);
    await el.ready;

    // Verify nested structure was created
    expect(el.shadowRoot?.querySelector('.nested')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.title')?.textContent?.trim()).toBe('Title');
    expect(el.shadowRoot?.querySelector('.description')?.textContent?.trim()).toBe('Description');

    const items = el.shadowRoot?.querySelectorAll('li');
    expect(items?.length).toBe(2);
    expect(items?.[0].textContent?.trim()).toBe('Item 1');
    expect(items?.[1].textContent?.trim()).toBe('Item 2');
  });

  it('should update unsafeHTML content when property changes', async () => {
    @element('test-unsafe-html-update')
    class TestUnsafeHTMLUpdate extends HTMLElement {
      @property()
      htmlContent = '<span class="version-1">V1</span>';

      @render()
      renderContent() {
        return html`<div class="container">${unsafeHTML(this.htmlContent)}</div>`;
      }
    }

    const el = document.createElement('test-unsafe-html-update') as TestUnsafeHTMLUpdate;
    container.appendChild(el);
    await el.ready;

    // Check initial content
    expect(el.shadowRoot?.querySelector('.version-1')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.version-2')).toBeNull();

    // Update content
    el.htmlContent = '<span class="version-2">V2</span>';
    await new Promise(resolve => queueMicrotask(resolve));

    // Check updated content
    expect(el.shadowRoot?.querySelector('.version-1')).toBeNull();
    expect(el.shadowRoot?.querySelector('.version-2')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.version-2')?.textContent).toBe('V2');
  });

  it('should handle empty strings with unsafeHTML', async () => {
    @element('test-unsafe-html-empty')
    class TestUnsafeHTMLEmpty extends HTMLElement {
      @property()
      htmlContent = '';

      @render()
      renderContent() {
        return html`<div class="container">${unsafeHTML(this.htmlContent)}</div>`;
      }
    }

    const el = document.createElement('test-unsafe-html-empty') as TestUnsafeHTMLEmpty;
    container.appendChild(el);
    await el.ready;

    const contentDiv = el.shadowRoot?.querySelector('.container');
    expect(contentDiv).toBeTruthy();
    // Should have no visible content (only template markers)
    expect(contentDiv?.textContent).toBe('');
  });

  it('should handle attributes and classes in unsafeHTML', async () => {
    @element('test-unsafe-html-attributes')
    class TestUnsafeHTMLAttributes extends HTMLElement {
      @property()
      htmlContent = '<button class="btn primary" data-action="submit" disabled>Submit</button>';

      @render()
      renderContent() {
        return html`<div class="container">${unsafeHTML(this.htmlContent)}</div>`;
      }
    }

    const el = document.createElement('test-unsafe-html-attributes') as TestUnsafeHTMLAttributes;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.classList.contains('btn')).toBe(true);
    expect(button.classList.contains('primary')).toBe(true);
    expect(button.getAttribute('data-action')).toBe('submit');
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Submit');
  });

  it('should support mixing unsafeHTML with regular template content', async () => {
    @element('test-mixed-unsafe-html')
    class TestMixedUnsafeHTML extends HTMLElement {
      @property()
      title = 'Title';

      @property()
      htmlContent = '<em class="emphasis">emphasized</em>';

      @render()
      renderContent() {
        return html`
          <div class="mixed">
            <h1>${this.title}</h1>
            <p>This is ${unsafeHTML(this.htmlContent)} text</p>
          </div>
        `;
      }
    }

    const el = document.createElement('test-mixed-unsafe-html') as TestMixedUnsafeHTML;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('h1')?.textContent).toBe('Title');

    const em = el.shadowRoot?.querySelector('.emphasis') as HTMLElement;
    expect(em).toBeTruthy();
    expect(em.tagName).toBe('EM');
    expect(em.textContent).toBe('emphasized');

    const p = el.shadowRoot?.querySelector('p');
    expect(p?.textContent?.trim()).toBe('This is emphasized text');
  });

  it('should handle boolean cell use case (regression test)', async () => {
    @element('test-boolean-cell')
    class TestBooleanCell extends HTMLElement {
      @property({ type: Boolean })
      value = true;

      formatBooleanContent(): string {
        const symbol = this.value ? '✅' : '❌';
        const colorClass = this.value ? 'boolean--true' : 'boolean--false';
        return `<span class="${colorClass}">${symbol}</span>`;
      }

      @render()
      renderContent() {
        const content = this.formatBooleanContent();
        return html`
          <div class="cell-content">
            ${unsafeHTML(content)}
          </div>
        `;
      }
    }

    const el = document.createElement('test-boolean-cell') as TestBooleanCell;
    container.appendChild(el);
    await el.ready;

    // Verify the span element was created (not escaped)
    const span = el.shadowRoot?.querySelector('.cell-content span.boolean--true') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.textContent).toBe('✅');

    // Change value
    el.value = false;
    await new Promise(resolve => queueMicrotask(resolve));

    // Verify updated content
    const spanFalse = el.shadowRoot?.querySelector('.cell-content span.boolean--false') as HTMLElement;
    expect(spanFalse).toBeTruthy();
    expect(spanFalse.textContent).toBe('❌');
    expect(el.shadowRoot?.querySelector('.boolean--true')).toBeNull();
  });
});
