import { describe, it, expect, vi } from 'vitest';
import { element, render, on, html } from '../src/index';

describe('@on decorator - Multiple handlers on same event', () => {
  it('should fire all handlers when multiple @on decorators listen to the same event', async () => {
    const handler1Spy = vi.fn();
    const handler2Spy = vi.fn();
    const handler3Spy = vi.fn();

    @element('test-multi-click')
    class TestMultiClick extends HTMLElement {
      @render()
      renderContent() {
        return html`<button class="btn">Click Me</button>`;
      }

      @on('click')
      handleClick1(e: Event) {
        handler1Spy(e);
      }

      @on('click')
      handleClick2(e: Event) {
        handler2Spy(e);
      }

      @on('click')
      handleClick3(e: Event) {
        handler3Spy(e);
      }
    }

    const el = document.createElement('test-multi-click') as TestMultiClick;
    document.body.appendChild(el);
    await el.ready;

    // Click button in shadow DOM
    const button = el.shadowRoot?.querySelector('.btn') as HTMLButtonElement;
    button.click();

    // All three handlers should have been called exactly once
    expect(handler1Spy).toHaveBeenCalledTimes(1);
    expect(handler2Spy).toHaveBeenCalledTimes(1);
    expect(handler3Spy).toHaveBeenCalledTimes(1);

    // Click again
    button.click();
    expect(handler1Spy).toHaveBeenCalledTimes(2);
    expect(handler2Spy).toHaveBeenCalledTimes(2);
    expect(handler3Spy).toHaveBeenCalledTimes(2);

    // Click host element directly
    el.click();
    expect(handler1Spy).toHaveBeenCalledTimes(3);
    expect(handler2Spy).toHaveBeenCalledTimes(3);
    expect(handler3Spy).toHaveBeenCalledTimes(3);

    document.body.removeChild(el);
  });

  it('should not double-fire individual handlers when event bubbles from shadow to host', async () => {
    const handler1Spy = vi.fn();
    const handler2Spy = vi.fn();

    @element('test-no-double-fire')
    class TestNoDoubleFire extends HTMLElement {
      @render()
      renderContent() {
        return html`<button class="btn">Click Me</button>`;
      }

      @on('click')
      handleClick1(e: Event) {
        handler1Spy(e);
      }

      @on('click')
      handleClick2(e: Event) {
        handler2Spy(e);
      }
    }

    const el = document.createElement('test-no-double-fire') as TestNoDoubleFire;
    document.body.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('.btn') as HTMLButtonElement;
    button.click();

    // Each handler should be called exactly once, not twice
    // (The bug we're preventing would fire twice: once from shadowRoot, once from host)
    expect(handler1Spy).toHaveBeenCalledTimes(1);
    expect(handler2Spy).toHaveBeenCalledTimes(1);

    document.body.removeChild(el);
  });

  it('should allow same handler method to be called multiple times on repeated events', async () => {
    const handlerSpy = vi.fn();

    @element('test-repeated-events')
    class TestRepeatedEvents extends HTMLElement {
      @render()
      renderContent() {
        return html`<button class="btn">Click Me</button>`;
      }

      @on('click')
      handleClick(e: Event) {
        handlerSpy(e);
      }
    }

    const el = document.createElement('test-repeated-events') as TestRepeatedEvents;
    document.body.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('.btn') as HTMLButtonElement;

    // Click 5 times
    for (let i = 0; i < 5; i++) {
      button.click();
    }

    // Handler should be called 5 times
    expect(handlerSpy).toHaveBeenCalledTimes(5);

    document.body.removeChild(el);
  });

  it('should support one handler listening to multiple different events using array syntax', async () => {
    const handlerSpy = vi.fn();

    @element('test-multi-events')
    class TestMultiEvents extends HTMLElement {
      @render()
      renderContent() {
        return html`<button class="btn">Click Me</button>`;
      }

      @on(['click', 'custom-event'])
      handleMultipleEvents(e: Event) {
        console.log(`[TEST] Handler called for event: ${e.type}, target:`, e.target);
        handlerSpy(e.type);
      }
    }

    const el = document.createElement('test-multi-events') as TestMultiEvents;
    document.body.appendChild(el);
    await el.ready;

    const button = el.shadowRoot?.querySelector('.btn') as HTMLButtonElement;

    console.log('[TEST] Clicking button...');
    button.click();
    expect(handlerSpy).toHaveBeenCalledTimes(1);
    expect(handlerSpy).toHaveBeenLastCalledWith('click');

    console.log('[TEST] Dispatching custom-event on element itself...');
    el.dispatchEvent(new CustomEvent('custom-event', { bubbles: true }));
    console.log('[TEST] handlerSpy call count:', handlerSpy.mock.calls.length);
    console.log('[TEST] handlerSpy calls:', handlerSpy.mock.calls);
    expect(handlerSpy).toHaveBeenCalledTimes(2);
    expect(handlerSpy).toHaveBeenLastCalledWith('custom-event');

    document.body.removeChild(el);
  });
});
