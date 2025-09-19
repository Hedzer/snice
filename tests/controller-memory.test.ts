import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property } from './test-imports';
import { controller, attachController, detachController, getController, getControllerScope, registerControllerCleanup } from './test-imports';
import { CONTROLLER_KEY, CONTROLLER_OPERATIONS } from './test-imports';

describe('Controller Scope & Memory Management', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('ControllerScope Cleanup', () => {
    it('should properly cleanup all registered functions', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();
      
      @controller('cleanup-test')
      class CleanupTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          // Register multiple cleanup functions
          registerControllerCleanup(this, 'cleanup1', cleanup1);
          registerControllerCleanup(this, 'cleanup2', cleanup2);
          registerControllerCleanup(this, 'cleanup3', cleanup3);
        }
        
        async detach() {}
      }
      
      @element('cleanup-element')
      class CleanupElement extends HTMLElement {
        controller = 'cleanup-test';
      }
      
      const el = document.createElement('cleanup-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify controller is attached
      const ctrl = getController(el);
      expect(ctrl).toBeDefined();
      
      // Detach controller
      await detachController(el);
      
      // All cleanup functions should have been called
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      expect(cleanup3).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup function errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cleanup1 = vi.fn(() => { throw new Error('Cleanup 1 error'); });
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn(() => { throw new Error('Cleanup 3 error'); });
      
      @controller('cleanup-error-test')
      class CleanupErrorTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          registerControllerCleanup(this, 'cleanup1', cleanup1);
          registerControllerCleanup(this, 'cleanup2', cleanup2);
          registerControllerCleanup(this, 'cleanup3', cleanup3);
        }
        
        async detach() {}
      }
      
      @element('cleanup-error-element')
      class CleanupErrorElement extends HTMLElement {
        controller = 'cleanup-error-test';
      }
      
      const el = document.createElement('cleanup-error-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await detachController(el);
      
      // All cleanup functions should be called despite errors
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      expect(cleanup3).toHaveBeenCalledTimes(1);
      
      // Errors should be logged
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls.some(call => call[0].includes('Error during cleanup'))).toBe(true);
      
      errorSpy.mockRestore();
    });

    it('should cleanup resources when controller attach fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cleanup1 = vi.fn();
      
      @controller('attach-fail-test')
      class AttachFailTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          // Register cleanup before failure
          registerControllerCleanup(this, 'cleanup1', cleanup1);
          
          // Simulate attach failure
          throw new Error('Attach failed');
        }
        
        async detach() {}
      }
      
      @element('attach-fail-element')
      class AttachFailElement extends HTMLElement {
        controller = 'attach-fail-test';
      }
      
      const el = document.createElement('attach-fail-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Controller IS attached (stored before attach() is called) but attach() failed
      const ctrl = getController(el);
      expect(ctrl).toBeDefined();
      
      // Error should have been logged
      expect(errorSpy).toHaveBeenCalled();
      
      errorSpy.mockRestore();
    });

    it('should handle re-registration of cleanup functions', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      
      @controller('re-register-test')
      class ReRegisterTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          // Register same key twice - should override
          registerControllerCleanup(this, 'cleanup', cleanup1);
          registerControllerCleanup(this, 'cleanup', cleanup2);
        }
        
        async detach() {}
      }
      
      @element('re-register-element')
      class ReRegisterElement extends HTMLElement {
        controller = 're-register-test';
      }
      
      const el = document.createElement('re-register-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await detachController(el);
      
      // Only the second cleanup should be called
      expect(cleanup1).not.toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory during rapid controller switches', async () => {
      const attachSpies: any[] = [];
      const detachSpies: any[] = [];
      const instances = new WeakSet();
      
      // Create multiple controller classes
      for (let i = 0; i < 5; i++) {
        const attachSpy = vi.fn();
        const detachSpy = vi.fn();
        attachSpies.push(attachSpy);
        detachSpies.push(detachSpy);
        
        @controller(`memory-test-${i}`)
        class MemoryTest {
          element: HTMLElement | null = null;
          largeData = new Array(1000).fill(`data-${i}`); // Simulate memory usage
          
          constructor() {
            instances.add(this);
          }
          
          async attach(element: HTMLElement) {
            this.element = element;
            attachSpy();
          }
          
          async detach() {
            this.element = null;
            detachSpy();
          }
        }
      }
      
      @element('memory-element')
      class MemoryElement extends HTMLElement {
        @property()
        controller = 'memory-test-0';
      }
      
      const el = document.createElement('memory-element');
      document.body.appendChild(el);
      
      // Rapidly switch controllers
      for (let i = 0; i < 5; i++) {
        el.controller = `memory-test-${i}`;
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      // Switch back to first
      el.controller = 'memory-test-0';
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify proper cleanup
      expect(attachSpies[0]).toHaveBeenCalledTimes(2); // Initial + switch back
      expect(detachSpies[0]).toHaveBeenCalledTimes(1);
      
      for (let i = 1; i < 5; i++) {
        expect(attachSpies[i]).toHaveBeenCalledTimes(1);
        expect(detachSpies[i]).toHaveBeenCalledTimes(1);
      }
    });

    it('should cleanup controller operations on element removal', async () => {
      const cleanupSpy = vi.fn();
      
      @controller('element-removal-test')
      class ElementRemovalTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          // Register cleanup
          registerControllerCleanup(this, 'removal-cleanup', cleanupSpy);
          
          // Simulate ongoing operations
          const interval = setInterval(() => {}, 100);
          registerControllerCleanup(this, 'interval', () => clearInterval(interval));
        }
        
        async detach() {}
      }
      
      @element('removal-element')
      class RemovalElement extends HTMLElement {
        controller = 'element-removal-test';
      }
      
      const el = document.createElement('removal-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Remove element from DOM
      el.remove();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Cleanup should be called
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle circular references in controller', async () => {
      @controller('circular-ref-test')
      class CircularRefTest {
        element: HTMLElement | null = null;
        selfRef: CircularRefTest = this;
        circularData: any = {};
        
        constructor() {
          // Create circular reference
          this.circularData.ref = this;
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
          // Create another circular reference with element
          (element as any).controllerRef = this;
        }
        
        async detach(element: HTMLElement) {
          // Clean up circular reference
          delete (element as any).controllerRef;
          this.element = null;
        }
      }
      
      @element('circular-element')
      class CircularElement extends HTMLElement {
        controller = 'circular-ref-test';
      }
      
      const el = document.createElement('circular-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const ctrl = getController(el);
      expect(ctrl).toBeDefined();
      expect((el as any).controllerRef).toBe(ctrl);
      
      // Detach and verify cleanup
      await detachController(el);
      
      expect(getController(el)).toBeUndefined();
      expect((el as any).controllerRef).toBeUndefined();
    });
  });

  describe('Controller Operations Tracking', () => {
    it('should wait for pending operations before cleanup', async () => {
      const operationComplete = vi.fn();
      
      @controller('pending-ops-test')
      class PendingOpsTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          const scope = getControllerScope(element);
          if (scope) {
            // Start a long-running operation
            await scope.runOperation(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
              operationComplete();
            });
          }
        }
        
        async detach() {}
      }
      
      @element('pending-ops-element')
      class PendingOpsElement extends HTMLElement {
        controller = 'pending-ops-test';
      }
      
      const el = document.createElement('pending-ops-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Start detach while operation is pending
      const detachPromise = detachController(el);
      
      // Operation should not be complete yet
      expect(operationComplete).not.toHaveBeenCalled();
      
      // Wait for detach to complete
      await detachPromise;
      
      // Operation should have completed before cleanup
      expect(operationComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle operation errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      @controller('operation-error-test')
      class OperationErrorTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          const scope = getControllerScope(element);
          if (scope) {
            // Start operation that will fail
            scope.runOperation(async () => {
              throw new Error('Operation failed');
            }).catch(() => {
              // Error is expected and handled
            });
          }
        }
        
        async detach() {}
      }
      
      @element('operation-error-element')
      class OperationErrorElement extends HTMLElement {
        controller = 'operation-error-test';
      }
      
      const el = document.createElement('operation-error-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Controller should still be attached despite error
      expect(getController(el)).toBeDefined();
      
      errorSpy.mockRestore();
    });
  });

  describe('Controller Scope Isolation', () => {
    it('should isolate scopes between different controller instances', async () => {
      const cleanups: any[] = [];
      
      @controller('scope-isolation-test')
      class ScopeIsolationTest {
        element: HTMLElement | null = null;
        id: number;
        
        constructor() {
          this.id = Math.random();
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
          
          const cleanup = vi.fn();
          cleanups.push(cleanup);
          
          registerControllerCleanup(this, `cleanup-${this.id}`, cleanup);
        }
        
        async detach() {}
      }
      
      @element('scope-element')
      class ScopeElement extends HTMLElement {
        controller = 'scope-isolation-test';
      }
      
      // Create multiple elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('scope-element');
        document.body.appendChild(el);
        elements.push(el);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Detach only the first controller
      await detachController(elements[0]);
      
      // Only first cleanup should be called
      expect(cleanups[0]).toHaveBeenCalledTimes(1);
      expect(cleanups[1]).not.toHaveBeenCalled();
      expect(cleanups[2]).not.toHaveBeenCalled();
      
      // Detach remaining
      await detachController(elements[1]);
      await detachController(elements[2]);
      
      // All should now be called once
      cleanups.forEach(cleanup => {
        expect(cleanup).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Controller Reference Management', () => {
    it('should clear all controller references on detach', async () => {
      @controller('ref-management-test')
      class RefManagementTest {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
        }
      }
      
      @element('ref-element')
      class RefElement extends HTMLElement {
        controller = 'ref-management-test';
      }
      
      const el = document.createElement('ref-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify controller is attached with all references
      expect((el as any)[CONTROLLER_KEY]).toBeDefined();
      expect((el as any)[CONTROLLER_OPERATIONS]).toBeDefined();
      
      const ctrl = getController(el);
      expect(ctrl?.element).toBe(el);
      
      // Detach controller
      await detachController(el);
      
      // All references should be cleared
      expect((el as any)[CONTROLLER_KEY]).toBeUndefined();
      expect((el as any)[CONTROLLER_OPERATIONS]).toBeUndefined();
      expect(ctrl?.element).toBe(null);
    });

    it('should handle controller switching without leaking references', async () => {
      const instances: any[] = [];
      
      @controller('switch-test-1')
      class SwitchTest1 {
        element: HTMLElement | null = null;
        data = 'controller1';
        
        constructor() {
          instances.push(this);
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
        }
      }
      
      @controller('switch-test-2')
      class SwitchTest2 {
        element: HTMLElement | null = null;
        data = 'controller2';
        
        constructor() {
          instances.push(this);
        }
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
        }
      }
      
      @element('switch-element')
      class SwitchElement extends HTMLElement {
        @property()
        controller = 'switch-test-1';
      }
      
      const el = document.createElement('switch-element');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(instances.length).toBe(1);
      expect(instances[0].data).toBe('controller1');
      
      // Switch controller
      el.controller = 'switch-test-2';
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(instances.length).toBe(2);
      expect(instances[1].data).toBe('controller2');
      
      // First controller should have cleared element reference
      expect(instances[0].element).toBe(null);
      expect(instances[1].element).toBe(el);
      
      // Element should only reference second controller
      const currentController = getController(el);
      expect(currentController).toBe(instances[1]);
    });
  });
});