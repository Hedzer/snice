import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, styles, html, css } from '../src/index';

describe('@render decorator - basic functionality', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render basic template', async () => {
    @element('test-basic-render')
    class TestBasicRender extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="content">Hello World</div>`;
      }
    }

    const el = document.createElement('test-basic-render') as TestBasicRender;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.content')?.textContent).toBe('Hello World');
  });

  it('should render with property interpolation', async () => {
    @element('test-property-interpolation')
    class TestPropertyInterpolation extends HTMLElement {
      @property()
      message = 'Test Message';

      @render()
      renderContent() {
        return html`<div class="message">${this.message}</div>`;
      }
    }

    const el = document.createElement('test-property-interpolation') as TestPropertyInterpolation;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.message')?.textContent).toBe('Test Message');
  });

  it('should auto re-render when property changes', async () => {
    @element('test-auto-render')
    class TestAutoRender extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        return html`<div class="count">${this.count}</div>`;
      }
    }

    const el = document.createElement('test-auto-render') as TestAutoRender;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('0');

    // Change property
    el.count = 5;

    // Wait for microtask (auto-render batching)
    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('5');
  });

  it('should apply styles with @styles decorator', async () => {
    @element('test-styles')
    class TestStyles extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="styled">Styled Content</div>`;
      }

      @styles()
      componentStyles() {
        return css`
          .styled {
            color: rgb(255, 0, 0);
            font-size: 20px;
          }
        `;
      }
    }

    const el = document.createElement('test-styles') as TestStyles;
    container.appendChild(el);
    await el.ready;

    const styled = el.shadowRoot?.querySelector('.styled') as HTMLElement;
    expect(styled).toBeTruthy();

    const computedStyle = window.getComputedStyle(styled);
    expect(computedStyle.color).toBe('rgb(255, 0, 0)');
    expect(computedStyle.fontSize).toBe('20px');
  });

  it('should handle multiple property changes with batching', async () => {
    let renderCount = 0;

    @element('test-batching')
    class TestBatching extends HTMLElement {
      @property()
      firstName = 'John';

      @property()
      lastName = 'Doe';

      @render()
      renderContent() {
        renderCount++;
        return html`<div class="name">${this.firstName} ${this.lastName}</div>`;
      }
    }

    const el = document.createElement('test-batching') as TestBatching;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Change multiple properties
    el.firstName = 'Jane';
    el.lastName = 'Smith';

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Should only render once due to batching
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('Jane Smith');
  });

  it('should support nested templates', async () => {
    @element('test-nested')
    class TestNested extends HTMLElement {
      @property({ type: Boolean })
      showExtra = false;

      @render()
      renderContent() {
        return html`
          <div class="main">
            <span>Main Content</span>
            ${this.showExtra ? html`<span class="extra">Extra Content</span>` : ''}
          </div>
        `;
      }
    }

    const el = document.createElement('test-nested') as TestNested;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.extra')).toBeNull();

    el.showExtra = true;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.shadowRoot?.querySelector('.extra')?.textContent).toBe('Extra Content');
  });

  it('should render arrays with map', async () => {
    @element('test-array-map')
    class TestArrayMap extends HTMLElement {
      items = ['Apple', 'Banana', 'Cherry'];

      @render()
      renderContent() {
        return html`
          <ul>
            ${this.items.map(item => html`<li class="item">${item}</li>`)}
          </ul>
        `;
      }
    }

    const el = document.createElement('test-array-map') as TestArrayMap;
    container.appendChild(el);
    await el.ready;

    const items = el.shadowRoot?.querySelectorAll('.item');
    expect(items?.length).toBe(3);
    expect(items?.[0].textContent).toBe('Apple');
    expect(items?.[1].textContent).toBe('Banana');
    expect(items?.[2].textContent).toBe('Cherry');
  });

  it('should handle manual re-render by calling decorated method', async () => {
    @element('test-manual-render')
    class TestManualRender extends HTMLElement {
      data = 'initial';

      @render({ once: true })
      renderContent() {
        return html`<div class="data">${this.data}</div>`;
      }
    }

    const el = document.createElement('test-manual-render') as TestManualRender;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.querySelector('.data')?.textContent).toBe('initial');

    // Change data (won't auto-render due to once: true)
    el.data = 'changed';
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.querySelector('.data')?.textContent).toBe('initial');

    // Manual render
    (el as any).renderContent();
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.querySelector('.data')?.textContent).toBe('changed');
  });
});
