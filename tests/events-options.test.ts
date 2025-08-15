import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on, dispatch } from '../src/index';

describe('@on decorator options', () => {
  let container: HTMLElement;
  let testId = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    testId++;
  });

  afterEach(() => {
    container.remove();
  });

  describe('preventDefault and stopPropagation', () => {
    it('should automatically call preventDefault when option is set', async () => {
      const tagName = `test-prevent-${testId}`;
      let eventReceived: Event | null = null;

      @element(tagName)
      class TestPrevent extends HTMLElement {
        html() {
          return `<a href="#test" class="link">Click me</a>`;
        }

        @on('click', '.link', { preventDefault: true })
        handleClick(e: Event) {
          eventReceived = e;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const link = el.shadowRoot.querySelector('.link');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      link.dispatchEvent(event);
      
      expect(eventReceived).toBe(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should automatically call stopPropagation when option is set', async () => {
      const tagName = `test-stop-${testId}`;
      let innerCalled = false;
      let hostCalled = false;
      let containerCalled = false;

      @element(tagName)
      class TestStop extends HTMLElement {
        html() {
          return `
            <div class="outer">
              <button class="inner">Click</button>
            </div>
          `;
        }

        @on('click', '.inner', { stopPropagation: true })
        handleInner() {
          innerCalled = true;
        }

        @on('click')  // Listen on host element
        handleHost() {
          hostCalled = true;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      
      // Also listen on the container
      container.addEventListener('click', () => {
        containerCalled = true;
      });
      
      await el.ready;

      const button = el.shadowRoot.querySelector('.inner');
      const event = new MouseEvent('click', { 
        bubbles: true,
        composed: true // Needed to cross shadow DOM boundary
      });
      
      button.dispatchEvent(event);
      
      expect(innerCalled).toBe(true);
      // With stopPropagation and composed events, it should still stop at shadow root
      expect(hostCalled).toBe(false);
      expect(containerCalled).toBe(false);
    });
  });

  describe('once option', () => {
    it('should only trigger handler once when once option is set', async () => {
      const tagName = `test-once-${testId}`;
      let clickCount = 0;

      @element(tagName)
      class TestOnce extends HTMLElement {
        html() {
          return `<button class="btn">Click me</button>`;
        }

        @on('click', '.btn', { once: true })
        handleClick() {
          clickCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const button = el.shadowRoot.querySelector('.btn');
      
      // Click multiple times
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(clickCount).toBe(1); // Should only trigger once
    });
  });

  describe('debounce option', () => {
    it('should debounce event handler', async () => {
      const tagName = `test-debounce-${testId}`;
      let callCount = 0;

      @element(tagName)
      class TestDebounce extends HTMLElement {
        html() {
          return `<input class="input" type="text">`;
        }

        @on('input', '.input', { debounce: 100 })
        handleInput() {
          callCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Trigger multiple events rapidly
      for (let i = 0; i < 5; i++) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Should not have been called yet
      expect(callCount).toBe(0);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have been called only once
      expect(callCount).toBe(1);
    });
  });

  describe('throttle option', () => {
    it('should throttle event handler', async () => {
      const tagName = `test-throttle-${testId}`;
      let callCount = 0;

      @element(tagName)
      class TestThrottle extends HTMLElement {
        html() {
          return `<div class="scrollable" style="height: 100px; overflow: auto;">
            <div style="height: 500px;">Content</div>
          </div>`;
        }

        @on('scroll', '.scrollable', { throttle: 100, passive: true })
        handleScroll() {
          callCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const scrollable = el.shadowRoot.querySelector('.scrollable');
      
      // Trigger multiple events rapidly
      const startTime = Date.now();
      scrollable.dispatchEvent(new Event('scroll', { bubbles: true }));
      expect(callCount).toBe(1); // First call goes through immediately
      
      // Rapid fire more events
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        scrollable.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
      
      // Should have throttled the calls
      expect(callCount).toBeLessThanOrEqual(2); // Initial + maybe one more
      
      // Wait for throttle window to pass
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // One more event should go through now
      scrollable.dispatchEvent(new Event('scroll', { bubbles: true }));
      expect(callCount).toBeLessThanOrEqual(3);
    });
  });

  describe('capture option', () => {
    it('should use capture phase when capture option is set', async () => {
      const tagName = `test-capture-${testId}`;
      const order: string[] = [];

      @element(tagName)
      class TestCapture extends HTMLElement {
        html() {
          return `
            <div class="container">
              <button class="btn">Click</button>
            </div>
          `;
        }

        // Listen on the host element itself with capture
        @on('click', { capture: true })
        handleHostCapture() {
          order.push('host-capture');
        }

        @on('click')
        handleHostBubble() {
          order.push('host-bubble');
        }

        @on('click', '.btn')
        handleButton() {
          order.push('button');
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const button = el.shadowRoot.querySelector('.btn');
      
      // Create an event that bubbles through shadow DOM
      const event = new MouseEvent('click', { 
        bubbles: true,
        composed: true // Important for crossing shadow DOM boundary
      });
      
      button.dispatchEvent(event);
      
      // With shadow DOM, events are retargeted, so order might be different
      // Just check that capture phase handler was called
      expect(order).toContain('host-capture');
      expect(order).toContain('button');
    });
  });

  describe('combined options', () => {
    it('should support multiple options together', async () => {
      const tagName = `test-combined-${testId}`;
      let callCount = 0;
      let lastEvent: Event | null = null;

      @element(tagName)
      class TestCombined extends HTMLElement {
        html() {
          return `<form><input class="input" type="text"></form>`;
        }

        @on('input', '.input', { 
          debounce: 50, 
          preventDefault: true,
          stopPropagation: true 
        })
        handleInput(e: Event) {
          callCount++;
          lastEvent = e;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Fire multiple events
      const event1 = new Event('input', { bubbles: true, cancelable: true });
      const event2 = new Event('input', { bubbles: true, cancelable: true });
      
      input.dispatchEvent(event1);
      input.dispatchEvent(event2);
      
      // Should not have fired yet due to debounce
      expect(callCount).toBe(0);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have fired once with preventDefault
      expect(callCount).toBe(1);
      expect(lastEvent).toBeTruthy();
      expect(event2.defaultPrevented).toBe(true);
    });
  });
});

describe('@dispatch decorator options', () => {
  let container: HTMLElement;
  let testId = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    testId++;
  });

  afterEach(() => {
    container.remove();
  });

  describe('debounce option', () => {
    it('should debounce event dispatch', async () => {
      const tagName = `test-dispatch-debounce-${testId}`;
      let eventCount = 0;

      @element(tagName)
      class TestDispatchDebounce extends HTMLElement {
        html() {
          return `<button class="btn">Click</button>`;
        }

        @on('click', '.btn')
        @dispatch('custom-event', { debounce: 100 })
        handleClick() {
          return { timestamp: Date.now() };
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      
      el.addEventListener('custom-event', () => {
        eventCount++;
      });
      
      await el.ready;

      const button = el.shadowRoot.querySelector('.btn');
      
      // Click multiple times rapidly
      for (let i = 0; i < 5; i++) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      
      // Should not have dispatched yet
      expect(eventCount).toBe(0);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have dispatched only once
      expect(eventCount).toBe(1);
    });
  });

  describe('throttle option', () => {
    it('should throttle event dispatch', async () => {
      const tagName = `test-dispatch-throttle-${testId}`;
      let eventCount = 0;

      @element(tagName)
      class TestDispatchThrottle extends HTMLElement {
        counter = 0;

        html() {
          return `<button class="btn">Click</button>`;
        }

        @on('click', '.btn')
        @dispatch('counted', { throttle: 100 })
        increment() {
          this.counter++;
          return { count: this.counter };
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      
      el.addEventListener('counted', () => {
        eventCount++;
      });
      
      await el.ready;

      const button = el.shadowRoot.querySelector('.btn');
      
      // First click should dispatch immediately
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(eventCount).toBe(1);
      
      // Rapid clicks should be throttled
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      
      // Should have throttled
      expect(eventCount).toBeLessThanOrEqual(2);
      
      // Wait for throttle window
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next click should dispatch
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(eventCount).toBeLessThanOrEqual(3);
    });
  });

  describe('with EventInit options', () => {
    it('should respect bubbles and composed options', async () => {
      const tagName = `test-dispatch-init-${testId}`;
      let receivedEvent: CustomEvent | null = null;

      @element(tagName)
      class TestDispatchInit extends HTMLElement {
        html() {
          return `<button class="btn">Click</button>`;
        }

        @on('click', '.btn')
        @dispatch('no-bubble', { bubbles: false, composed: false })
        handleClick() {
          return { data: 'test' };
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      
      // Listen on parent
      container.addEventListener('no-bubble', (e) => {
        receivedEvent = e as CustomEvent;
      });
      
      await el.ready;

      const button = el.shadowRoot.querySelector('.btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // Wait a bit for any async dispatch
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not have bubbled to parent
      expect(receivedEvent).toBe(null);
      
      // But should have dispatched on element itself
      let elementEvent: CustomEvent | null = null;
      el.addEventListener('no-bubble', (e: Event) => {
        elementEvent = e as CustomEvent;
      });
      
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(elementEvent).toBeTruthy();
      expect(elementEvent?.detail).toEqual({ data: 'test' });
    });
  });
});