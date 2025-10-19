import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, controller, on, dispatch, debounce, throttle, once, memoize, render, html } from '../src/index';

describe('Controller Decorators', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('@on in controllers', () => {
    it('should listen to custom events', async () => {
      const spy = vi.fn();

      @controller('event-listener')
      class EventListenerController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('custom-event')
        handleCustomEvent(e: CustomEvent) {
          spy(e.detail);
        }
      }

      @element('test-on-controller')
      class TestOnController extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-on-controller');
      el.setAttribute('controller', 'event-listener');
      container.appendChild(el);
      await el.ready;

      // Wait for controller to attach
      await new Promise(resolve => setTimeout(resolve, 10));

      // Dispatch custom event
      el.dispatchEvent(new CustomEvent('custom-event', {
        detail: { message: 'hello' }
      }));

      expect(spy).toHaveBeenCalledWith({ message: 'hello' });
    });

    it('should listen to multiple events', async () => {
      const clickSpy = vi.fn();
      const inputSpy = vi.fn();

      @controller('multi-event-listener')
      class MultiEventController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on(['click', 'input'])
        handleEvents(e: Event) {
          if (e.type === 'click') clickSpy();
          if (e.type === 'input') inputSpy();
        }
      }

      @element('test-multi-event')
      class TestMultiEvent extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-multi-event');
      el.setAttribute('controller', 'multi-event-listener');
      container.appendChild(el);
      await el.ready;

      await new Promise(resolve => setTimeout(resolve, 10));

      el.click();
      expect(clickSpy).toHaveBeenCalledTimes(1);

      el.dispatchEvent(new Event('input'));
      expect(inputSpy).toHaveBeenCalledTimes(1);
    });

    it('should cleanup event listeners on detach', async () => {
      const spy = vi.fn();

      @controller('cleanup-test')
      class CleanupController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('test-event')
        handleEvent() {
          spy();
        }
      }

      @element('test-cleanup')
      class TestCleanup extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-cleanup') as HTMLElement;
      el.setAttribute('controller', 'cleanup-test');
      container.appendChild(el);
      await (el as any).ready;

      await new Promise(resolve => setTimeout(resolve, 10));

      el.dispatchEvent(new Event('test-event'));
      expect(spy).toHaveBeenCalledTimes(1);

      // Remove controller
      el.removeAttribute('controller');
      await new Promise(resolve => setTimeout(resolve, 10));

      el.dispatchEvent(new Event('test-event'));
      // Should still be 1 - listener was removed
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Method decorators in controllers', () => {
    it('should work with @debounce on event handler', async () => {
      const spy = vi.fn();

      @controller('debounce-controller')
      class DebounceController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('rapid-change')
        @debounce(50)
        handleRapidChange(e: CustomEvent) {
          spy(e.detail.value);
        }
      }

      @element('test-debounce-controller')
      class TestDebounceController extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-debounce-controller');
      el.setAttribute('controller', 'debounce-controller');
      container.appendChild(el);
      await (el as any).ready;

      await new Promise(resolve => setTimeout(resolve, 20));

      // Rapid fire events
      el.dispatchEvent(new CustomEvent('rapid-change', { detail: { value: 'a' } }));
      el.dispatchEvent(new CustomEvent('rapid-change', { detail: { value: 'b' } }));
      el.dispatchEvent(new CustomEvent('rapid-change', { detail: { value: 'c' } }));

      expect(spy).toHaveBeenCalledTimes(0);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('c');
    });

    it('should work with @throttle on event handler', async () => {
      const spy = vi.fn();

      @controller('throttle-controller')
      class ThrottleController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('frequent-event')
        @throttle(100)
        handleFrequent() {
          spy();
        }
      }

      @element('test-throttle-controller')
      class TestThrottleController extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-throttle-controller');
      el.setAttribute('controller', 'throttle-controller');
      container.appendChild(el);
      await (el as any).ready;

      await new Promise(resolve => setTimeout(resolve, 20));

      el.dispatchEvent(new Event('frequent-event'));
      expect(spy).toHaveBeenCalledTimes(1);

      el.dispatchEvent(new Event('frequent-event'));
      el.dispatchEvent(new Event('frequent-event'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Combined @on and method decorators', () => {
    it('should combine @on with @debounce', async () => {
      const spy = vi.fn();

      @controller('combined-controller')
      class CombinedController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('rapid-event')
        @debounce(50)
        handleRapidEvent(e: CustomEvent) {
          spy(e.detail);
        }
      }

      @element('test-combined')
      class TestCombined extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-combined');
      el.setAttribute('controller', 'combined-controller');
      container.appendChild(el);
      await (el as any).ready;

      await new Promise(resolve => setTimeout(resolve, 20));

      // Rapid fire events
      el.dispatchEvent(new CustomEvent('rapid-event', { detail: 1 }));
      el.dispatchEvent(new CustomEvent('rapid-event', { detail: 2 }));
      el.dispatchEvent(new CustomEvent('rapid-event', { detail: 3 }));

      expect(spy).toHaveBeenCalledTimes(0);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(3);
    });

    it('should combine @on with @throttle', async () => {
      const spy = vi.fn();

      @controller('throttle-on-controller')
      class ThrottleOnController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('frequent-event')
        @throttle(100)
        handleFrequentEvent() {
          spy();
        }
      }

      @element('test-throttle-on')
      class TestThrottleOn extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }
      }

      const el = document.createElement('test-throttle-on');
      el.setAttribute('controller', 'throttle-on-controller');
      container.appendChild(el);
      await (el as any).ready;

      await new Promise(resolve => setTimeout(resolve, 20));

      el.dispatchEvent(new Event('frequent-event'));
      expect(spy).toHaveBeenCalledTimes(1);

      el.dispatchEvent(new Event('frequent-event'));
      el.dispatchEvent(new Event('frequent-event'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with @dispatch', () => {
    it('should work with @dispatch and @on', async () => {
      const spy = vi.fn();

      @controller('dispatch-listener')
      class DispatchListenerController {
        element!: HTMLElement;

        async attach() {}
        async detach() {}

        @on('data-updated')
        handleDataUpdated(e: CustomEvent) {
          spy(e.detail);
        }
      }

      @element('test-dispatch-on')
      class TestDispatchOn extends HTMLElement {
        @render()
        renderContent() {
          return html`<button @click=${this.updateData}>Update</button>`;
        }

        @dispatch('data-updated')
        updateData() {
          return { value: 42 };
        }
      }

      const el = document.createElement('test-dispatch-on') as TestDispatchOn;
      el.setAttribute('controller', 'dispatch-listener');
      container.appendChild(el);
      await el.ready;

      await new Promise(resolve => setTimeout(resolve, 20));

      const button = el.shadowRoot?.querySelector('button');
      button?.click();

      expect(spy).toHaveBeenCalledWith({ value: 42 });
    });
  });
});
