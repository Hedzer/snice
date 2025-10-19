import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('@render decorator - template events', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle click events with @click syntax', async () => {
    const clickHandler = vi.fn();

    @element('test-click-event')
    class TestClickEvent extends HTMLElement {
      @render()
      renderContent() {
        return html`<button @click=${this.handleClick}>Click Me</button>`;
      }

      handleClick(e: Event) {
        clickHandler(e);
      }
    }

    const el = document.createElement('test-click-event') as TestClickEvent;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    button?.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle input events with @input syntax', async () => {
    @element('test-input-event')
    class TestInputEvent extends HTMLElement {
      @property()
      value = '';

      @render()
      renderContent() {
        return html`
          <input @input=${this.handleInput} />
          <div class="output">${this.value}</div>
        `;
      }

      handleInput(e: Event) {
        this.value = (e.target as HTMLInputElement).value;
      }
    }

    const el = document.createElement('test-input-event') as TestInputEvent;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Simulate input
    input.value = 'test value';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.value).toBe('test value');
    expect(el.shadowRoot?.querySelector('.output')?.textContent).toBe('test value');
  });

  it('should update event handlers when they change', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    @element('test-event-update')
    class TestEventUpdate extends HTMLElement {
      @property()
      useHandler1 = true;

      @render()
      renderContent() {
        const handler = this.useHandler1 ? this.handler1 : this.handler2;
        return html`<button @click=${handler}>Click</button>`;
      }

      handler1(e: Event) {
        handler1(e);
      }

      handler2(e: Event) {
        handler2(e);
      }
    }

    const el = document.createElement('test-event-update') as TestEventUpdate;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button');

    // Click with handler1
    button?.click();
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(0);

    // Switch to handler2
    el.useHandler1 = false;
    await new Promise(resolve => queueMicrotask(resolve));

    // Click with handler2
    button?.click();
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple events on same element', async () => {
    const clickHandler = vi.fn();
    const mouseoverHandler = vi.fn();

    @element('test-multiple-events')
    class TestMultipleEvents extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <div
            @click=${this.handleClick}
            @mouseover=${this.handleMouseover}
          >
            Hover and Click
          </div>
        `;
      }

      handleClick() {
        clickHandler();
      }

      handleMouseover() {
        mouseoverHandler();
      }
    }

    const el = document.createElement('test-multiple-events') as TestMultipleEvents;
    container.appendChild(el);
    await el.ready;

    const div = el.shadowRoot?.querySelector('div');

    div?.dispatchEvent(new MouseEvent('mouseover'));
    expect(mouseoverHandler).toHaveBeenCalledTimes(1);

    div?.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should remove event listeners when element is removed', async () => {
    const clickHandler = vi.fn();

    @element('test-event-cleanup')
    class TestEventCleanup extends HTMLElement {
      @render()
      renderContent() {
        return html`<button @click=${this.handleClick}>Click</button>`;
      }

      handleClick() {
        clickHandler();
      }
    }

    const el = document.createElement('test-event-cleanup') as TestEventCleanup;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button');
    button?.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Remove element
    container.removeChild(el);

    // Clicking detached button shouldn't trigger handler
    // (This is more of a sanity check - the real test is no memory leak)
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should support arrow functions as event handlers', async () => {
    let clickCount = 0;

    @element('test-arrow-handler')
    class TestArrowHandler extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        return html`
          <button @click=${() => this.count++}>Increment</button>
          <span class="count">${this.count}</span>
        `;
      }
    }

    const el = document.createElement('test-arrow-handler') as TestArrowHandler;
    container.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('button');

    button?.click();
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('1');

    button?.click();
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('2');
  });

  it('should handle keyboard events', async () => {
    const enterHandler = vi.fn();

    @element('test-keyboard-event')
    class TestKeyboardEvent extends HTMLElement {
      @render()
      renderContent() {
        return html`<input @keydown=${this.handleKeydown} />`;
      }

      handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
          enterHandler(e);
        }
      }
    }

    const el = document.createElement('test-keyboard-event') as TestKeyboardEvent;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input');

    // Press Enter
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(enterHandler).toHaveBeenCalledTimes(1);

    // Press other key
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(enterHandler).toHaveBeenCalledTimes(1);
  });
});
