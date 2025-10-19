import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, dispatch, render, html } from '../src/index';

// Helper to generate unique names to avoid state conflicts  
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('@dispatch decorator', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should dispatch event after method completion', async () => {
    @element('test-dispatch-basic')
    class TestDispatchBasic extends HTMLElement {
      @dispatch('data-updated')
      updateData() {
        return { value: 42 };
      }

      html() {
        return '<button>Update</button>';
      }
    }

    const el = document.createElement('test-dispatch-basic') as any;
    container.appendChild(el);

    const eventPromise = new Promise((resolve) => {
      el.addEventListener('data-updated', (e: CustomEvent) => {
        resolve(e.detail);
      });
    });

    el.updateData();
    const detail = await eventPromise;
    
    expect(detail).toEqual({ value: 42 });
  });

  it('should work with async methods', async () => {
    @element('test-dispatch-async')
    class TestDispatchAsync extends HTMLElement {
      @dispatch('async-complete')
      async fetchData() {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { status: 'success', data: [1, 2, 3] };
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-async') as any;
    container.appendChild(el);

    const eventPromise = new Promise((resolve) => {
      el.addEventListener('async-complete', (e: CustomEvent) => {
        resolve(e.detail);
      });
    });

    await el.fetchData();
    const detail = await eventPromise;
    
    expect(detail).toEqual({ status: 'success', data: [1, 2, 3] });
  });

  it('should respect dispatchOnUndefined option', async () => {
    @element('test-dispatch-undefined')
    class TestDispatchUndefined extends HTMLElement {
      @dispatch('maybe-event', { dispatchOnUndefined: false })
      maybeReturn(shouldReturn: boolean) {
        if (shouldReturn) {
          return { hasData: true };
        }
        // Returns undefined
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-undefined') as any;
    container.appendChild(el);

    let eventFired = false;
    el.addEventListener('maybe-event', () => {
      eventFired = true;
    });

    // Should not dispatch when returning undefined
    el.maybeReturn(false);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(eventFired).toBe(false);

    // Should dispatch when returning a value
    el.maybeReturn(true);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(eventFired).toBe(true);
  });

  it('should bubble by default', async () => {
    @element('test-dispatch-bubble')
    class TestDispatchBubble extends HTMLElement {
      @dispatch('bubble-event')
      triggerBubble() {
        return { bubbled: true };
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-bubble') as any;
    container.appendChild(el);

    const parentEventPromise = new Promise((resolve) => {
      container.addEventListener('bubble-event', (e: CustomEvent) => {
        resolve(e.detail);
      });
    });

    el.triggerBubble();
    const detail = await parentEventPromise;
    
    expect(detail).toEqual({ bubbled: true });
  });

  it('should respect custom EventInit options', async () => {
    @element('test-dispatch-options')
    class TestDispatchOptions extends HTMLElement {
      @dispatch('custom-event', { bubbles: false, cancelable: true })
      triggerCustom() {
        return { custom: true };
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-options') as any;
    container.appendChild(el);

    let parentEventFired = false;
    container.addEventListener('custom-event', () => {
      parentEventFired = true;
    });

    let eventObj: CustomEvent | null = null;
    el.addEventListener('custom-event', (e: CustomEvent) => {
      eventObj = e;
    });

    el.triggerCustom();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should not bubble to parent
    expect(parentEventFired).toBe(false);
    
    // Should be cancelable
    expect(eventObj?.cancelable).toBe(true);
    expect(eventObj?.detail).toEqual({ custom: true });
  });

  it('should work with @on decorator combination', async () => {
    @element('test-dispatch-combo')
    class TestDispatchCombo extends HTMLElement {
      count = 0;

      @render()
      renderContent() {
        return html`<button id="increment" @click=${this.increment}>Increment</button>`;
      }

      @dispatch('count-changed')
      increment() {
        this.count++;
        return { count: this.count };
      }
    }

    const el = document.createElement('test-dispatch-combo') as any;
    container.appendChild(el);
    await el.ready;

    const eventPromise = new Promise((resolve) => {
      el.addEventListener('count-changed', (e: CustomEvent) => {
        resolve(e.detail);
      });
    });

    // Simulate click
    const button = el.shadowRoot.querySelector('#increment');
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const detail = await eventPromise;
    expect(detail).toEqual({ count: 1 });
  });

  it('should handle errors gracefully', async () => {
    @element('test-dispatch-error')
    class TestDispatchError extends HTMLElement {
      @dispatch('error-event')
      throwError() {
        throw new Error('Test error');
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-error') as any;
    container.appendChild(el);

    let eventFired = false;
    el.addEventListener('error-event', () => {
      eventFired = true;
    });

    // Should throw but not dispatch
    expect(() => el.throwError()).toThrow('Test error');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(eventFired).toBe(false);
  });

  it('should dispatch with void return as undefined detail', async () => {
    @element('test-dispatch-void')
    class TestDispatchVoid extends HTMLElement {
      sideEffect = '';

      @dispatch('void-event')
      performAction() {
        this.sideEffect = 'done';
        // No return statement
      }

      html() {
        return '<div></div>';
      }
    }

    const el = document.createElement('test-dispatch-void') as any;
    container.appendChild(el);

    const eventPromise = new Promise((resolve) => {
      el.addEventListener('void-event', (e: CustomEvent) => {
        resolve(e.detail);
      });
    });

    el.performAction();
    const detail = await eventPromise;
    
    // CustomEvent converts undefined to null
    expect(detail).toBeNull();
    expect(el.sideEffect).toBe('done');
  });

  it('should cross shadow DOM boundaries with composed events', async () => {
    // Create a child element with shadow DOM that dispatches events
    @element('test-shadow-child')
    class TestShadowChild extends HTMLElement {
      @dispatch('child-event')
      triggerEvent() {
        return { message: 'from shadow child' };
      }

      @render()
      renderContent() {
        return html`<button id="trigger">Trigger</button>`;
      }
    }

    // Create a parent element that contains the child
    @element('test-shadow-parent')
    class TestShadowParent extends HTMLElement {
      @render()
      renderContent() {
        return html`<test-shadow-child></test-shadow-child>`;
      }
    }

    const parent = document.createElement('test-shadow-parent');
    container.appendChild(parent);
    await parent.ready;

    // Wait for child to be ready
    await new Promise(resolve => setTimeout(resolve, 10));

    const child = parent.shadowRoot!.querySelector('test-shadow-child') as any;

    // Listen for event at the document level
    const eventPromise = new Promise((resolve) => {
      document.addEventListener('child-event', (e: Event) => {
        resolve((e as CustomEvent).detail);
      }, { once: true });
    });

    // Trigger event from within shadow DOM
    child.triggerEvent();
    const detail = await eventPromise;

    expect(detail).toEqual({ message: 'from shadow child' });
  });

  it('should allow nested shadow DOM event propagation', async () => {
    // Create a simpler test with just one level of nesting
    @element('test-nested-child')
    class TestNestedChild extends HTMLElement {
      @dispatch('nested-event')
      fireEvent() {
        return { from: 'child' };
      }

      @render()
      renderContent() {
        return html`<button id="fire">Fire Event</button>`;
      }
    }

    @element('test-nested-parent')
    class TestNestedParent extends HTMLElement {
      @render()
      renderContent() {
        return html`<test-nested-child></test-nested-child>`;
      }
    }

    const parent = document.createElement('test-nested-parent');
    container.appendChild(parent);
    await parent.ready;

    // Wait for elements to be connected
    await new Promise(resolve => setTimeout(resolve, 10));

    // Listen at the parent level
    const eventPromise = new Promise((resolve) => {
      parent.addEventListener('nested-event', (e: Event) => {
        resolve((e as CustomEvent).detail);
      });
    });

    // Get child and trigger event
    const child = parent.shadowRoot!.querySelector('test-nested-child') as any;
    child.fireEvent();
    
    const detail = await eventPromise;
    expect(detail).toEqual({ from: 'child' });
  });
});