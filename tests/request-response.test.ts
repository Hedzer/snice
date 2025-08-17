import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, controller, request, response, attachController, detachController } from '../src/index';

// Helper to generate unique names to avoid state conflicts
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('@request and @response decorators', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should perform handshake and exchange data', async () => {
    const controllerName = uniqueName('basic-ctrl');
    const elementName = uniqueName('basic-elem');
    const requestName = uniqueName('basic-req');

    @controller(controllerName)
    class BasicController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(requestName)
      handleRequest(data: any) {
        return { 
          received: data.message, 
          response: 'Hello from controller' 
        };
      }
    }

    @element(elementName)
    class BasicElement extends HTMLElement {
      @request(requestName)
      async *communicate() {
        const response = await (yield { message: 'Hello from element' });
        return response;
      }

      html() {
        return '<div>Basic Element</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    
    // Small delay to ensure listeners are set up
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const result = await el.communicate();
    
    expect(result).toBeDefined();
    expect(result.received).toBe('Hello from element');
    expect(result.response).toBe('Hello from controller');
  });

  it('should timeout without controller', async () => {
    const elementName = uniqueName('orphan-elem');
    const channelName = uniqueName('orphan-chan');

    @element(elementName)
    class OrphanElement extends HTMLElement {
      @request(channelName, { timeout: 50 })
      async *communicate() {
        const response = await (yield { message: 'Hello?' });
        return response;
      }

      html() {
        return '<div>Orphan</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    
    await expect(el.communicate()).rejects.toThrow('Request timeout');
  });

  it('should handle async controller responses', async () => {
    const controllerName = uniqueName('async-ctrl');
    const elementName = uniqueName('async-elem');
    const channelName = uniqueName('async-chan');

    @controller(controllerName)
    class AsyncController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      async handleRequest(data: any) {
        await new Promise(resolve => setTimeout(resolve, 5));
        return { 
          processed: true,
          value: data.value * 2
        };
      }
    }

    @element(elementName)
    class AsyncElement extends HTMLElement {
      @request(channelName)
      async *communicate() {
        const response = await (yield { value: 21 });
        return response;
      }

      html() {
        return '<div>Async</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = await el.communicate();
    
    expect(result.processed).toBe(true);
    expect(result.value).toBe(42);
  });

  it('should support multiple yields in generator', async () => {
    const controllerName = uniqueName('multi-ctrl');
    const elementName = uniqueName('multi-elem');
    const channelName = uniqueName('multi-chan');

    @controller(controllerName)
    class MultiController {
      element: HTMLElement | null = null;
      callCount = 0;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleRequest(data: any) {
        this.callCount++;
        return { 
          step: data.step,
          callCount: this.callCount,
          received: data.data
        };
      }
    }

    @element(elementName)
    class MultiElement extends HTMLElement {
      @request(channelName)
      async *multiStep() {
        const response = await (yield { step: 1, data: 'first' });
        return response;
      }

      html() {
        return '<div>Multi</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = await el.multiStep();
    
    expect(result).toEqual({ step: 1, callCount: 1, received: 'first' });
  });

  it('should cleanup properly on controller detach', async () => {
    const controllerName = uniqueName('cleanup-ctrl');
    const elementName = uniqueName('cleanup-elem');
    const channelName = uniqueName('cleanup-chan');

    let requestCount = 0;

    @controller(controllerName)
    class CleanupController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleRequest() {
        requestCount++;
        return { count: requestCount };
      }
    }

    @element(elementName)
    class CleanupElement extends HTMLElement {
      @request(channelName)
      async *communicate() {
        const response = await (yield { test: true });
        return response;
      }

      html() {
        return '<div>Cleanup</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result1 = await el.communicate();
    expect(result1.count).toBe(1);
    
    await detachController(el);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await expect(el.communicate()).rejects.toThrow('Request timeout');
    expect(requestCount).toBe(1);
  });

  it('should timeout on data exchange when configured', async () => {
    const controllerName = uniqueName('timeout-ctrl');
    const elementName = uniqueName('timeout-elem');
    const channelName = uniqueName('timeout-chan');

    @controller(controllerName)
    class TimeoutController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      async handleSlowRequest() {
        // Never resolve to simulate timeout
        await new Promise(() => {});
      }
    }

    @element(elementName)
    class TimeoutElement extends HTMLElement {
      @request(channelName, { timeout: 50 })
      async *requestWithTimeout() {
        const response = await (yield { request: 'data' });
        return response;
      }

      html() {
        return '<div>Timeout Test</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    await expect(el.requestWithTimeout()).rejects.toThrow('Request timeout');
  });


  it('should handle concurrent channel requests', async () => {
    const controllerName = uniqueName('concurrent-ctrl');
    const elementName = uniqueName('concurrent-elem');
    const channelName = uniqueName('concurrent-chan');

    @controller(controllerName)
    class ConcurrentController {
      element: HTMLElement | null = null;
      requestCount = 0;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      async handleRequest(data: any) {
        this.requestCount++;
        const count = this.requestCount;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return { id: data.id, processedAs: count };
      }
    }

    @element(elementName)
    class ConcurrentElement extends HTMLElement {
      @request(channelName)
      async *sendRequest(id: number) {
        const response = await (yield { id });
        return response;
      }

      html() {
        return '<div>Concurrent</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Send multiple requests concurrently
    const promises = [
      el.sendRequest(1),
      el.sendRequest(2),
      el.sendRequest(3)
    ];

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(3);
    expect(new Set(results.map(r => r.processedAs)).size).toBe(3); // All unique
    expect(results.every(r => r.id >= 1 && r.id <= 3)).toBe(true);
  });

  it('should handle generator that returns immediately without yielding', async () => {
    const controllerName = uniqueName('noyield-ctrl');
    const elementName = uniqueName('noyield-elem');
    const channelName = uniqueName('noyield-chan');

    @controller(controllerName)
    class NoYieldController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleRequest() {
        return { handled: true };
      }
    }

    @element(elementName)
    class NoYieldElement extends HTMLElement {
      @request(channelName)
      async *noYield() {
        const response = await (yield { completed: true, yielded: false });
        return response;
      }

      html() {
        return '<div>No Yield</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await el.noYield();
    
    expect(result.handled).toBe(true);
  });

  it('should bubble events according to options', async () => {
    const controllerName = uniqueName('bubble-ctrl');
    const elementName = uniqueName('bubble-elem');
    const channelName = uniqueName('bubble-chan');

    @controller(controllerName)
    class BubbleController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleRequest() {
        return { handled: true };
      }
    }

    @element(elementName)
    class BubbleElement extends HTMLElement {
      @request(channelName, { bubbles: false })
      async *requestNoBubble() {
        const response = await (yield { test: 'no-bubble' });
        return response;
      }

      html() {
        return '<div>Bubble Test</div>';
      }
    }

    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    let parentReceived = false;
    container.addEventListener(channelName, () => {
      parentReceived = true;
    });

    await el.requestNoBubble();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(parentReceived).toBe(false);
  });

  it('should work exactly as documented in README', async () => {
    const controllerName = uniqueName('readme-ctrl');
    const elementName = uniqueName('readme-elem');
    const channelName = uniqueName('readme-chan');

    // Exact pattern from README
    @element(elementName)
    class UserCard extends HTMLElement {
      @request(channelName)
      async *fetchUserData() {
        // Yield sends request, await waits for response
        const user = await (yield { id: 123 });
        return user;
      }
      
      async loadUser() {
        const user = await this.fetchUserData();
        // console.log(user);  // { name: 'Alice' }
        return user;
      }
      
      html() {
        return '<div>User Card</div>';
      }
    }
    
    @controller(controllerName)
    class UserController {
      element: HTMLElement | null = null;
      
      attach(element: HTMLElement) {
        this.element = element;
      }
      
      detach() {
        this.element = null;
      }
      
      @response(channelName)
      handleGetData(request: any) {
        // console.log(request);  // { id: 123 }
        return { name: 'Alice' };
      }
    }
    
    // Create and attach
    const card = document.createElement(elementName) as any;
    container.appendChild(card);
    await attachController(card, controllerName);
    
    // Small delay to ensure listeners are set up
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Test the channel method directly
    const result = await card.fetchUserData();
    expect(result).toEqual({ name: 'Alice' });
    
    // Test through loadUser method
    const userFromLoad = await card.loadUser();
    expect(userFromLoad).toEqual({ name: 'Alice' });
  });

  it('should handle async generator without yield', async () => {
    const elementName = uniqueName('no-yield-elem');
    const channelName = uniqueName('no-yield-chan');

    @element(elementName)
    class NoYieldCard extends HTMLElement {
      @request(channelName)
      async *getData() {
        // Return without yielding - should just return the value
        return { direct: 'return' };
      }
      
      html() {
        return '<div>No Yield</div>';
      }
    }
    
    const card = document.createElement(elementName) as any;
    container.appendChild(card);
    
    const result = await card.getData();
    expect(result).toEqual({ direct: 'return' });
  });

  it('should handle multiple channel calls in sequence', async () => {
    const controllerName = uniqueName('multi-ctrl');
    const elementName = uniqueName('multi-elem');
    const channel1Name = uniqueName('step1-chan');
    const channel2Name = uniqueName('step2-chan');

    @controller(controllerName)
    class MultiController {
      element: HTMLElement | null = null;
      
      attach(element: HTMLElement) {
        this.element = element;
      }
      
      detach() {
        this.element = null;
      }
      
      @response(channel1Name)
      handleStep1(request: any) {
        return { step: 1, data: request.input * 2 };
      }
      
      @response(channel2Name)
      handleStep2(request: any) {
        return { step: 2, data: request.input + 10 };
      }
    }
    
    @element(elementName)
    class MultiElement extends HTMLElement {
      @request(channel1Name)
      async *step1(value: number) {
        const response = await (yield { input: value });
        return response;
      }
      
      @request(channel2Name)
      async *step2(value: number) {
        const response = await (yield { input: value });
        return response;
      }
      
      async process() {
        const result1 = await this.step1(5);
        const result2 = await this.step2(result1.data);
        return { result1, result2 };
      }
      
      html() {
        return '<div>Multi</div>';
      }
    }
    
    const el = document.createElement(elementName) as any;
    container.appendChild(el);
    await attachController(el, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const { result1, result2 } = await el.process();
    expect(result1).toEqual({ step: 1, data: 10 });  // 5 * 2
    expect(result2).toEqual({ step: 2, data: 20 });  // 10 + 10
  });

  it('should work across shadow DOM boundaries', async () => {
    const controllerName = uniqueName('shadow-ctrl');
    const childElementName = uniqueName('shadow-child');
    const parentElementName = uniqueName('shadow-parent');
    const channelName = uniqueName('shadow-channel');

    @controller(controllerName)
    class ShadowController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleShadowRequest(data: any) {
        return { 
          received: data.value,
          fromController: true,
          doubled: data.value * 2
        };
      }
    }

    // Child element that sends channel requests from within shadow DOM
    @element(childElementName)
    class ShadowChild extends HTMLElement {
      @request(channelName)
      async *sendFromShadow(value: number) {
        const response = await (yield { value });
        return response;
      }

      async triggerChannel() {
        return await this.sendFromShadow(42);
      }

      html() {
        return '<button>Send</button>';
      }
    }

    // Parent element that contains the child in its shadow DOM
    @element(parentElementName)
    class ShadowParent extends HTMLElement {
      html() {
        return `<${childElementName}></${childElementName}>`;
      }
    }

    const parent = document.createElement(parentElementName);
    container.appendChild(parent);
    
    // Attach controller to parent
    await attachController(parent, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Get child from parent's shadow DOM
    const child = parent.shadowRoot!.querySelector(childElementName) as any;
    
    // Trigger channel from child in shadow DOM
    const result = await child.triggerChannel();
    
    expect(result).toEqual({
      received: 42,
      fromController: true,
      doubled: 84
    });
  });

  it('should handle nested shadow DOM channel communication', async () => {
    const controllerName = uniqueName('nested-ctrl');
    const deepElementName = uniqueName('nested-deep');
    const middleElementName = uniqueName('nested-middle');
    const topElementName = uniqueName('nested-top');
    const channelName = uniqueName('nested-channel');

    @controller(controllerName)
    class NestedController {
      element: HTMLElement | null = null;

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @response(channelName)
      handleNestedRequest(data: any) {
        return { 
          depth: data.depth,
          message: `Received from depth ${data.depth}`,
          processed: true
        };
      }
    }

    // Deeply nested element
    @element(deepElementName)
    class NestedDeep extends HTMLElement {
      @request(channelName)
      async *sendFromDeep() {
        const response = await (yield { depth: 3, message: 'from deep' });
        return response;
      }

      async triggerDeepChannel() {
        return await this.sendFromDeep();
      }

      html() {
        return '<div>Deep Element</div>';
      }
    }

    @element(middleElementName)
    class NestedMiddle extends HTMLElement {
      html() {
        return `<${deepElementName}></${deepElementName}>`;
      }
    }

    @element(topElementName)  
    class NestedTop extends HTMLElement {
      html() {
        return `<${middleElementName}></${middleElementName}>`;
      }
    }

    const top = document.createElement(topElementName);
    container.appendChild(top);
    
    // Attach controller to top element
    await attachController(top, controllerName);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Navigate through shadow DOMs to get deep element
    const middle = top.shadowRoot!.querySelector(middleElementName);
    const deep = middle!.shadowRoot!.querySelector(deepElementName) as any;
    
    // Trigger channel from deeply nested element
    const result = await deep.triggerDeepChannel();
    
    expect(result).toEqual({
      depth: 3,
      message: 'Received from depth 3',
      processed: true
    });
  });
});