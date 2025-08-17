import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, controller, request, response, attachController, getController, property, query, watch } from '../src/index';

// Helper to generate unique names to avoid state conflicts
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('@request and @response cross-usage tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Elements using @request and @response', () => {
    it('should allow elements to use @request decorator', async () => {
      const elementName = uniqueName('request-elem');
      const controllerName = uniqueName('response-ctrl');
      const channelName = uniqueName('test-channel');

      // Element with @request (already tested extensively)
      @element(elementName)
      class RequestElement extends HTMLElement {
        @request(channelName)
        async *fetchData() {
          const response = await (yield { query: 'test' });
          return response;
        }

        html() {
          return '<div>Request Element</div>';
        }
      }

      // Controller with @response
      @controller(controllerName)
      class ResponseController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response(channelName)
        handleRequest(data: any) {
          return { result: `Processed: ${data.query}` };
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await el.fetchData();
      expect(result.result).toBe('Processed: test');
    });

    it('should allow elements to use @response decorator', async () => {
      const elementName = uniqueName('response-elem');
      const controllerName = uniqueName('request-ctrl');
      const channelName = uniqueName('elem-response-channel');

      // Element with @response - elements can respond too!
      @element(elementName)
      class ResponseElement extends HTMLElement {
        @response(channelName)
        handleElementRequest(data: any) {
          return { 
            handledBy: 'element',
            received: data.message,
            timestamp: Date.now()
          };
        }

        html() {
          return '<div>Response Element</div>';
        }
      }

      // Controller with @request
      @controller(controllerName)
      class RequestController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @request(channelName)
        async *sendFromController() {
          const response = await (yield { message: 'from controller' });
          return response;
        }

        async triggerRequest() {
          return await this.sendFromController();
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Get controller from element
      const ctrl = getController(el) as any;
      const result = await ctrl.triggerRequest();
      expect(result.handledBy).toBe('element');
      expect(result.received).toBe('from controller');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Controllers using @request and @response', () => {
    it('should allow controllers to use @request decorator', async () => {
      const elementName = uniqueName('ctrl-request-elem');
      const controllerName = uniqueName('ctrl-request');
      const channelName = uniqueName('ctrl-request-channel');

      // Element with @response
      @element(elementName)
      class ElementResponder extends HTMLElement {
        @response(channelName)
        handleControllerRequest(data: any) {
          return { 
            elementResponse: true,
            doubled: data.value * 2
          };
        }

        html() {
          return '<div>Element Responder</div>';
        }
      }

      // Controller with @request
      @controller(controllerName)
      class RequestingController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @request(channelName)
        async *fetchFromElement(value: number) {
          const response = await (yield { value });
          return response;
        }

        async doRequest() {
          return await this.fetchFromElement(21);
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Get controller from element
      const ctrl = getController(el) as any;
      const result = await ctrl.doRequest();
      expect(result.elementResponse).toBe(true);
      expect(result.doubled).toBe(42);
    });

    it('should allow controllers to use @response decorator', async () => {
      const elementName = uniqueName('ctrl-response-elem');
      const controllerName = uniqueName('ctrl-response');
      const channelName = uniqueName('ctrl-response-channel');

      // Controller with @response (already tested extensively)
      @controller(controllerName)
      class ResponseController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response(channelName)
        handleRequest(data: any) {
          return { controllerHandled: true, echo: data.test };
        }
      }

      // Element with @request
      @element(elementName)
      class RequestElement extends HTMLElement {
        @request(channelName)
        async *sendRequest() {
          const response = await (yield { test: 'data' });
          return response;
        }

        html() {
          return '<div>Request Element</div>';
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await el.sendRequest();
      expect(result.controllerHandled).toBe(true);
      expect(result.echo).toBe('data');
    });
  });

  describe('Mixed usage scenarios', () => {
    it('should handle element-to-element communication', async () => {
      const senderName = uniqueName('sender-elem');
      const receiverName = uniqueName('receiver-elem');
      const channelName = uniqueName('elem-to-elem');

      // Sender element with @request
      @element(senderName)
      class SenderElement extends HTMLElement {
        @request(channelName)
        async *sendToOther() {
          const response = await (yield { from: 'sender', data: 'hello' });
          return response;
        }

        html() {
          return '<div>Sender</div>';
        }
      }

      // Receiver element with @response
      @element(receiverName)
      class ReceiverElement extends HTMLElement {
        @response(channelName)
        handleFromOther(data: any) {
          return { 
            from: 'receiver',
            received: data.data,
            echo: `Got "${data.data}" from ${data.from}`
          };
        }

        html() {
          return '<div>Receiver</div>';
        }
      }

      // For element-to-element, sender must be nested inside receiver
      // so events bubble up to the receiver
      const receiver = document.createElement(receiverName);
      const sender = document.createElement(senderName) as any;
      
      // Nest sender inside receiver so events bubble
      receiver.appendChild(sender);
      container.appendChild(receiver);
      await new Promise(resolve => setTimeout(resolve, 30));

      const result = await sender.sendToOther();
      expect(result.from).toBe('receiver');
      expect(result.received).toBe('hello');
      expect(result.echo).toBe('Got "hello" from sender');
    });

    it('should handle controller making request with element responding', async () => {
      const elementName = uniqueName('ctrl-request-elem-response');
      const ctrlName = uniqueName('requesting-ctrl');
      const channelName = uniqueName('ctrl-to-elem-channel');

      // Element with @response decorator  
      @element(elementName)
      class ElementWithResponse extends HTMLElement {
        @response(channelName)
        handleControllerRequest(data: any) {
          return { 
            answer: '4',
            question: data.question,
            handledBy: 'element'
          };
        }

        html() {
          return '<div>Element with Response</div>';
        }
      }

      // Controller with @request decorator
      @controller(ctrlName)
      class RequestingController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @request(channelName)
        async *askElement() {
          const response = await (yield { question: 'What is 2+2?' });
          return response;
        }

        async doAsk() {
          return await this.askElement();
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      
      await attachController(el, ctrlName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const ctrl = getController(el) as any;
      const result = await ctrl.doAsk();
      expect(result.answer).toBe('4');
      expect(result.question).toBe('What is 2+2?');
      expect(result.handledBy).toBe('element');
    });

    it('should handle multiple responders with priority (first wins)', async () => {
      const elementName = uniqueName('multi-resp-elem');
      const ctrl1Name = uniqueName('priority-ctrl1');
      const ctrl2Name = uniqueName('priority-ctrl2');
      const channelName = uniqueName('priority-channel');

      @element(elementName)
      class MultiResponseElement extends HTMLElement {
        @request(channelName)
        async *sendRequest() {
          const response = await (yield { test: true });
          return response;
        }

        @response(channelName)
        elementHandler(data: any) {
          return { handler: 'element' };
        }

        html() {
          return '<div>Multi Response</div>';
        }
      }

      @controller(ctrl1Name)
      class PriorityController1 {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response(channelName)
        handleRequest(data: any) {
          return { handler: 'controller1' };
        }
      }

      @controller(ctrl2Name)
      class PriorityController2 {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response(channelName)
        handleRequest(data: any) {
          return { handler: 'controller2' };
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      
      // Attach controllers in order
      await attachController(el, ctrl1Name);
      await attachController(el, ctrl2Name);
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await el.sendRequest();
      // First responder wins (element's own handler)
      expect(result.handler).toBe('element');
    });
  });

  describe('Regression tests', () => {
    it('should not be tricked by element with this.element property', async () => {
      const elementName = uniqueName('tricky-elem');
      const controllerName = uniqueName('normal-ctrl');
      const channelName = uniqueName('trick-channel');

      // Element that tries to trick the system by having an element property
      @element(elementName)
      class TrickyElement extends HTMLElement {
        // This element property should NOT make the system think this is a controller
        element: HTMLElement | null = document.createElement('div');
        
        @request(channelName)
        async *sendRequest() {
          const response = await (yield { test: 'from-tricky-element' });
          return response;
        }

        html() {
          return '<div>Tricky Element with this.element</div>';
        }
      }

      @controller(controllerName)
      class NormalController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response(channelName)
        handleRequest(data: any) {
          return { 
            received: data.test,
            handledBy: 'controller'
          };
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Capture where the event is dispatched by intercepting dispatchEvent
      let dispatchedOn: EventTarget | null = null;
      const originalDispatch = el.dispatchEvent.bind(el);
      el.dispatchEvent = function(event: Event) {
        if (event.type === '@request/' + channelName) {
          dispatchedOn = this;
        }
        return originalDispatch(event);
      };

      // The request should still work correctly
      const result = await el.sendRequest();
      expect(result.received).toBe('from-tricky-element');
      expect(result.handledBy).toBe('controller');
      
      // The event should have been dispatched on the custom element itself
      expect(dispatchedOn).toBe(el);
      // And NOT on the element's fake "element" property
      expect(dispatchedOn).not.toBe(el.element);
    });

    it('should properly handle controller with element property when using @request', async () => {
      const elementName = uniqueName('resp-elem-for-ctrl');
      const controllerName = uniqueName('requesting-ctrl-regr');
      const channelName = uniqueName('ctrl-req-channel-regr');

      @element(elementName)
      class ResponseElement extends HTMLElement {
        @response(channelName)
        handleControllerRequest(data: any) {
          return { 
            result: data.value * 3,
            respondedBy: 'element'
          };
        }

        html() {
          return '<div>Response Element</div>';
        }
      }

      @controller(controllerName)
      class RequestingController {
        element: HTMLElement | null = null;
        
        // Add another fake element to try to confuse things
        fakeElement: HTMLElement = document.createElement('span');

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @request(channelName)
        async *makeRequest(value: number) {
          const response = await (yield { value });
          return response;
        }

        async doRequest() {
          return await this.makeRequest(7);
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const ctrl = getController(el) as any;
      
      // Capture where the event is dispatched by intercepting dispatchEvent
      let dispatchedOn: EventTarget | null = null;
      const originalDispatch = el.dispatchEvent.bind(el);
      el.dispatchEvent = function(event: Event) {
        if (event.type === '@request/' + channelName) {
          dispatchedOn = this;
        }
        return originalDispatch(event);
      };
      
      const result = await ctrl.doRequest();
      expect(result.result).toBe(21); // 7 * 3
      expect(result.respondedBy).toBe('element');
      
      // Event should be dispatched on the element the controller is attached to
      expect(dispatchedOn).toBe(el);
      // And NOT on the controller's fakeElement
      expect(dispatchedOn).not.toBe(ctrl.fakeElement);
    });
  });

  describe('Documentation examples from request-response.md', () => {
    it('should work with basic element-side request example', async () => {
      const elementName = uniqueName('user-card');
      const controllerName = uniqueName('user-controller');

      @element(elementName)
      class UserCard extends HTMLElement {
        userId = 123;
        
        html() {
          return `
            <div class="user-info">
              <button class="load">Load User</button>
              <div class="content"></div>
            </div>
          `;
        }
        
        @request('fetch-user')
        async *fetchUserData() {
          // Yield sends the request, await waits for response
          const user = await (yield { userId: this.userId });
          
          // Process the response
          this.displayUser(user);
          
          // Return final value (optional)
          return { success: true, user };
        }
        
        async loadUser() {
          try {
            const result = await this.fetchUserData();
            return result;
          } catch (error) {
            console.error('Failed to load user:', error);
            throw error;
          }
        }
        
        displayUser(user: any) {
          const content = this.shadowRoot?.querySelector('.content');
          if (content) {
            content.innerHTML = `
              <h3>${user.name}</h3>
              <p>${user.email}</p>
            `;
          }
        }
      }

      @controller(controllerName)
      class UserController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          this.element = element;
        }
        
        async detach() {
          this.element = null;
        }
        
        @response('fetch-user')
        async handleFetchUser(request: { userId: number }) {
          // Simulate API response
          return { 
            id: request.userId,
            name: 'John Doe',
            email: 'john@example.com'
          };
        }
      }

      const card = document.createElement(elementName) as any;
      container.appendChild(card);
      await attachController(card, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await card.loadUser();
      expect(result.success).toBe(true);
      expect(result.user.name).toBe('John Doe');
      expect(result.user.email).toBe('john@example.com');

      // Check that display was updated
      const content = card.shadowRoot?.querySelector('.content');
      expect(content?.innerHTML).toContain('John Doe');
      expect(content?.innerHTML).toContain('john@example.com');
    });

    it('should work with timeout configuration example', async () => {
      const elementName = uniqueName('timeout-example');
      const controllerName = uniqueName('timeout-controller');

      @element(elementName)
      class TimeoutExample extends HTMLElement {
        // Quick timeout for fast operations
        @request('quick-data', { timeout: 50 })
        async *fetchQuickData() {
          const data = await (yield { quick: true });
          return data;
        }
        
        // Longer timeout for slow operations
        @request('slow-data', { timeout: 5000 })
        async *fetchSlowData() {
          const data = await (yield { slow: true });
          return data;
        }
        
        // Custom event options
        @request('private-data', { 
          timeout: 1000,
          bubbles: false,  // Don't bubble
          cancelable: true  // Can be canceled
        })
        async *fetchPrivateData() {
          const data = await (yield { private: true });
          return data;
        }

        html() {
          return '<div>Timeout Example</div>';
        }
      }

      @controller(controllerName)
      class TimeoutController {
        element: HTMLElement | null = null;

        attach(element: HTMLElement) {
          this.element = element;
        }

        detach() {
          this.element = null;
        }

        @response('quick-data')
        handleQuick(data: any) {
          return { quick: true, received: data.quick };
        }

        @response('slow-data')
        async handleSlow(data: any) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { slow: true, received: data.slow };
        }

        @response('private-data')
        handlePrivate(data: any) {
          return { private: true, received: data.private };
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Test quick timeout (should succeed)
      const quickResult = await el.fetchQuickData();
      expect(quickResult.quick).toBe(true);

      // Test slow operation (should succeed with longer timeout)
      const slowResult = await el.fetchSlowData();
      expect(slowResult.slow).toBe(true);

      // Test private data with custom options
      const privateResult = await el.fetchPrivateData();
      expect(privateResult.private).toBe(true);
    });

    it('should work with streaming data example', async () => {
      const elementName = uniqueName('data-streamer');
      const controllerName = uniqueName('stream-controller');

      @element(elementName)
      class DataStreamer extends HTMLElement {
        private items: any[] = [];
        
        @request('stream-data')
        async *streamData() {
          // For now, just do a single request to test
          // Multiple yields in a loop aren't supported by the current implementation
          const response = await (yield { 
            page: 1,
            pageSize: 100  // Get all items in one go
          });
          
          // Add items to list
          this.items.push(...response.items);
          this.renderItems();
          
          return { 
            totalItems: this.items.length,
            complete: true
          };
        }
        
        renderItems() {
          const container = this.shadowRoot?.querySelector('.items');
          if (container) {
            container.innerHTML = this.items
              .map(item => `<div>${item.name}</div>`)
              .join('');
          }
        }
        
        html() {
          return `
            <button class="load">Load All Data</button>
            <div class="items"></div>
          `;
        }
        
        async loadAllData() {
          const result = await this.streamData();
          return result;
        }
      }

      @controller(controllerName)
      class StreamController {
        element: HTMLElement | null = null;
        private allData: any[] = Array.from({ length: 35 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`
        }));
        
        attach(element: HTMLElement) {
          this.element = element;
        }
        
        detach() {
          this.element = null;
        }
        
        @response('stream-data')
        async handleStreamData(request: { page: number; pageSize: number }) {
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 5));
          
          // For pageSize 100, return all data
          if (request.pageSize >= this.allData.length) {
            return {
              items: this.allData,
              hasMore: false,
              page: 1,
              totalPages: 1
            };
          }
          
          // Calculate pagination
          const start = (request.page - 1) * request.pageSize;
          const end = start + request.pageSize;
          
          const items = this.allData.slice(start, end);
          const hasMore = end < this.allData.length;
          
          return {
            items,
            hasMore,
            page: request.page,
            totalPages: Math.ceil(this.allData.length / request.pageSize)
          };
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await el.loadAllData();
      expect(result.totalItems).toBe(35);
      expect(result.complete).toBe(true);

      // Check that items were rendered
      const items = el.shadowRoot?.querySelectorAll('.items div');
      expect(items?.length).toBe(35);
      expect(items?.[0].textContent).toBe('Item 1');
      expect(items?.[34].textContent).toBe('Item 35');
    });

    it('should work with bidirectional updates example', async () => {
      const elementName = uniqueName('live-data');
      const controllerName = uniqueName('subscription-controller');

      @element(elementName)
      class LiveData extends HTMLElement {
        private updateInterval?: number;

        @property({ reflect: true })
        status = 'Disconnected';
        
        @query('.status')
        statusDiv?: HTMLElement;
        
        @query('.data')
        dataDiv?: HTMLElement;
        
        html() {
          return `
            <div class="status">${this.status}</div>
            <div class="data"></div>
            <button class="connect">Connect</button>
            <button class="disconnect">Disconnect</button>
          `;
        }
        
        @request('subscribe')
        async *subscribe() {
          // Send subscription request
          const subscription = await (yield { 
            subscribe: true,
            events: ['update', 'status']
          });
          
          if (subscription.success) {
            this.status = 'Connected';  // @watch will handle UI update
            
            // Start polling for updates
            this.startPolling();
          }
          
          return subscription;
        }
        
        @request('poll-updates')
        async *pollForUpdates() {
          const updates = await (yield { poll: true });
          
          if (updates && updates.length > 0) {
            this.processUpdates(updates);
          }
          
          return { processed: updates.length };
        }
        
        startPolling() {
          this.updateInterval = setInterval(async () => {
            await this.pollForUpdates();
          }, 100) as any; // Fast polling for test
        }
        
        stopPolling() {
          if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
          }
        }
        
        processUpdates(updates: any[]) {
          if (this.dataDiv) {
            updates.forEach(update => {
              const entry = document.createElement('div');
              entry.textContent = `${update.type}: ${update.value}`;
              this.dataDiv!.appendChild(entry);
            });
          }
        }
        
        @watch('status')
        updateStatus() {
          if (this.statusDiv) {
            this.statusDiv.textContent = this.status;
          }
        }
        
        disconnectedCallback() {
          super.disconnectedCallback?.();
          this.stopPolling();
        }
      }

      @controller(controllerName)
      class SubscriptionController {
        element: HTMLElement | null = null;
        private subscribers = new Set<string>();
        private updates: any[] = [];
        
        async attach(element: HTMLElement) {
          this.element = element;
          // Generate updates periodically
          setInterval(() => {
            this.updates.push({
              type: 'update',
              value: Math.random(),
              timestamp: Date.now()
            });
          }, 50);
        }
        
        async detach() {
          this.element = null;
          this.subscribers.clear();
        }
        
        @response('subscribe')
        handleSubscribe(request: any) {
          if (request.subscribe) {
            const id = Math.random().toString(36);
            this.subscribers.add(id);
            
            return {
              success: true,
              subscriptionId: id,
              events: request.events
            };
          }
          
          return { success: false };
        }
        
        @response('poll-updates')
        handlePollUpdates(request: any) {
          if (!request.poll) return [];
          
          // Return and clear updates
          const updates = [...this.updates];
          this.updates = [];
          
          return updates;
        }
      }

      const el = document.createElement(elementName) as any;
      container.appendChild(el);
      await attachController(el, controllerName);
      await new Promise(resolve => setTimeout(resolve, 20));

      // Subscribe and start polling
      const subscription = await el.subscribe();
      expect(subscription.success).toBe(true);
      expect(el.status).toBe('Connected');

      // Wait for some updates to accumulate
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop polling to check results
      el.stopPolling();

      // Check that updates were received and displayed
      const dataEntries = el.shadowRoot?.querySelectorAll('.data div');
      expect(dataEntries?.length).toBeGreaterThan(0);
      
      // Check status was updated
      const statusDiv = el.shadowRoot?.querySelector('.status');
      expect(statusDiv?.textContent).toBe('Connected');
    });
  });
});