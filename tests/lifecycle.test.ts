import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, ready, dispose, moved, adopted } from './test-imports';
import { controller } from './test-imports';

describe('element lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('connectedCallback', () => {
    it('should preserve existing connectedCallback', () => {
      const originalCallback = vi.fn();
      
      @element('preserve-connected')
      class PreserveConnected extends HTMLElement {
        connectedCallback() {
          originalCallback(this);
        }
      }
      
      const el = document.createElement('preserve-connected');
      document.body.appendChild(el);
      
      expect(originalCallback).toHaveBeenCalledWith(el);
    });

    it('should call html() method', () => {
      const htmlSpy = vi.fn(() => '<div>Content</div>');
      
      @element('test-html-call')
      class TestHtmlCall extends HTMLElement {
        html = htmlSpy;
      }
      
      const el = document.createElement('test-html-call');
      document.body.appendChild(el);
      
      expect(htmlSpy).toHaveBeenCalled();
      expect(el.shadowRoot?.innerHTML).toBe('<div>Content</div>');
    });

    it('should call css() method after html()', () => {
      const order: string[] = [];
      
      @element('test-order')
      class TestOrder extends HTMLElement {
        html() {
          order.push('html');
          return '<div>Content</div>';
        }
        
        css() {
          order.push('css');
          return '.test { color: red; }';
        }
      }
      
      const el = document.createElement('test-order');
      document.body.appendChild(el);
      
      expect(order).toEqual(['html', 'css']);
    });

    it('should handle html() returning undefined', () => {
      @element('undefined-html')
      class UndefinedHtml extends HTMLElement {
        html() {
          return undefined;
        }
      }
      
      const el = document.createElement('undefined-html');
      document.body.appendChild(el);
      
      expect(el.shadowRoot?.innerHTML).toBe('');
    });

    it('should handle css() returning undefined', () => {
      @element('undefined-css')
      class UndefinedCss extends HTMLElement {
        css() {
          return undefined;
        }
      }
      
      const el = document.createElement('undefined-css');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      expect(style).toBeNull();
    });

    it('should handle css() returning empty string', () => {
      @element('empty-css')
      class EmptyCss extends HTMLElement {
        css() {
          return '';
        }
      }
      
      const el = document.createElement('empty-css');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      expect(style).toBeNull();
    });
  });

  describe('disconnectedCallback', () => {
    it('should preserve existing disconnectedCallback', () => {
      const originalCallback = vi.fn();
      
      @element('preserve-disconnected')
      class PreserveDisconnected extends HTMLElement {
        disconnectedCallback() {
          originalCallback(this);
        }
      }
      
      const el = document.createElement('preserve-disconnected');
      document.body.appendChild(el);
      document.body.removeChild(el);
      
      expect(originalCallback).toHaveBeenCalledWith(el);
    });

    it('should detach controller on disconnect', async () => {
      const detachSpy = vi.fn();
      
      @controller('lifecycle-ctrl')
      class LifecycleController {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          this.element = element;
        }
        async detach() {
          detachSpy();
          this.element = null;
        }
      }
      
      @element('test-controller-detach')
      class TestControllerDetach extends HTMLElement {}
      
      const el = document.createElement('test-controller-detach');
      el.setAttribute('controller', 'lifecycle-ctrl');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      document.body.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(detachSpy).toHaveBeenCalled();
    });
  });

  describe('attributeChangedCallback', () => {
    it('should preserve existing attributeChangedCallback', () => {
      const originalCallback = vi.fn();
      
      @element('preserve-attr-changed')
      class PreserveAttrChanged extends HTMLElement {
        static get observedAttributes() {
          return ['test-attr'];
        }
        
        attributeChangedCallback(name: string, oldValue: string, newValue: string) {
          originalCallback(name, oldValue, newValue);
        }
      }
      
      const el = document.createElement('preserve-attr-changed');
      document.body.appendChild(el);
      el.setAttribute('test-attr', 'value');
      
      expect(originalCallback).toHaveBeenCalledWith('test-attr', null, 'value');
    });

    it('should observe controller attribute', async () => {
      const attach1Spy = vi.fn();
      const attach2Spy = vi.fn();
      const detach1Spy = vi.fn();
      
      @controller('ctrl-a')
      class ControllerA {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          attach1Spy(element);
          this.element = element;
        }
        async detach() {
          detach1Spy();
          this.element = null;
        }
      }
      
      @controller('ctrl-b')
      class ControllerB {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          attach2Spy(element);
          this.element = element;
        }
        async detach() {
          this.element = null;
        }
      }
      
      @element('test-controller-switch')
      class TestControllerSwitch extends HTMLElement {}
      
      const el = document.createElement('test-controller-switch');
      document.body.appendChild(el);
      
      // Set first controller
      el.setAttribute('controller', 'ctrl-a');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(attach1Spy).toHaveBeenCalled();
      
      // Switch to second controller
      el.setAttribute('controller', 'ctrl-b');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(detach1Spy).toHaveBeenCalled();
      expect(attach2Spy).toHaveBeenCalled();
    });
  });

  describe('element registration', () => {
    it('should register element with custom elements registry', () => {
      @element('registry-test')
      class RegistryTest extends HTMLElement {}
      
      const ElementClass = customElements.get('registry-test');
      expect(ElementClass).toBeDefined();
      expect(ElementClass).toBe(RegistryTest);
    });

    it('should be instantiable via document.createElement', () => {
      @element('create-test')
      class CreateTest extends HTMLElement {
        html() {
          return '<div>Created</div>';
        }
      }
      
      const el = document.createElement('create-test');
      expect(el).toBeInstanceOf(CreateTest);
      
      document.body.appendChild(el);
      expect(el.shadowRoot?.innerHTML).toBe('<div>Created</div>');
    });

    it('should be instantiable via innerHTML', () => {
      @element('inner-html-test')
      class InnerHTMLTest extends HTMLElement {
        html() {
          return '<div>Via innerHTML</div>';
        }
      }
      
      const container = document.createElement('div');
      container.innerHTML = '<inner-html-test></inner-html-test>';
      document.body.appendChild(container);
      
      const el = container.querySelector('inner-html-test');
      expect(el).toBeInstanceOf(InnerHTMLTest);
      expect(el?.shadowRoot?.innerHTML).toBe('<div>Via innerHTML</div>');
    });
  });

  describe('@ready decorator', () => {
    it('should call ready method after element is ready', async () => {
      const connectedSpy = vi.fn();
      
      @element('ready-test')
      class ReadyTest extends HTMLElement {
        @ready()
        onReady() {
          connectedSpy();
          // Shadow DOM should be ready
          expect(this.shadowRoot).toBeTruthy();
        }
        
        html() {
          return '<div>Test</div>';
        }
      }
      
      const el = document.createElement('ready-test');
      document.body.appendChild(el);
      
      await (el as any).ready;
      
      expect(connectedSpy).toHaveBeenCalledOnce();
    });

    it('should support multiple ready methods', async () => {
      const order: string[] = [];
      
      @element('multi-ready')
      class MultiReady extends HTMLElement {
        @ready()
        firstReady() {
          order.push('first');
        }
        
        @ready()
        secondReady() {
          order.push('second');
        }
        
        html() {
          return '<div>Test</div>';
        }
      }
      
      const el = document.createElement('multi-ready');
      document.body.appendChild(el);
      
      await (el as any).ready;
      
      expect(order).toEqual(['first', 'second']);
    });

    it('should handle manual cleanup with @dispose', async () => {
      let counter = 0;
      let intervalId: any;
      
      @element('manual-interval-cleanup')
      class ManualIntervalCleanup extends HTMLElement {
        private intervalId: any;
        
        @ready()
        startInterval() {
          this.intervalId = setInterval(() => {
            counter++;
          }, 20);
        }
        
        @dispose()
        stopInterval() {
          if (this.intervalId) {
            clearInterval(this.intervalId);
          }
        }
        
        html() {
          return '<div>Test</div>';
        }
      }
      
      const el = document.createElement('manual-interval-cleanup');
      document.body.appendChild(el);
      
      await (el as any).ready;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const countBefore = counter;
      expect(countBefore).toBeGreaterThan(0);
      
      // Remove element to trigger cleanup
      document.body.removeChild(el);
      // Give time for async disconnectedCallback to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const countAfterDisconnect = counter;
      
      // Wait more to verify interval is stopped
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Counter should not have increased after dispose handler cleared it
      expect(counter).toBe(countAfterDisconnect);
    });
  });

  describe('@dispose decorator', () => {
    it('should call dispose method when element is removed', async () => {
      const disconnectedSpy = vi.fn();
      
      @element('dispose-decorator-test')
      class DisposeTest extends HTMLElement {
        @dispose()
        onDispose() {
          disconnectedSpy();
        }
        
        html() {
          return '<div>Test</div>';
        }
      }
      
      const el = document.createElement('dispose-decorator-test');
      document.body.appendChild(el);
      
      await (el as any).ready;
      expect(disconnectedSpy).not.toHaveBeenCalled();
      
      document.body.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(disconnectedSpy).toHaveBeenCalledOnce();
    });

    it('should support multiple dispose methods', async () => {
      const order: string[] = [];
      
      @element('multi-dispose')
      class MultiDispose extends HTMLElement {
        @dispose()
        firstDispose() {
          order.push('first');
        }
        
        @dispose()
        secondDispose() {
          order.push('second');
        }
        
        html() {
          return '<div>Test</div>';
        }
      }
      
      const el = document.createElement('multi-dispose');
      document.body.appendChild(el);
      
      await (el as any).ready;
      
      document.body.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(order).toEqual(['first', 'second']);
    });
  });

  describe('reconnection', () => {
    it('should not duplicate styles on reconnect', () => {
      @element('reconnect-test')
      class ReconnectTest extends HTMLElement {
        css() {
          return '.test { color: green; }';
        }
      }
      
      const el = document.createElement('reconnect-test');
      document.body.appendChild(el);
      
      // Remove and re-add
      document.body.removeChild(el);
      document.body.appendChild(el);
      
      const styles = el.shadowRoot?.querySelectorAll('style[data-component-css]');
      expect(styles?.length).toBe(1);
    });

    it('should NOT re-render html on reconnect', () => {
      let renderCount = 0;

      @element('rerender-test')
      class RerenderTest extends HTMLElement {
        html() {
          renderCount++;
          return `<div>Render ${renderCount}</div>`;
        }
      }

      const el = document.createElement('rerender-test');
      document.body.appendChild(el);
      expect(el.shadowRoot?.innerHTML).toBe('<div>Render 1</div>');

      document.body.removeChild(el);
      document.body.appendChild(el);
      // Should still be the same content - no re-render
      expect(el.shadowRoot?.innerHTML).toBe('<div>Render 1</div>');
      expect(renderCount).toBe(1); // html() called only once
    });
  });

  describe('advanced lifecycle callbacks', () => {
    describe('@moved decorator', () => {
      it('should call @moved handler when connectedMoveCallback is triggered', async () => {
        const movedSpy = vi.fn();

        @element('moved-test')
        class MovedTest extends HTMLElement {
          @moved()
          onMoved() {
            movedSpy();
          }
        }

        const el = document.createElement('moved-test') as MovedTest;
        document.body.appendChild(el);

        // Manually trigger connectedMoveCallback since moveBefore() might not be available
        if (el.connectedMoveCallback) {
          await el.connectedMoveCallback();
        }

        expect(movedSpy).toHaveBeenCalledTimes(1);
      });

      it('should support multiple @moved handlers', async () => {
        const firstSpy = vi.fn();
        const secondSpy = vi.fn();

        @element('multi-moved-test')
        class MultiMovedTest extends HTMLElement {
          @moved()
          onFirstMoved() {
            firstSpy();
          }

          @moved()
          onSecondMoved() {
            secondSpy();
          }
        }

        const el = document.createElement('multi-moved-test') as MultiMovedTest;
        document.body.appendChild(el);

        if (el.connectedMoveCallback) {
          await el.connectedMoveCallback();
        }

        expect(firstSpy).toHaveBeenCalledTimes(1);
        expect(secondSpy).toHaveBeenCalledTimes(1);
      });

      it('should debounce @moved calls', async () => {
        const movedSpy = vi.fn();

        @element('debounced-moved-test')
        class DebouncedMovedTest extends HTMLElement {
          @moved({ debounce: 100 })
          onMoved() {
            movedSpy();
          }
        }

        const el = document.createElement('debounced-moved-test') as DebouncedMovedTest;
        document.body.appendChild(el);

        // Call multiple times rapidly
        el.onMoved();
        el.onMoved();
        el.onMoved();

        // Should not be called yet
        expect(movedSpy).toHaveBeenCalledTimes(0);

        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 150));

        // Should be called only once
        expect(movedSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('@adopted decorator', () => {
      it('should call @adopted handler when adoptedCallback is triggered', async () => {
        const adoptedSpy = vi.fn();

        @element('adopted-test')
        class AdoptedTest extends HTMLElement {
          @adopted()
          onAdopted() {
            adoptedSpy();
          }
        }

        const el = document.createElement('adopted-test') as AdoptedTest;
        document.body.appendChild(el);

        // Manually trigger adoptedCallback
        if (el.adoptedCallback) {
          await el.adoptedCallback();
        }

        expect(adoptedSpy).toHaveBeenCalledTimes(1);
      });

      it('should throttle @adopted calls', async () => {
        const adoptedSpy = vi.fn();

        @element('throttled-adopted-test')
        class ThrottledAdoptedTest extends HTMLElement {
          @adopted({ throttle: 100 })
          onAdopted() {
            adoptedSpy();
          }
        }

        const el = document.createElement('throttled-adopted-test') as ThrottledAdoptedTest;
        document.body.appendChild(el);

        // First call should execute immediately
        el.onAdopted();
        expect(adoptedSpy).toHaveBeenCalledTimes(1);

        // Rapid subsequent calls should be throttled
        el.onAdopted();
        el.onAdopted();
        expect(adoptedSpy).toHaveBeenCalledTimes(1);

        // Wait for throttle period
        await new Promise(resolve => setTimeout(resolve, 150));

        // Should execute the throttled call
        expect(adoptedSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});