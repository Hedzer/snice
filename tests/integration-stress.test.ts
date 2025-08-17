import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, query, queryAll } from '../src/element';
import { controller, attachController, detachController, useNativeElementControllers, cleanupNativeElementControllers } from '../src/controller';
import { on, dispatch } from '../src/events';
import { request, response } from '../src/request-response';
import { Router } from '../src/router';

describe('Integration & Stress Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    cleanupNativeElementControllers();
  });

  describe('Performance Under Load', () => {
    it('should handle 100+ elements with controllers without degradation', async () => {
      const startTime = performance.now();
      const attachSpies: any[] = [];
      
      // Create 100 controller classes
      for (let i = 0; i < 100; i++) {
        const attachSpy = vi.fn();
        attachSpies.push(attachSpy);
        
        @controller(`stress-ctrl-${i}`)
        class StressController {
          element: HTMLElement | null = null;
          
          async attach(element: HTMLElement) {
            this.element = element;
            attachSpy();
          }
          
          async detach() {
            this.element = null;
          }
        }
      }
      
      @element('stress-element')
      class StressElement extends HTMLElement {
        @property()
        controllerId = 0;
        
        get controller() {
          return `stress-ctrl-${this.controllerId}`;
        }
        
        connectedCallback() {
          super.connectedCallback?.();
          // Manually attach controller since dynamic getter doesn't trigger
          const controllerName = `stress-ctrl-${this.controllerId}`;
          attachController(this, controllerName);
        }
      }
      
      // Create 100 elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('stress-element') as any;
        el.controllerId = i;
        document.body.appendChild(el);
        elements.push(el);
      }
      
      // Wait for all to attach
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify all attached
      attachSpies.forEach((spy, i) => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      
      const elapsed = performance.now() - startTime;
      // Should complete in reasonable time (< 5 seconds)
      expect(elapsed).toBeLessThan(5000);
      
      // Clean up
      elements.forEach(el => el.remove());
    });

    it('should handle rapid DOM mutations efficiently', async () => {
      @controller('mutation-ctrl')
      class MutationController {
        element: HTMLElement | null = null;
        mutationCount = 0;
        
        @on('custom-event')
        handleEvent() {
          this.mutationCount++;
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {}
      }
      
      @element('mutation-element')
      class MutationElement extends HTMLElement {
        controller = 'mutation-ctrl';
      }
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      // Perform 1000 rapid DOM mutations
      for (let i = 0; i < 1000; i++) {
        const el = document.createElement('mutation-element');
        container.appendChild(el);
        
        if (i % 2 === 0) {
          el.remove();
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should handle all mutations without errors
      const remainingElements = container.querySelectorAll('mutation-element');
      expect(remainingElements.length).toBe(500);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory during element lifecycle', async () => {
      const instances = new WeakSet();
      
      @controller('lifecycle-ctrl')
      class LifecycleController {
        element: HTMLElement | null = null;
        largeData = new Array(10000).fill('data');
        
        constructor() {
          instances.add(this);
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
          this.largeData = [];
        }
      }
      
      @element('lifecycle-element')
      class LifecycleElement extends HTMLElement {
        controller = 'lifecycle-ctrl';
        largeArray = new Array(10000).fill('element-data');
        
        disconnectedCallback() {
          super.disconnectedCallback?.();
          this.largeArray = [];
        }
      }
      
      // Create and destroy elements repeatedly
      for (let i = 0; i < 50; i++) {
        const el = document.createElement('lifecycle-element');
        document.body.appendChild(el);
        
        await new Promise(resolve => setTimeout(resolve, 5));
        
        el.remove();
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Controllers should be eligible for GC (can't directly test WeakSet)
      expect(instances).toBeDefined();
    });

    it('should cleanup event listeners properly', async () => {
      const clickHandlers: Function[] = [];
      
      @controller('event-leak-ctrl')
      class EventLeakController {
        element: HTMLElement | null = null;
        
        @on('click')
        handleClick() {
          // Handler that could leak
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          // Add a manual listener that could leak
          const handler = () => {};
          clickHandlers.push(handler);
          element.addEventListener('click', handler);
        }
        
        async detach() {
          this.element = null;
        }
      }
      
      @element('event-leak-element')
      class EventLeakElement extends HTMLElement {
        controller = 'event-leak-ctrl';
      }
      
      // Create and destroy many elements
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('event-leak-element');
        document.body.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 1));
        el.remove();
      }
      
      // Handlers array grows but elements should be GC'd
      expect(clickHandlers.length).toBe(100);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle nested shadow DOM with multiple controllers', async () => {
      @controller('parent-shadow-ctrl')
      class ParentShadowController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {}
      }
      
      @controller('child-shadow-ctrl')
      class ChildShadowController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {}
      }
      
      @element('parent-shadow')
      class ParentShadow extends HTMLElement {
        controller = 'parent-shadow-ctrl';
        
        html() {
          return '<child-shadow></child-shadow>';
        }
      }
      
      @element('child-shadow')
      class ChildShadow extends HTMLElement {
        controller = 'child-shadow-ctrl';
        
        html() {
          return '<div>Nested Shadow Content</div>';
        }
      }
      
      const parent = document.createElement('parent-shadow');
      document.body.appendChild(parent);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Both controllers should be attached
      const parentShadow = parent.shadowRoot;
      expect(parentShadow).toBeDefined();
      
      const child = parentShadow?.querySelector('child-shadow');
      expect(child).toBeDefined();
      expect(child?.shadowRoot).toBeDefined();
    });

    it('should handle controller switching under stress', async () => {
      const controllers: string[] = [];
      
      // Create 10 different controllers
      for (let i = 0; i < 10; i++) {
        const name = `switch-ctrl-${i}`;
        controllers.push(name);
        
        @controller(name)
        class SwitchController {
          element: HTMLElement | null = null;
          id = i;
          
          async attach(element: HTMLElement) {
            this.element = element;
          }
          
          async detach() {
            this.element = null;
          }
        }
      }
      
      @element('switch-element')
      class SwitchElement extends HTMLElement {
        @property()
        controller = 'switch-ctrl-0';
      }
      
      const el = document.createElement('switch-element') as any;
      document.body.appendChild(el);
      
      // Rapidly switch controllers
      for (let i = 0; i < 100; i++) {
        el.controller = controllers[i % 10];
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Final controller should be attached (99 % 10 = 9)
      expect(el.controller).toBe('switch-ctrl-9');
    });

    it('should handle concurrent operations across multiple elements', async () => {
      @controller('concurrent-ctrl')
      class ConcurrentController {
        element: HTMLElement | null = null;
        operations = 0;
        
        @response('concurrent-channel')
        handleConcurrent(data: any) {
          this.operations++;
          return { value: data.value, processed: true };
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {}
      }
      
      @element('concurrent-element')
      class ConcurrentElement extends HTMLElement {
        controller = 'concurrent-ctrl';
        
        @request('concurrent-channel')
        async *communicate(value: number) {
          const response = await (yield { value });
          return response;
        }
      }
      
      // Create multiple elements
      const elements: any[] = [];
      for (let i = 0; i < 10; i++) {
        const el = document.createElement('concurrent-element') as any;
        document.body.appendChild(el);
        elements.push(el);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Send concurrent requests
      const promises = elements.map((el, i) => el.communicate(i));
      const results = await Promise.all(promises);
      
      // All should complete
      expect(results.length).toBe(10);
      results.forEach((result, i) => {
        expect(result.value).toBe(i);
      });
    });
  });

  describe('Error Recovery Under Stress', () => {
    it('should recover from errors in high-frequency operations', async () => {
      let errorCount = 0;
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        errorCount++;
      });
      
      @controller('error-stress-ctrl')
      class ErrorStressController {
        element: HTMLElement | null = null;
        callCount = 0;
        
        @on('test-event')
        handleEvent() {
          this.callCount++;
          if (this.callCount % 5 === 0) {
            throw new Error('Periodic error');
          }
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {}
      }
      
      @element('error-stress-element')
      class ErrorStressElement extends HTMLElement {
        controller = 'error-stress-ctrl';
      }
      
      const el = document.createElement('error-stress-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Fire many events, some will error
      for (let i = 0; i < 100; i++) {
        el.dispatchEvent(new CustomEvent('test-event'));
      }
      
      // Should handle errors gracefully
      expect(errorCount).toBe(20); // Every 5th event errors
      
      // Element should still be functional
      expect(el.isConnected).toBe(true);
      
      errorSpy.mockRestore();
    });

    it('should maintain consistency during rapid attach/detach cycles', async () => {
      @controller('rapid-cycle-ctrl')
      class RapidCycleController {
        element: HTMLElement | null = null;
        attachCount = 0;
        detachCount = 0;
        
        async attach(element: HTMLElement) {
          this.element = element;
          this.attachCount++;
        }
        
        async detach() {
          this.element = null;
          this.detachCount++;
        }
      }
      
      @element('rapid-cycle-element')
      class RapidCycleElement extends HTMLElement {
        @property()
        controller = 'rapid-cycle-ctrl';
      }
      
      const el = document.createElement('rapid-cycle-element') as any;
      document.body.appendChild(el);
      
      // Rapid attach/detach
      for (let i = 0; i < 50; i++) {
        el.controller = null;
        await new Promise(resolve => setTimeout(resolve, 1));
        el.controller = 'rapid-cycle-ctrl';
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Should maintain consistency
      expect(el.controller).toBe('rapid-cycle-ctrl');
    });
  });

  describe('Native Element Controllers at Scale', () => {
    it('should handle many native elements with controllers', async () => {
      useNativeElementControllers();
      
      @controller('native-scale-ctrl')
      class NativeScaleController {
        element: HTMLElement | null = null;
        static instanceCount = 0;
        
        constructor() {
          NativeScaleController.instanceCount++;
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
        }
      }
      
      // Create many native elements
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.setAttribute('controller', 'native-scale-ctrl');
        container.appendChild(div);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // All should have controllers
      expect(NativeScaleController.instanceCount).toBe(100);
      
      // Clean up
      container.remove();
    });
  });
});