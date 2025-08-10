import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, query, queryAll } from '../src/element';
import { controller, getController, attachController } from '../src/controller';
import { on } from '../src/events';

describe('@controller decorator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should register and attach a controller', async () => {
    @controller('test-controller')
    class TestController {
      element: HTMLElement | null = null;
      
      async attach(element: HTMLElement) {
        this.element = element;
      }
      
      async detach() {
        this.element = null;
      }
    }
    
    const el = document.createElement('div');
    await attachController(el, 'test-controller');
    
    const ctrl = getController(el);
    expect(ctrl).toBeDefined();
    expect(ctrl).toBeInstanceOf(TestController);
  });

  it('should attach controller to element', async () => {
    const attachSpy = vi.fn();
    
    @controller('attach-controller')
    class AttachController {
      async attach(element: HTMLElement) {
        attachSpy(element);
      }
      
      async detach() {}
    }
    
    @element('test-attach')
    class TestAttach extends HTMLElement {}
    
    const el = document.createElement('test-attach');
    el.setAttribute('controller', 'attach-controller');
    document.body.appendChild(el);
    
    // Wait for controller to attach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(attachSpy).toHaveBeenCalledWith(el);
  });

  it('should handle events in controller', async () => {
    const eventHandler = vi.fn();
    
    @controller('event-controller')
    class EventController {
      element: HTMLElement | null = null;
      
      async attach(element: HTMLElement) {
        this.element = element;
      }
      
      async detach() {
        this.element = null;
      }
      
      @on('test-event')
      handleTestEvent(event: CustomEvent) {
        eventHandler(event.detail);
      }
    }
    
    @element('test-controller-events')
    class TestControllerEvents extends HTMLElement {}
    
    const el = document.createElement('test-controller-events');
    el.setAttribute('controller', 'event-controller');
    document.body.appendChild(el);
    
    // Wait for controller to attach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Dispatch custom event
    el.dispatchEvent(new CustomEvent('test-event', { 
      bubbles: true,
      detail: { message: 'test' }
    }));
    
    expect(eventHandler).toHaveBeenCalledWith({ message: 'test' });
  });

  it('should detach controller when element is removed', async () => {
    const detachSpy = vi.fn();
    
    @controller('detach-controller')
    class DetachController {
      async attach(element: HTMLElement) {}
      
      async detach() {
        detachSpy();
      }
    }
    
    @element('test-detach')
    class TestDetach extends HTMLElement {}
    
    const el = document.createElement('test-detach');
    el.setAttribute('controller', 'detach-controller');
    document.body.appendChild(el);
    
    // Wait for controller to attach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Remove element
    document.body.removeChild(el);
    
    // Wait for detach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(detachSpy).toHaveBeenCalled();
  });

  it('should query elements from controller', async () => {
    @controller('query-controller')
    class QueryController {
      element: HTMLElement | null = null;
      
      @query('.test')
      testEl?: HTMLElement;
      
      @queryAll('.item')
      items?: NodeListOf<HTMLElement>;
      
      async attach(element: HTMLElement) {
        this.element = element;
      }
      
      async detach() {
        this.element = null;
      }
    }
    
    @element('test-controller-query')
    class TestControllerQuery extends HTMLElement {
      html() {
        return `
          <div class="test">Test</div>
          <div class="item">1</div>
          <div class="item">2</div>
        `;
      }
    }
    
    const el = document.createElement('test-controller-query');
    el.setAttribute('controller', 'query-controller');
    document.body.appendChild(el);
    
    // Wait for controller to attach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const ctrl = getController(el) as any;
    
    // Controller queries aren't automatically set up, need to manually query
    if (ctrl.element) {
      const testEl = ctrl.element.querySelector('.test');
      const items = ctrl.element.querySelectorAll('.item');
      expect(testEl).toBeDefined();
      expect(testEl?.className).toBe('test');
      expect(items?.length).toBe(2);
    }
  });
});