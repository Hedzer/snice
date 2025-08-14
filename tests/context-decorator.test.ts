import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, element, context as contextDecorator } from '../src';

// Helper to wait for element to be ready
async function waitForElement(element: any): Promise<void> {
  if (element.ready) {
    await element.ready;
  }
}

describe('Router Context Decorator', () => {
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
  
  it('should inject context into page component', async () => {
    // Create test context
    class TestContext {
      user = { name: 'John', role: 'admin' };
      isAuthenticated = true;
    }
    
    // Define a page component with @context decorator
    @element('test-page')
    class TestPage extends HTMLElement {
      @contextDecorator()
      ctx?: TestContext;
      
      html() {
        return `<div id="content">Page Content</div>`;
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: new TestContext()
    });
    
    // Register page
    router.register('/', 'test-page');
    
    // Initialize router
    router.initialize();
    
    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the page element
    const pageElement = document.querySelector('test-page') as any;
    expect(pageElement).toBeTruthy();
    
    await waitForElement(pageElement);
    
    // Check that context was injected
    expect(pageElement.ctx).toBeTruthy();
    expect(pageElement.ctx).toBeInstanceOf(TestContext);
    expect(pageElement.ctx.user.name).toBe('John');
    expect(pageElement.ctx.isAuthenticated).toBe(true);
  });
  
  it('should share same context instance across page navigations', async () => {
    // Create mutable context
    const context = { count: 0 };
    
    // Define first page
    @element('page-one')
    class PageOne extends HTMLElement {
      @contextDecorator()
      ctx?: any;
      
      html() {
        return `<div>Page One</div>`;
      }
    }
    
    // Define second page
    @element('page-two')
    class PageTwo extends HTMLElement {
      @contextDecorator()
      ctx?: any;
      
      html() {
        return `<div>Page Two</div>`;
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context
    });
    
    // Register pages
    router.register('/page1', 'page-one');
    router.register('/page2', 'page-two');
    
    // Navigate to first page
    window.location.hash = '#/page1';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get first page and modify context
    const pageOne = document.querySelector('page-one') as any;
    expect(pageOne).toBeTruthy();
    await waitForElement(pageOne);
    expect(pageOne.ctx).toBe(context);
    pageOne.ctx.count = 42;
    
    // Navigate to second page
    window.location.hash = '#/page2';
    await router.navigate('/page2');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get second page and verify context is same
    const pageTwo = document.querySelector('page-two') as any;
    expect(pageTwo).toBeTruthy();
    await waitForElement(pageTwo);
    expect(pageTwo.ctx).toBe(context);
    expect(pageTwo.ctx.count).toBe(42);
  });
  
  it('should work with guards that use context', async () => {
    // Create context with auth state
    class AppContext {
      private authenticated = false;
      
      login() {
        this.authenticated = true;
      }
      
      isAuthenticated() {
        return this.authenticated;
      }
    }
    
    // Define protected page
    @element('protected-page')
    class ProtectedPage extends HTMLElement {
      @contextDecorator()
      ctx?: AppContext;
      
      html() {
        return `<div>Protected Content</div>`;
      }
    }
    
    // Define 403 page
    @element('forbidden-page')
    class ForbiddenPage extends HTMLElement {
      @contextDecorator()
      ctx?: AppContext;
      
      html() {
        return `<div>Access Denied</div>`;
      }
    }
    
    const appContext = new AppContext();
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Register pages with guard
    router.register('/403', 'forbidden-page');
    router.register('/protected', 'protected-page', undefined, [
      (ctx: AppContext) => ctx.isAuthenticated()
    ]);
    
    // Try to navigate while not authenticated
    window.location.hash = '#/protected';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show 403 page
    let currentPage = document.querySelector('forbidden-page') as any;
    expect(currentPage).toBeTruthy();
    await waitForElement(currentPage);
    expect(currentPage.ctx).toBe(appContext);
    
    // Login and try again
    appContext.login();
    await router.navigate('/protected');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should now show protected page
    currentPage = document.querySelector('protected-page') as any;
    expect(currentPage).toBeTruthy();
    await waitForElement(currentPage);
    expect(currentPage.ctx).toBe(appContext);
  });
  
  it('should clean up context reference on disconnect', async () => {
    // Create router with context  
    const testContext = { test: 'value' };
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: testContext
    });
    
    // Define page with context using router.page
    @router.page({ tag: 'cleanup-test-page', routes: ['/'] })
    class CleanupTestPage extends HTMLElement {
      @contextDecorator()
      ctx?: any;
      
      html() {
        return `<div>Test</div>`;
      }
    }
    
    // Navigate to page
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get page element
    const pageElement = document.querySelector('cleanup-test-page') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Verify context exists
    expect(pageElement.ctx).toBeTruthy();
    expect(pageElement.ctx.test).toBe('value');
    
    // Navigate away from the page to trigger cleanup
    window.location.hash = '#/other';
    await router.navigate('/other');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Context property should still work but return undefined
    expect(pageElement.ctx).toBeUndefined();
  });
  
  it('should work with multiple @context properties', async () => {
    // Define page with multiple context properties
    @element('multi-context-page')
    class MultiContextPage extends HTMLElement {
      @contextDecorator()
      appContext?: any;
      
      @contextDecorator()
      globalContext?: any;
      
      html() {
        return `<div>Multi Context</div>`;
      }
    }
    
    // Create router with context
    const sharedContext = { user: 'Alice', theme: 'dark' };
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: sharedContext
    });
    
    // Register page
    router.register('/', 'multi-context-page');
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get page element
    const pageElement = document.querySelector('multi-context-page') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Both properties should reference the same context
    expect(pageElement.appContext).toBe(sharedContext);
    expect(pageElement.globalContext).toBe(sharedContext);
    expect(pageElement.appContext).toBe(pageElement.globalContext);
  });
});