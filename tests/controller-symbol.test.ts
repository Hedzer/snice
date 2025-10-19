import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, controller, query, queryAll, render, html } from '../src/index';
import { IS_CONTROLLER_INSTANCE, CONTROLLER_KEY } from './test-imports';

describe('Controller Symbol Detection', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should mark controller instances with IS_CONTROLLER_INSTANCE symbol', async () => {
    @controller('test-controller')
    class TestController {
      element: HTMLElement | null = null;
      
      async attach(element: HTMLElement) {
        // Controller attached
      }
      
      async detach(element: HTMLElement) {
        // Controller detached
      }
    }

    @element('test-element')
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }
    }

    const el = document.createElement('test-element') as any;
    el.setAttribute('controller', 'test-controller');
    container.appendChild(el);
    await el.ready;
    
    // Wait for controller to attach
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const ctrl = (el as any)[CONTROLLER_KEY];
    expect(ctrl).toBeDefined();
    expect(ctrl[IS_CONTROLLER_INSTANCE]).toBe(true);
  });

  it('should correctly identify controllers vs elements in query decorator', async () => {
    @controller('query-test-controller')
    class QueryTestController {
      element: HTMLElement | null = null;
      
      @query('.from-controller')
      fromController?: HTMLElement;
      
      async attach(element: HTMLElement) {
        // Should query from element's shadow DOM
      }
      
      async detach(element: HTMLElement) {}
    }

    @element('query-test-element')
    class QueryTestElement extends HTMLElement {
      @query('.from-element')
      fromElement?: HTMLElement;

      @render()
      renderContent() {
        return html`
          <div class="from-element">Element Query</div>
          <div class="from-controller">Controller Query</div>
        `;
      }
    }

    const el = document.createElement('query-test-element') as any;
    el.setAttribute('controller', 'query-test-controller');
    container.appendChild(el);

    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Element should find its own shadow DOM element
    expect(el.fromElement).toBeDefined();
    expect(el.fromElement?.textContent).toBe('Element Query');
    
    // Controller should query from the element it's attached to
    const ctrl = (el as any)[CONTROLLER_KEY];
    expect(ctrl).toBeDefined();
    expect(ctrl.fromController).toBeDefined();
    expect(ctrl.fromController?.textContent).toBe('Controller Query');
  });

  it('should not confuse elements with an "element" property as controllers', async () => {
    @element('confusing-element')
    class ConfusingElement extends HTMLElement {
      // This element has an "element" property but is NOT a controller
      element = 'I am not a controller!';

      @query('.test', { light: true, shadow: false })
      lightQuery?: HTMLElement;

      @query('.test')
      shadowQuery?: HTMLElement;

      @render()
      renderContent() {
        return html`<div class="test">Shadow</div>`;
      }
    }

    const el = document.createElement('confusing-element') as any;
    const lightDiv = document.createElement('div');
    lightDiv.className = 'test';
    lightDiv.textContent = 'Light';
    el.appendChild(lightDiv);

    container.appendChild(el);
    await el.ready;

    // Should still work correctly despite having an "element" property
    expect(el[IS_CONTROLLER_INSTANCE]).toBeUndefined();
    expect(el.lightQuery).toBeDefined();
    expect(el.lightQuery?.textContent).toBe('Light');
    expect(el.shadowQuery).toBeDefined();
    expect(el.shadowQuery?.textContent).toBe('Shadow');
  });

  it('should handle queryAll correctly for controllers', async () => {
    @controller('query-all-controller')
    class QueryAllController {
      element: HTMLElement | null = null;
      
      @queryAll('.item')
      items?: NodeListOf<HTMLElement>;
      
      async attach(element: HTMLElement) {}
      async detach(element: HTMLElement) {}
    }

    @element('query-all-element')
    class QueryAllElement extends HTMLElement {
      @queryAll('.item')
      elementItems?: NodeListOf<HTMLElement>;

      @render()
      renderContent() {
        return html`
          <div class="item">Item 1</div>
          <div class="item">Item 2</div>
          <div class="item">Item 3</div>
        `;
      }
    }

    const el = document.createElement('query-all-element') as any;
    el.setAttribute('controller', 'query-all-controller');
    container.appendChild(el);

    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Both element and controller should find the same items
    expect(el.elementItems).toBeDefined();
    expect(el.elementItems?.length).toBe(3);
    
    const ctrl = (el as any)[CONTROLLER_KEY];
    expect(ctrl).toBeDefined();
    expect(ctrl[IS_CONTROLLER_INSTANCE]).toBe(true);
    expect(ctrl.items).toBeDefined();
    expect(ctrl.items?.length).toBe(3);
  });

  it('should not use attach/detach methods for controller detection', async () => {
    // This element has attach/detach methods but is NOT a controller
    @element('fake-controller-element')
    class FakeControllerElement extends HTMLElement {
      // These methods should NOT make it be detected as a controller
      attach() {
        return 'I am not a controller attach!';
      }

      detach() {
        return 'I am not a controller detach!';
      }

      @query('.test')
      testQuery?: HTMLElement;

      @render()
      renderContent() {
        return html`<div class="test">Not a controller</div>`;
      }
    }

    const el = document.createElement('fake-controller-element') as any;
    container.appendChild(el);
    await el.ready;

    // Should NOT be marked as a controller
    expect(el[IS_CONTROLLER_INSTANCE]).toBeUndefined();
    
    // Query should still work correctly
    expect(el.testQuery).toBeDefined();
    expect(el.testQuery?.textContent).toBe('Not a controller');
  });

  it('should handle edge case: object with element property and attach/detach methods', async () => {
    @element('edge-case-element')
    class EdgeCaseElement extends HTMLElement {
      // Has both element property AND attach/detach methods
      // But is still NOT a controller
      element = document.createElement('div');

      attach() {
        return 'fake';
      }

      detach() {
        return 'fake';
      }

      @query('.edge')
      edgeQuery?: HTMLElement;

      @render()
      renderContent() {
        return html`<div class="edge">Edge Case</div>`;
      }
    }

    const el = document.createElement('edge-case-element') as any;
    container.appendChild(el);
    await el.ready;

    // Should NOT be marked as a controller
    expect(el[IS_CONTROLLER_INSTANCE]).toBeUndefined();
    
    // Query should work from the element itself, not from el.element
    expect(el.edgeQuery).toBeDefined();
    expect(el.edgeQuery?.textContent).toBe('Edge Case');
  });
});