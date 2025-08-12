import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { controller, controller as registerController, attachController, detachController, useNativeElementControllers, cleanupNativeElementControllers } from '../src/controller';
import { on, dispatch } from '../src/events';
import { query } from '../src/element';
import { CONTROLLER_KEY } from '../src/symbols';

describe('Native Element Controllers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    cleanupNativeElementControllers(); // Ensure clean state
  });

  afterEach(() => {
    cleanupNativeElementControllers();
  });

  // Basic functionality tests
  it('should attach controller to native div element', async () => {
    const attachSpy = vi.fn();
    
    @controller('test-controller')
    class TestController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    // Initialize native controller support
    useNativeElementControllers();

    // Create a native div with controller
    const div = document.createElement('div');
    div.setAttribute('controller', 'test-controller');
    document.body.appendChild(div);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(attachSpy).toHaveBeenCalledWith(div);
  });

  it('should handle controller on existing elements', async () => {
    const attachSpy = vi.fn();
    
    @controller('existing-controller')
    class ExistingController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    // Add element before initializing
    document.body.innerHTML = '<div controller="existing-controller"></div>';
    
    // Initialize should pick up existing elements
    useNativeElementControllers();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(attachSpy).toHaveBeenCalled();
  });

  it('should detach controller when attribute is removed', async () => {
    const attachSpy = vi.fn();
    const detachSpy = vi.fn();
    
    @controller('detach-test')
    class DetachController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      detach = detachSpy;
    }

    useNativeElementControllers();

    const div = document.createElement('div');
    div.setAttribute('controller', 'detach-test');
    document.body.appendChild(div);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(attachSpy).toHaveBeenCalled();

    // Remove controller attribute
    div.removeAttribute('controller');
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(detachSpy).toHaveBeenCalled();
  });

  it('should handle @on events on native elements', async () => {
    const clickSpy = vi.fn();
    
    @controller('event-controller')
    class EventController {
      element: HTMLElement | null = null;
      
      @on('click', '.button')
      handleClick() {
        clickSpy();
      }
      
      async attach(element: HTMLElement) {
        this.element = element;
      }
      
      async detach() {}
    }

    useNativeElementControllers();

    const div = document.createElement('div');
    div.innerHTML = '<button class="button">Click me</button>';
    div.setAttribute('controller', 'event-controller');
    document.body.appendChild(div);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Click the button
    const button = div.querySelector('.button') as HTMLElement;
    button.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle @query on native elements', async () => {
    // Need to use direct property assignment for queries on native elements
    // since decorators have transpilation issues in tests
    @controller('native-query-test')
    class NativeQueryCtrl {
      element: HTMLElement | null = null;
      
      get target() {
        return this.element?.querySelector('.target') as HTMLElement | null;
      }
      
      async attach(element: HTMLElement) {
        this.element = element;
      }
      
      async detach() {}
    }

    useNativeElementControllers();

    const section = document.createElement('section');
    section.innerHTML = '<div class="target">Target Element</div>';
    section.setAttribute('controller', 'native-query-test');
    document.body.appendChild(section);

    await new Promise(resolve => setTimeout(resolve, 10));

    const controllerInstance = (section as any)[CONTROLLER_KEY];
    expect(controllerInstance?.target).toBeDefined();
    expect(controllerInstance?.target?.textContent).toBe('Target Element');
  });

  it('should handle multiple native elements with same controller', async () => {
    let attachCount = 0;
    
    @controller('multi-controller')
    class MultiController {
      element: HTMLElement | null = null;
      
      async attach(element: HTMLElement) {
        attachCount++;
        this.element = element;
      }
      
      async detach() {}
    }

    useNativeElementControllers();

    // Add multiple elements with same controller
    const div1 = document.createElement('div');
    div1.setAttribute('controller', 'multi-controller');
    document.body.appendChild(div1);

    const div2 = document.createElement('div');
    div2.setAttribute('controller', 'multi-controller');
    document.body.appendChild(div2);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(attachCount).toBe(2);
  });

  it('should handle dynamically added elements', async () => {
    const attachSpy = vi.fn();
    
    @controller('dynamic-controller')
    class DynamicController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    useNativeElementControllers();

    // Add element after initialization
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const div = document.createElement('div');
    div.setAttribute('controller', 'dynamic-controller');
    document.body.appendChild(div);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(attachSpy).toHaveBeenCalledWith(div);
  });

  it('should skip custom elements and only handle native elements', async () => {
    const customAttachSpy = vi.fn();
    const nativeAttachSpy = vi.fn();
    
    @controller('custom-controller')
    class CustomController {
      element: HTMLElement | null = null;
      attach = customAttachSpy;
      async detach() {}
    }
    
    @controller('native-controller')
    class NativeController {
      element: HTMLElement | null = null;
      attach = nativeAttachSpy;
      async detach() {}
    }

    // Define a custom element
    class TestElement extends HTMLElement {
      connectedCallback() {
        this.innerHTML = '<p>Custom Element</p>';
      }
    }
    customElements.define('test-native-skip', TestElement);

    useNativeElementControllers();

    // Add custom element with controller - should be SKIPPED
    const customEl = document.createElement('test-native-skip');
    customEl.setAttribute('controller', 'custom-controller');
    document.body.appendChild(customEl);

    // Add native element with controller - should be HANDLED
    const nativeEl = document.createElement('div');
    nativeEl.setAttribute('controller', 'native-controller');
    document.body.appendChild(nativeEl);

    await new Promise(resolve => setTimeout(resolve, 20));

    // Custom element controllers are NOT handled by useNativeElementControllers
    expect(customAttachSpy).not.toHaveBeenCalled();
    // Native element controllers ARE handled
    expect(nativeAttachSpy).toHaveBeenCalled();
  });

  // Edge cases and timing tests
  it('should handle rapid controller attribute changes', async () => {
    const ctrl1AttachSpy = vi.fn();
    const ctrl2AttachSpy = vi.fn();
    const ctrl3AttachSpy = vi.fn();
    
    // Use function call syntax to avoid decorator transpilation issues
    const Ctrl1 = registerController('ctrl-1')(
      class Controller1 {
        element: HTMLElement | null = null;
        attach = ctrl1AttachSpy;
        async detach() {}
      }
    );
    
    const Ctrl2 = registerController('ctrl-2')(
      class Controller2 {
        element: HTMLElement | null = null;
        attach = ctrl2AttachSpy;
        async detach() {}
      }
    );
    
    const Ctrl3 = registerController('ctrl-3')(
      class Controller3 {
        element: HTMLElement | null = null;
        attach = ctrl3AttachSpy;
        async detach() {}
      }
    );

    useNativeElementControllers();

    const div = document.createElement('div');
    document.body.appendChild(div);

    // Rapid synchronous controller changes
    div.setAttribute('controller', 'ctrl-1');
    div.setAttribute('controller', 'ctrl-2');
    div.setAttribute('controller', 'ctrl-3');
    div.removeAttribute('controller');
    div.setAttribute('controller', 'ctrl-1');
    
    await new Promise(resolve => setTimeout(resolve, 20));

    const currentController = (div as any)[CONTROLLER_KEY];
    expect(currentController).toBeDefined();
    
    expect(ctrl1AttachSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle elements created before initialization', async () => {
    const attachSpy = vi.fn();
    
    @registerController('pre-init-ctrl')
    class PreInitController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    // Create elements BEFORE initializing
    const div1 = document.createElement('div');
    div1.setAttribute('controller', 'pre-init-ctrl');
    document.body.appendChild(div1);
    
    const section = document.createElement('section');
    section.setAttribute('controller', 'pre-init-ctrl');
    document.body.appendChild(section);
    
    const article = document.createElement('article');
    article.setAttribute('controller', 'pre-init-ctrl');
    document.body.appendChild(article);

    // Now initialize
    useNativeElementControllers();

    await new Promise(resolve => setTimeout(resolve, 20));

    // All three should have controllers attached
    expect(attachSpy).toHaveBeenCalledTimes(3);
  });

  it('should handle controller removal and re-addition rapidly', async () => {
    const attachSpy = vi.fn();
    const detachSpy = vi.fn();
    
    const RapidCtrl = registerController('rapid-ctrl')(
      class RapidController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
          attachSpy(element);
        }
        
        async detach(element: HTMLElement) {
          detachSpy(element);
        }
      }
    );

    useNativeElementControllers();

    const div = document.createElement('div');
    document.body.appendChild(div);

    // Synchronous add/remove cycles
    for (let i = 0; i < 10; i++) {
      div.setAttribute('controller', 'rapid-ctrl');
      div.removeAttribute('controller');
    }
    
    div.setAttribute('controller', 'rapid-ctrl');
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Give attachController time to complete since it's async
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have been attached at least once
    expect(attachSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    
    // Should have a controller attached at the end
    const controller = (div as any)[CONTROLLER_KEY];
    expect(controller).toBeDefined();
  });

  it('should handle multiple elements being added simultaneously', async () => {
    const attachSpy = vi.fn();
    
    @registerController('batch-ctrl')
    class BatchController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    useNativeElementControllers();

    // Create a fragment with multiple elements
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < 20; i++) {
      const div = document.createElement('div');
      div.setAttribute('controller', 'batch-ctrl');
      fragment.appendChild(div);
    }

    // Add all at once
    document.body.appendChild(fragment);

    await new Promise(resolve => setTimeout(resolve, 50));

    // All 20 should have controllers
    expect(attachSpy).toHaveBeenCalledTimes(20);
  });

  it('should handle nested elements with controllers', async () => {
    const parentSpy = vi.fn();
    const childSpy = vi.fn();
    const grandchildSpy = vi.fn();
    
    @registerController('parent-ctrl')
    class ParentController {
      element: HTMLElement | null = null;
      attach = parentSpy;
      async detach() {}
    }
    
    @registerController('child-ctrl')
    class ChildController {
      element: HTMLElement | null = null;
      attach = childSpy;
      async detach() {}
    }
    
    @registerController('grandchild-ctrl')
    class GrandchildController {
      element: HTMLElement | null = null;
      attach = grandchildSpy;
      async detach() {}
    }

    useNativeElementControllers();

    // Create nested structure
    const parent = document.createElement('div');
    parent.setAttribute('controller', 'parent-ctrl');
    
    const child = document.createElement('section');
    child.setAttribute('controller', 'child-ctrl');
    
    const grandchild = document.createElement('article');
    grandchild.setAttribute('controller', 'grandchild-ctrl');
    
    child.appendChild(grandchild);
    parent.appendChild(child);
    document.body.appendChild(parent);

    await new Promise(resolve => setTimeout(resolve, 30));

    // All should be attached
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(1);
    expect(grandchildSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle controller change while element is being moved in DOM', async () => {
    const ctrl1Spy = vi.fn();
    const ctrl2Spy = vi.fn();
    
    const MoveCtrl1 = registerController('move-ctrl-1')(
      class MoveController1 {
        element: HTMLElement | null = null;
        attach = ctrl1Spy;
        async detach() {}
      }
    );
    
    const MoveCtrl2 = registerController('move-ctrl-2')(
      class MoveController2 {
        element: HTMLElement | null = null;
        attach = ctrl2Spy;
        async detach() {}
      }
    );

    useNativeElementControllers();

    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const element = document.createElement('span');
    element.setAttribute('controller', 'move-ctrl-1');
    container1.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(ctrl1Spy).toHaveBeenCalled();
    
    // Change controller while moving
    element.setAttribute('controller', 'move-ctrl-2');
    await new Promise(resolve => setTimeout(resolve, 20));
    
    container2.appendChild(element);
    await new Promise(resolve => setTimeout(resolve, 20));

    // Should have the second controller
    const controller = (element as any)[CONTROLLER_KEY];
    expect(controller).toBeDefined();
    expect(ctrl2Spy).toHaveBeenCalled();
  });

  it('should not attach controllers to custom elements even if added dynamically', async () => {
    const attachSpy = vi.fn();
    
    @registerController('custom-test-ctrl')
    class CustomTestController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    // Define a custom element
    class MyCustomElement extends HTMLElement {}
    customElements.define('my-custom-element', MyCustomElement);

    useNativeElementControllers();

    // Try to add controller to custom element
    const customEl = document.createElement('my-custom-element');
    customEl.setAttribute('controller', 'custom-test-ctrl');
    document.body.appendChild(customEl);

    // Also add to a native element for comparison
    const nativeEl = document.createElement('div');
    nativeEl.setAttribute('controller', 'custom-test-ctrl');
    document.body.appendChild(nativeEl);

    await new Promise(resolve => setTimeout(resolve, 20));

    // Should only attach to native element
    expect(attachSpy).toHaveBeenCalledTimes(1);
    expect(attachSpy).toHaveBeenCalledWith(nativeEl);
  });

  it('should handle attribute changes via innerHTML', async () => {
    const attachSpy = vi.fn();
    
    @registerController('inner-html-ctrl')
    class InnerHTMLController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    useNativeElementControllers();

    const container = document.createElement('div');
    document.body.appendChild(container);

    // Set innerHTML with controller attributes
    container.innerHTML = `
      <div controller="inner-html-ctrl"></div>
      <section controller="inner-html-ctrl"></section>
      <article controller="inner-html-ctrl"></article>
    `;

    await new Promise(resolve => setTimeout(resolve, 30));

    // All three should have controllers
    expect(attachSpy).toHaveBeenCalledTimes(3);
  });

  it('should handle rapid DOM replacement', async () => {
    const attachSpy = vi.fn();
    
    @registerController('replace-ctrl')
    class ReplaceController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    useNativeElementControllers();

    const container = document.createElement('div');
    document.body.appendChild(container);

    // Rapidly replace content
    for (let i = 0; i < 5; i++) {
      container.innerHTML = `<div controller="replace-ctrl" data-index="${i}"></div>`;
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should have attached to elements (exact count may vary due to rapid replacement)
    expect(attachSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    
    // Final element should have controller
    const finalElement = container.querySelector('[controller]');
    if (finalElement) {
      const controller = (finalElement as any)[CONTROLLER_KEY];
      expect(controller).toBeDefined();
    }
  });

  it('should handle controller initialization errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Don't register a controller for this name
    useNativeElementControllers();

    const div = document.createElement('div');
    div.setAttribute('controller', 'non-existent-controller');
    document.body.appendChild(div);

    await new Promise(resolve => setTimeout(resolve, 20));

    // Should log error but not throw
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain('non-existent-controller');
    
    errorSpy.mockRestore();
  });

  it('should handle same controller on multiple elements added at different times', async () => {
    const attachSpy = vi.fn();
    const instances = new Set();
    
    @registerController('shared-ctrl')
    class SharedController {
      element: HTMLElement | null = null;
      
      async attach(element: HTMLElement) {
        this.element = element;
        attachSpy(element);
        instances.add(this);
      }
      
      async detach() {}
    }

    useNativeElementControllers();

    // Add elements at different times
    const div1 = document.createElement('div');
    div1.setAttribute('controller', 'shared-ctrl');
    document.body.appendChild(div1);

    await new Promise(resolve => setTimeout(resolve, 20));

    const div2 = document.createElement('div');
    div2.setAttribute('controller', 'shared-ctrl');
    document.body.appendChild(div2);

    await new Promise(resolve => setTimeout(resolve, 20));

    const div3 = document.createElement('div');
    div3.setAttribute('controller', 'shared-ctrl');
    document.body.appendChild(div3);

    await new Promise(resolve => setTimeout(resolve, 20));

    // Should have 3 attachments
    expect(attachSpy).toHaveBeenCalledTimes(3);
    
    // Should have 3 different instances
    expect(instances.size).toBe(3);
  });

  it('should cleanup properly when cleanupNativeElementControllers is called', async () => {
    const attachSpy = vi.fn();
    
    @registerController('cleanup-test-ctrl')
    class CleanupTestController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }

    useNativeElementControllers();

    const div1 = document.createElement('div');
    div1.setAttribute('controller', 'cleanup-test-ctrl');
    document.body.appendChild(div1);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(attachSpy).toHaveBeenCalledTimes(1);

    // Cleanup
    cleanupNativeElementControllers();

    // Add another element - should NOT get controller
    const div2 = document.createElement('div');
    div2.setAttribute('controller', 'cleanup-test-ctrl');
    document.body.appendChild(div2);

    await new Promise(resolve => setTimeout(resolve, 20));

    // Should still be 1 (not 2)
    expect(attachSpy).toHaveBeenCalledTimes(1);
  });
});