import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, controller, attachController, getController } from '../src/index';
import { context } from './test-imports';

// Helper to generate unique names to avoid state conflicts
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('@context regression tests - simple', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should not be tricked by element with this.element property', async () => {
    const elementName = uniqueName('tricky-elem');
    
    // Create element with a fake 'element' property
    @element(elementName)
    class TrickyElement extends HTMLElement {
      // This property should NOT affect context event dispatching
      element = document.createElement('div');
      
      @context()
      ctx?: any;
      
      html() {
        return '<div>Element with fake element property</div>';
      }
    }
    
    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    
    // Set up a parent that will provide context
    const parentDiv = document.createElement('div');
    let contextEventTarget: EventTarget | null = null;
    
    parentDiv.addEventListener('@context/request', (e: Event) => {
      contextEventTarget = e.target;
      // Provide fake context
      (e as CustomEvent).detail.context = { value: 'test-context' };
    });
    
    // Move element into parent
    parentDiv.appendChild(el);
    container.appendChild(parentDiv);
    
    // Access context - this should dispatch event on the element itself, not el.element
    const ctx = el.ctx;
    
    // The event should have been dispatched from the custom element
    expect(contextEventTarget).toBe(el);
    // And NOT from the fake element property
    expect(contextEventTarget).not.toBe(el.element);
    expect(ctx).toEqual({ value: 'test-context' });
  });

  it('should properly handle controller with element property when using @context', async () => {
    const elementName = uniqueName('ctrl-elem');
    const controllerName = uniqueName('tricky-ctrl');
    
    @element(elementName)
    class ControllerElement extends HTMLElement {
      html() {
        return '<div>Element for controller</div>';
      }
    }
    
    @controller(controllerName)
    class TrickyController {
      // The real element property that controllers have
      element: HTMLElement | null = null;
      
      // Add a fake element to try to confuse things
      fakeElement: HTMLElement = document.createElement('span');
      
      @context()
      ctx?: any;
      
      attach(element: HTMLElement) {
        this.element = element;
      }
      
      detach() {
        this.element = null;
      }
      
      getContext() {
        return this.ctx;
      }
    }
    
    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    
    const ctrl = getController(el) as any;
    
    // Set up parent to provide context
    const parentDiv = document.createElement('div');
    let contextEventTarget: EventTarget | null = null;
    
    parentDiv.addEventListener('@context/request', (e: Event) => {
      contextEventTarget = e.target;
      (e as CustomEvent).detail.context = { value: 'controller-context' };
    });
    
    // Move element into parent
    parentDiv.appendChild(el);
    container.appendChild(parentDiv);
    
    // Access context from controller - should dispatch on attached element
    const ctx = ctrl.getContext();
    
    // Event should be dispatched from the element the controller is attached to
    expect(contextEventTarget).toBe(el);
    // NOT from the controller's fake element
    expect(contextEventTarget).not.toBe(ctrl.fakeElement);
    expect(ctx).toEqual({ value: 'controller-context' });
  });

  it('should not confuse element.element with controller detection', async () => {
    const elementName = uniqueName('detection-elem');
    
    @element(elementName)
    class DetectionElement extends HTMLElement {
      // Multiple properties that could confuse detection
      element = document.createElement('div');
      ctx = { fake: 'context' };
      controller = 'not-a-controller';
      
      @context()
      realCtx?: any;
      
      html() {
        return '<div>Detection test</div>';
      }
    }
    
    const el = document.createElement(elementName) as any;
    
    // Intercept dispatchEvent to see where events go
    let lastDispatchTarget: EventTarget | null = null;
    const originalDispatch = el.dispatchEvent.bind(el);
    el.dispatchEvent = function(event: Event) {
      lastDispatchTarget = this;
      return originalDispatch(event);
    };
    
    container.appendChild(el);
    
    // Set up context provider
    container.addEventListener('@context/request', (e: Event) => {
      (e as CustomEvent).detail.context = { real: 'context' };
    });
    
    // Access context
    const ctx = el.realCtx;
    
    // Should dispatch on the element itself despite having confusing properties
    expect(lastDispatchTarget).toBe(el);
    expect(lastDispatchTarget).not.toBe(el.element);
    expect(ctx).toEqual({ real: 'context' });
    
    // The fake ctx property should still be there unchanged
    expect(el.ctx).toEqual({ fake: 'context' });
  });
});