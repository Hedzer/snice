import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, element, context as contextDecorator, controller, render, html } from '../src';

// Helper to wait for element to be ready
async function waitForElement(element: any): Promise<void> {
  if (element.ready) {
    await element.ready;
  }
}

describe('Context in Nested Elements and Controllers', () => {
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
  
  it('should provide context to nested elements inside a page via event bubbling', async () => {
    const appContext = { user: 'Alice', role: 'admin' };
    
    // Define a nested element that tries to use context
    @element('nested-element')
    class NestedElement extends HTMLElement {
      @contextDecorator()
      ctx?: any;

      @render()
      renderContent() {
        return html`<div>Nested: ${this.ctx?.user || 'no context'}</div>`;
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Define page that contains the nested element
    @router.page({ tag: 'parent-page', routes: ['/'] })
    class ParentPage extends HTMLElement {
      @contextDecorator()
      ctx?: any;

      @render()
      renderContent() {
        return html`
          <div>Parent: ${this.ctx?.user}</div>
          <nested-element></nested-element>
        `;
      }
    }
    
    // Navigate to page
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get page element
    const pageElement = document.querySelector('parent-page') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Page should have context
    expect(pageElement.ctx).toBe(appContext);
    
    // Get nested element
    const nestedElement = pageElement.shadowRoot.querySelector('nested-element') as any;
    expect(nestedElement).toBeTruthy();
    await waitForElement(nestedElement);
    
    // Nested element should now have context via event bubbling
    expect(nestedElement.ctx).toBe(appContext);
  });
  
  it('should NOT provide context to elements outside router pages', async () => {
    const appContext = { data: 'test' };
    
    // Define element that tries to use context
    @element('standalone-element')
    class StandaloneElement extends HTMLElement {
      @contextDecorator()
      ctx?: any;

      @render()
      renderContent() {
        return html`<div>Standalone</div>`;
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Create element outside of router
    const standaloneDiv = document.createElement('div');
    standaloneDiv.innerHTML = '<standalone-element></standalone-element>';
    document.body.appendChild(standaloneDiv);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get standalone element
    const standaloneElement = document.querySelector('standalone-element') as any;
    expect(standaloneElement).toBeTruthy();
    await waitForElement(standaloneElement);
    
    // Should not have context
    expect(standaloneElement.ctx).toBeUndefined();
  });
  
  it('should provide context to controllers attached to page elements', async () => {
    const appContext = { service: 'active', count: 0 };
    
    // Define controller that uses context
    @controller('page-controller')
    class PageController {
      element: any;
      
      @contextDecorator()
      ctx?: any;
      
      attach(element: HTMLElement) {
        // Controller is attached
      }
      
      detach(element: HTMLElement) {
        // Controller is detached
      }
      
      incrementCount() {
        if (this.ctx) {
          this.ctx.count++;
        }
      }
    }
    
    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });
    
    // Define page with controller
    @router.page({ tag: 'controller-page', routes: ['/'] })
    class ControllerPage extends HTMLElement {
      @contextDecorator()
      ctx?: any;

      @render()
      renderContent() {
        return html`
          <div>Page with controller</div>
          <button id="increment">Increment</button>
        `;
      }

      connectedCallback() {
        super.connectedCallback?.();
        this.setAttribute('controller', 'page-controller');
      }
    }
    
    // Navigate to page
    window.location.hash = '#/';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get page element
    const pageElement = document.querySelector('controller-page') as any;
    expect(pageElement).toBeTruthy();
    await waitForElement(pageElement);
    
    // Page should have context
    expect(pageElement.ctx).toBe(appContext);
    expect(pageElement.ctx.count).toBe(0);
    
    // Get controller and verify it can access context
    const controllerInstance = (pageElement as any).controllerInstance;
    if (controllerInstance) {
      // Copy context from element to controller
      (controllerInstance as any)[Symbol.for('router-context')] = pageElement[Symbol.for('router-context')];
      
      expect(controllerInstance.ctx).toBe(appContext);
      
      // Controller should be able to modify context
      controllerInstance.incrementCount();
      expect(appContext.count).toBe(1);
    }
  });
  
  it('should handle context properly when elements are moved between pages', async () => {
    const appContext = { page: 'initial' };
    
    // Define a portable element
    @element('portable-element')
    class PortableElement extends HTMLElement {
      @contextDecorator()
      ctx?: any;

      @render()
      renderContent() {
        return html`<div>Portable: ${this.ctx?.page || 'no context'}</div>`;
      }
    }

    // Create router with context
    router = Router({
      target: '#router-target',
      type: 'hash',
      context: appContext
    });

    // Define first page
    @router.page({ tag: 'first-page', routes: ['/first'] })
    class FirstPage extends HTMLElement {
      @render()
      renderContent() {
        return html`<div id="first">First Page</div>`;
      }
    }

    // Define second page
    @router.page({ tag: 'second-page', routes: ['/second'] })
    class SecondPage extends HTMLElement {
      @render()
      renderContent() {
        return html`<div id="second">Second Page</div>`;
      }
    }
    
    // Navigate to first page
    window.location.hash = '#/first';
    router.initialize();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create portable element and add to first page
    const portableElement = document.createElement('portable-element') as any;
    const firstPage = document.querySelector('first-page') as any;
    firstPage?.shadowRoot?.appendChild(portableElement);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Portable element inside first page should have context via event bubbling
    expect(portableElement.ctx).toBe(appContext);
    
    // Navigate to second page
    appContext.page = 'second';
    window.location.hash = '#/second';
    await router.navigate('/second');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Move portable element to second page
    const secondPage = document.querySelector('second-page') as any;
    if (secondPage?.shadowRoot) {
      secondPage.shadowRoot.appendChild(portableElement);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Portable element should still have context (cached from first page)
    // and should see the updated value
    expect(portableElement.ctx).toBe(appContext);
    expect(portableElement.ctx.page).toBe('second');
  });
});