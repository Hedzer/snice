import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, controller, context as contextDecorator, getController, element } from './test-imports';

// Helper to wait for element to be ready
async function waitForElement(element: any): Promise<void> {
  if (element.ready) {
    await element.ready;
  }
}

describe('Context in Controllers', () => {
  let router: any;
  let container: HTMLDivElement;
  
  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.id = 'router-target';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should provide context to controllers attached to page elements', async () => {
    // Create context class
    class AppContext {
      private count = 0;
      
      increment() {
        this.count++;
      }
      
      getCount() {
        return this.count;
      }
    }
    
    const appContext = new AppContext();
    
    // Define controller that uses context
    @controller('test-controller')
    class TestController {
      element: any;
      
      @contextDecorator()
      ctx?: AppContext;
      
      attach(element: HTMLElement) {
        // Controller is attached
      }
      
      detach(element: HTMLElement) {
        // Controller is detached
      }
      
      incrementViaContext() {
        this.ctx?.increment();
        return this.ctx?.getCount();
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Define page that uses a controller
    @router.page({ tag: 'page-with-controller', routes: ['/'] })
    class PageWithController extends HTMLElement {
      @contextDecorator()
      ctx?: AppContext;
      
      html() {
        return `
          <div>Page with Controller</div>
          <button id="increment">Increment</button>
          <span id="count">0</span>
        `;
      }
    }
    
    // Navigate to page
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get page element
    const pageElement = document.querySelector('page-with-controller') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Attach controller to the page
    pageElement.setAttribute('controller', 'test-controller');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the controller instance
    const controllerInstance = getController(pageElement);
    expect(controllerInstance).toBeTruthy();
    
    // Controller should have access to context
    expect((controllerInstance as any)?.ctx).toBe(appContext);
    
    // Initial count should be 0
    expect(appContext.getCount()).toBe(0);
    
    // Controller should be able to modify context
    const newCount = (controllerInstance as any)?.incrementViaContext();
    expect(newCount).toBe(1);
    expect(appContext.getCount()).toBe(1);
    
    // Page should also see the same context changes
    expect(pageElement.ctx?.getCount()).toBe(1);
  });
  
  it('should clean up context when controller is detached', async () => {
    const appContext = { data: 'test' };
    
    // Define controller
    @controller('cleanup-controller')
    class CleanupController {
      element: any;
      
      @contextDecorator()
      ctx?: any;
      
      attach(element: HTMLElement) {}
      detach(element: HTMLElement) {}
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Define page
    @router.page({ tag: 'cleanup-page', routes: ['/'] })
    class CleanupPage extends HTMLElement {
      html() {
        return `<div>Cleanup Test</div>`;
      }
    }
    
    // Navigate to page
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get page element
    const pageElement = document.querySelector('cleanup-page') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Attach controller
    pageElement.setAttribute('controller', 'cleanup-controller');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get controller and verify it has context
    const controllerInstance = getController(pageElement);
    expect(controllerInstance).toBeTruthy();
    expect((controllerInstance as any)?.ctx).toBe(appContext);
    
    // Remove controller
    pageElement.removeAttribute('controller');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Controller context should be cleaned up
    expect((controllerInstance as any)?.ctx).toBeUndefined();
  });
  
  it('should NOT provide context to controllers on non-page elements', async () => {
    const appContext = { value: 'test' };
    
    // Define controller
    @controller('non-page-controller')
    class NonPageController {
      element: any;
      
      @contextDecorator()
      ctx?: any;
      
      attach(element: HTMLElement) {}
      detach(element: HTMLElement) {}
    }
    
    // Create router with context (but we won't use it for this element)
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Create a standalone element outside the router
    const standaloneDiv = document.createElement('div');
    standaloneDiv.setAttribute('controller', 'non-page-controller');
    document.body.appendChild(standaloneDiv);
    
    // Let controller attach
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get controller
    const controllerInstance = getController(standaloneDiv);
    
    // Controller should NOT have context since element is not a router page
    if (controllerInstance) {
      expect((controllerInstance as any).ctx).toBeUndefined();
    }
  });
});