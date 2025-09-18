import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, on, dispatch, query, property, request, respond, part, observe } from '../src/index';

describe('Decorator stacking and this context preservation', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  it('should preserve this context when stacking @on and @dispatch decorators', async () => {
    const eventLog: string[] = [];

    @element('test-stacking-basic')
    class TestStackingBasic extends HTMLElement {
      @property()
      value = 'initial';

      @query('button')
      button?: HTMLElement;

      html() {
        return `<button>Click me</button>`;
      }

      @on('click', 'button')
      @dispatch('test-clicked')
      handleClick(event: Event) {
        // Verify this context is preserved
        expect(this).toBeInstanceOf(TestStackingBasic);
        expect(this.value).toBe('initial');

        // Modify instance property
        this.value = 'clicked';

        // Return data for dispatch
        return {
          timestamp: Date.now(),
          value: this.value,
          hasButton: !!this.button
        };
      }
    }

    const el = document.createElement('test-stacking-basic') as TestStackingBasic;
    document.body.appendChild(el);
    await el.ready;

    // Listen for dispatched event
    el.addEventListener('test-clicked', (event: any) => {
      eventLog.push('event-received');
      expect(event.detail.value).toBe('clicked');
      expect(event.detail.hasButton).toBe(true);
      expect(typeof event.detail.timestamp).toBe('number');
    });

    // Click the button
    const button = el.shadowRoot!.querySelector('button');
    button!.click();

    expect(el.value).toBe('clicked');
    expect(eventLog).toContain('event-received');
  });

  it('should work with multiple stacked decorators and async methods', async () => {
    const eventLog: any[] = [];

    @element('test-stacking-async')
    class TestStackingAsync extends HTMLElement {
      @property()
      counter = 0;

      html() {
        return `<button>Async Click</button>`;
      }

      @on('click', 'button')
      @dispatch('async-completed')
      async handleAsyncClick(event: Event) {
        // Verify this context in async method
        expect(this).toBeInstanceOf(TestStackingAsync);

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10));

        this.counter++;

        return {
          counter: this.counter,
          element: this.tagName
        };
      }
    }

    const el = document.createElement('test-stacking-async') as TestStackingAsync;
    document.body.appendChild(el);
    await el.ready;

    // Listen for dispatched event
    el.addEventListener('async-completed', (event: any) => {
      eventLog.push(event.detail);
    });

    // Click multiple times
    const button = el.shadowRoot!.querySelector('button');
    button!.click();
    button!.click();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.counter).toBe(2);
    expect(eventLog).toHaveLength(2);
    expect(eventLog[0].counter).toBe(1);
    expect(eventLog[1].counter).toBe(2);
    expect(eventLog[0].element).toBe('TEST-STACKING-ASYNC');
  });

  it('should preserve this context with multiple event listeners', async () => {
    const events: string[] = [];

    @element('test-stacking-multiple')
    class TestStackingMultiple extends HTMLElement {
      @property()
      state = 'idle';

      html() {
        return `
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
        `;
      }

      @on('click', '#btn1')
      @dispatch('button1-clicked')
      handleButton1(event: Event) {
        expect(this).toBeInstanceOf(TestStackingMultiple);
        this.state = 'button1-clicked';
        return { button: 1, state: this.state };
      }

      @on('click', '#btn2')
      @dispatch('button2-clicked')
      handleButton2(event: Event) {
        expect(this).toBeInstanceOf(TestStackingMultiple);
        this.state = 'button2-clicked';
        return { button: 2, state: this.state };
      }
    }

    const el = document.createElement('test-stacking-multiple') as TestStackingMultiple;
    document.body.appendChild(el);
    await el.ready;

    // Listen for both events
    el.addEventListener('button1-clicked', (e: any) => events.push(`btn1:${e.detail.state}`));
    el.addEventListener('button2-clicked', (e: any) => events.push(`btn2:${e.detail.state}`));

    // Click both buttons
    el.shadowRoot!.querySelector('#btn1')!.dispatchEvent(new Event('click', { bubbles: true }));
    el.shadowRoot!.querySelector('#btn2')!.dispatchEvent(new Event('click', { bubbles: true }));

    expect(events).toEqual(['btn1:button1-clicked', 'btn2:button2-clicked']);
    expect(el.state).toBe('button2-clicked');
  });

  it('should handle decorator stacking with timing options', async () => {
    const eventLog: any[] = [];

    @element('test-stacking-timing')
    class TestStackingTiming extends HTMLElement {
      @property()
      clickCount = 0;

      html() {
        return `<button>Throttled Click</button>`;
      }

      @on('click', 'button')
      @dispatch('throttled-click', { throttle: 50 })
      handleThrottledClick(event: Event) {
        expect(this).toBeInstanceOf(TestStackingTiming);
        this.clickCount++;
        return {
          count: this.clickCount,
          timestamp: Date.now()
        };
      }
    }

    const el = document.createElement('test-stacking-timing') as TestStackingTiming;
    document.body.appendChild(el);
    await el.ready;

    el.addEventListener('throttled-click', (e: any) => {
      eventLog.push(e.detail);
    });

    const button = el.shadowRoot!.querySelector('button')!;

    // Rapid clicks - should be throttled
    button.click();
    button.click();
    button.click();

    // Wait for throttle period
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have received fewer events due to throttling
    expect(eventLog.length).toBeLessThan(3);
    expect(el.clickCount).toBeGreaterThan(0);
  });

  it('should work with @query decorator in stacked methods', async () => {
    @element('test-stacking-query')
    class TestStackingQuery extends HTMLElement {
      @property()
      message = '';

      @query('input')
      input?: HTMLInputElement;

      @query('span')
      output?: HTMLSpanElement;

      html() {
        return `
          <input type="text" value="test" />
          <button>Update</button>
          <span></span>
        `;
      }

      @on('click', 'button')
      @dispatch('text-updated')
      updateText(event: Event) {
        // Test that @query works properly with stacked decorators
        expect(this).toBeInstanceOf(TestStackingQuery);
        expect(this.input).toBeInstanceOf(HTMLInputElement);
        expect(this.output).toBeInstanceOf(HTMLSpanElement);

        const value = this.input!.value;
        this.message = value;
        this.output!.textContent = value;

        return {
          value,
          hasInput: !!this.input,
          hasOutput: !!this.output
        };
      }
    }

    const el = document.createElement('test-stacking-query') as TestStackingQuery;
    document.body.appendChild(el);
    await el.ready;

    let dispatchedData: any;
    el.addEventListener('text-updated', (e: any) => {
      dispatchedData = e.detail;
    });

    // Trigger the stacked method
    el.shadowRoot!.querySelector('button')!.click();

    expect(el.message).toBe('test');
    expect(el.shadowRoot!.querySelector('span')!.textContent).toBe('test');
    expect(dispatchedData.value).toBe('test');
    expect(dispatchedData.hasInput).toBe(true);
    expect(dispatchedData.hasOutput).toBe(true);
  });

  it('should preserve this across decorator chain with error handling', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-stacking-error')
    class TestStackingError extends HTMLElement {
      @property()
      shouldError = false;

      html() {
        return `<button>Click</button>`;
      }

      @on('click', 'button')
      @dispatch('maybe-error')
      handleClickWithError(event: Event) {
        expect(this).toBeInstanceOf(TestStackingError);

        if (this.shouldError) {
          throw new Error('Test error');
        }

        return { success: true };
      }
    }

    const el = document.createElement('test-stacking-error') as TestStackingError;
    document.body.appendChild(el);
    await el.ready;

    const events: any[] = [];
    el.addEventListener('maybe-error', (e: any) => events.push(e.detail));

    // First click should work
    el.shadowRoot!.querySelector('button')!.click();
    expect(events).toHaveLength(1);
    expect(events[0].success).toBe(true);

    // Second click should error but not break the decorator stack
    el.shouldError = true;
    el.shadowRoot!.querySelector('button')!.click();

    // Should still be 1 event (error prevented dispatch)
    expect(events).toHaveLength(1);

    errorSpy.mockRestore();
  });

  it('should work with triple-stacked decorators and complex this access', async () => {
    @element('test-triple-stack')
    class TestTripleStack extends HTMLElement {
      @property()
      data = { count: 0, messages: [] as string[] };

      @query('.status')
      statusEl?: HTMLElement;

      html() {
        return `
          <button>Triple Stack</button>
          <div class="status"></div>
        `;
      }

      // Triple-stacked decorators
      @on('click', 'button')
      @dispatch('first-event')
      @dispatch('second-event')
      tripleStackMethod(event: Event) {
        // Verify complex this access works
        expect(this).toBeInstanceOf(TestTripleStack);
        expect(this.data).toBeDefined();
        expect(this.statusEl).toBeInstanceOf(HTMLElement);

        // Mutate instance state
        this.data.count++;
        this.data.messages.push(`Click ${this.data.count}`);
        this.statusEl!.textContent = `Count: ${this.data.count}`;

        return {
          count: this.data.count,
          latestMessage: this.data.messages[this.data.messages.length - 1],
          elementExists: !!this.statusEl
        };
      }
    }

    const el = document.createElement('test-triple-stack') as TestTripleStack;
    document.body.appendChild(el);
    await el.ready;

    const firstEvents: any[] = [];
    const secondEvents: any[] = [];

    el.addEventListener('first-event', (e: any) => firstEvents.push(e.detail));
    el.addEventListener('second-event', (e: any) => secondEvents.push(e.detail));

    // Click the button
    el.shadowRoot!.querySelector('button')!.click();

    // Both events should fire with same data
    expect(firstEvents).toHaveLength(1);
    expect(secondEvents).toHaveLength(1);
    expect(firstEvents[0]).toEqual(secondEvents[0]);
    expect(firstEvents[0].count).toBe(1);
    expect(firstEvents[0].latestMessage).toBe('Click 1');
    expect(firstEvents[0].elementExists).toBe(true);

    // DOM should be updated
    expect(el.statusEl!.textContent).toBe('Count: 1');
    expect(el.data.count).toBe(1);
  });

  it('should debug why @dispatch + @on fails vs @on + @dispatch', async () => {
    const results: any[] = [];

    @element('test-order-debug')
    class TestOrderDebug extends HTMLElement {
      testValue = 'test-instance';

      html() {
        return `
          <button class="test1">Test @on + @dispatch</button>
          <button class="test2">Test @dispatch + @on</button>
        `;
      }

      // Working order: @on then @dispatch
      @on('click', '.test1')
      @dispatch('test1-result')
      method1(event: Event) {
        return {
          source: 'method1',
          testValue: this.testValue,
          thisType: this.constructor.name
        };
      }

      // Different order: @dispatch then @on
      @dispatch('test2-result')
      @on('click', '.test2')
      method2(event: Event) {
        return {
          source: 'method2',
          testValue: this.testValue,
          thisType: this.constructor.name
        };
      }
    }

    const el = document.createElement('test-order-debug') as TestOrderDebug;
    document.body.appendChild(el);
    await el.ready;

    // Listen for events
    el.addEventListener('test1-result', (e: any) => {
      results.push({ event: 'test1', ...e.detail });
    });

    el.addEventListener('test2-result', (e: any) => {
      results.push({ event: 'test2', ...e.detail });
    });

    // Test both decorator orders
    el.shadowRoot!.querySelector('.test1')!.click();
    el.shadowRoot!.querySelector('.test2')!.click();

    // Both should work and preserve this context
    expect(results.length).toBe(2);

    const test1Result = results.find(r => r.event === 'test1');
    const test2Result = results.find(r => r.event === 'test2');

    // Both methods should work regardless of decorator order
    expect(test1Result).toBeDefined();
    expect(test2Result).toBeDefined();

    expect(test1Result!.testValue).toBe('test-instance');
    expect(test1Result!.thisType).toBe('TestOrderDebug');

    expect(test2Result!.testValue).toBe('test-instance');
    expect(test2Result!.thisType).toBe('TestOrderDebug');
  });

  it('should work with @request and @response decorators', async () => {
    const results: any[] = [];

    @element('test-request-response')
    class TestRequestResponse extends HTMLElement {
      @property()
      instanceId = Math.random();

      html() {
        return `<button class="trigger">Trigger Request</button>`;
      }

      @on('click', '.trigger')
      @request('test-data')
      async *fetchData(event: Event) {
        yield {
          requestId: this.instanceId,
          timestamp: Date.now()
        };
      }

      @respond('test-data')
      async handleDataRequest(data: any) {
        expect(this).toBeInstanceOf(TestRequestResponse);
        results.push({
          type: 'response',
          requestId: data.requestId,
          instanceId: this.instanceId,
          thisPreserved: data.requestId === this.instanceId
        });
        return { processed: true, data };
      }
    }

    const el = document.createElement('test-request-response') as TestRequestResponse;
    document.body.appendChild(el);
    await el.ready;

    // Trigger the request
    el.shadowRoot!.querySelector('.trigger')!.click();

    // Wait for async request/response cycle
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(results).toHaveLength(1);
    expect(results[0].thisPreserved).toBe(true);
    expect(results[0].instanceId).toBe(el.instanceId);
  });

  it('should work with @part decorator combinations', async () => {
    let renderCount = 0;

    @element('test-part-stacking')
    class TestPartStacking extends HTMLElement {
      @property()
      counter = 0;

      html() {
        return `
          <button class="increment">Increment</button>
          <div part="display"></div>
        `;
      }

      @on('click', '.increment')
      @dispatch('counter-updated')
      incrementCounter(event: Event) {
        this.counter++;
        this.updateDisplay();
        return { counter: this.counter, instanceType: this.constructor.name };
      }

      @part('display')
      updateDisplay() {
        renderCount++;
        expect(this).toBeInstanceOf(TestPartStacking);
        return `Count: ${this.counter} (renders: ${renderCount})`;
      }
    }

    const el = document.createElement('test-part-stacking') as TestPartStacking;
    document.body.appendChild(el);
    await el.ready;

    const events: any[] = [];
    el.addEventListener('counter-updated', (e: any) => events.push(e.detail));

    // Click the button multiple times
    const button = el.shadowRoot!.querySelector('.increment')!;
    button.click();
    button.click();
    button.click();

    expect(el.counter).toBe(3);
    expect(events).toHaveLength(3); // All dispatch events should fire
    expect(renderCount).toBeGreaterThan(0); // Parts should render
    expect(events[0].instanceType).toBe('TestPartStacking');

    // Check that the part content is updated
    const displayEl = el.shadowRoot!.querySelector('[part="display"]');
    expect(displayEl!.innerHTML).toContain('Count: 3');
  });

  it('should work with @part decorator stacking', async () => {
    const results: any[] = [];
    let renderCount = 0;

    @element('test-part-dispatch')
    class TestPartDispatch extends HTMLElement {
      @property()
      value = 'initial';

      html() {
        return `
          <button class="update">Update</button>
          <div part="content"></div>
        `;
      }

      @on('click', '.update')
      @dispatch('value-updated')
      updateValue(event: Event) {
        this.value = 'updated-' + Date.now();
        this.renderContent();
        return { value: this.value, instanceType: this.constructor.name };
      }

      @part('content')
      @dispatch('content-rendered')
      renderContent() {
        renderCount++;
        expect(this).toBeInstanceOf(TestPartDispatch);
        return `Content: ${this.value} (renders: ${renderCount})`;
      }
    }

    const el = document.createElement('test-part-dispatch') as TestPartDispatch;
    document.body.appendChild(el);
    await el.ready;

    el.addEventListener('value-updated', (e: any) => results.push({ type: 'update', ...e.detail }));
    el.addEventListener('content-rendered', (e: any) => results.push({ type: 'render', ...e.detail }));

    // Trigger update
    el.shadowRoot!.querySelector('.update')!.click();

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.type === 'update')).toBe(true);
    expect(results.some(r => r.type === 'render')).toBe(true);
    expect(renderCount).toBeGreaterThan(0);
  });

  it('should work with @query and @dispatch decorators', async () => {
    const results: any[] = [];

    @element('test-query-dispatch')
    class TestQueryDispatch extends HTMLElement {
      @query('.target')
      targetEl?: HTMLElement;

      html() {
        return `
          <button class="action">Test Query</button>
          <div class="target">Target Element</div>
        `;
      }

      @on('click', '.action')
      @dispatch('query-tested')
      testQuery(event: Event) {
        expect(this).toBeInstanceOf(TestQueryDispatch);
        expect(this.targetEl).toBeInstanceOf(HTMLElement);

        return {
          hasTarget: !!this.targetEl,
          targetText: this.targetEl?.textContent,
          instanceType: this.constructor.name
        };
      }
    }

    const el = document.createElement('test-query-dispatch') as TestQueryDispatch;
    document.body.appendChild(el);
    await el.ready;

    el.addEventListener('query-tested', (e: any) => results.push(e.detail));

    // Trigger the test
    el.shadowRoot!.querySelector('.action')!.click();

    expect(results).toHaveLength(1);
    expect(results[0].hasTarget).toBe(true);
    expect(results[0].targetText).toBe('Target Element');
    expect(results[0].instanceType).toBe('TestQueryDispatch');
  });

  it('should work with @property and @dispatch decorators', async () => {
    const results: any[] = [];

    @element('test-property-dispatch')
    class TestPropertyDispatch extends HTMLElement {
      @property()
      testValue = 'initial';

      html() {
        return `<button class="update">Update Property</button>`;
      }

      @on('click', '.update')
      @dispatch('property-updated')
      updateProperty(event: Event) {
        expect(this).toBeInstanceOf(TestPropertyDispatch);
        this.testValue = 'updated-' + Date.now();

        return {
          newValue: this.testValue,
          instanceType: this.constructor.name
        };
      }
    }

    const el = document.createElement('test-property-dispatch') as TestPropertyDispatch;
    document.body.appendChild(el);
    await el.ready;

    el.addEventListener('property-updated', (e: any) => results.push(e.detail));

    const initialValue = el.testValue;
    el.shadowRoot!.querySelector('.update')!.click();

    expect(results).toHaveLength(1);
    expect(results[0].newValue).not.toBe(initialValue);
    expect(results[0].instanceType).toBe('TestPropertyDispatch');
    expect(el.testValue).toBe(results[0].newValue);
  });

  it('should work with triple decorator stacking', async () => {
    const results: any[] = [];

    @element('test-triple-decorators')
    class TestTripleDecorators extends HTMLElement {
      instanceValue = 'test-instance';

      html() {
        return `
          <button class="test1">Order 1</button>
          <button class="test2">Order 2</button>
        `;
      }

      // Order: @on → @dispatch → @query (using query in method)
      @on('click', '.test1')
      @dispatch('test1-result')
      testMethod1(event: Event) {
        expect(this.instanceValue).toBe('test-instance');

        // Use query functionality within the method
        const button = this.shadowRoot?.querySelector('.test1') as HTMLElement;

        return {
          method: 1,
          instanceValue: this.instanceValue,
          buttonFound: !!button,
          buttonText: button?.textContent
        };
      }

      // Reverse order: @dispatch → @on (with method chaining)
      @dispatch('test2-result')
      @on('click', '.test2')
      testMethod2(event: Event) {
        expect(this.instanceValue).toBe('test-instance');

        return this.processData({
          method: 2,
          instanceValue: this.instanceValue
        });
      }

      // Helper method to test method chaining
      processData(data: any) {
        expect(this).toBeInstanceOf(TestTripleDecorators);
        return {
          ...data,
          processed: true,
          processorType: this.constructor.name
        };
      }
    }

    const el = document.createElement('test-triple-decorators') as TestTripleDecorators;
    document.body.appendChild(el);
    await el.ready;

    el.addEventListener('test1-result', (e: any) => results.push({ test: 1, ...e.detail }));
    el.addEventListener('test2-result', (e: any) => results.push({ test: 2, ...e.detail }));

    // Test both decorator orders
    el.shadowRoot!.querySelector('.test1')!.click();
    el.shadowRoot!.querySelector('.test2')!.click();

    expect(results).toHaveLength(2);

    const test1Result = results.find(r => r.test === 1);
    const test2Result = results.find(r => r.test === 2);

    expect(test1Result.method).toBe(1);
    expect(test1Result.instanceValue).toBe('test-instance');
    expect(test1Result.buttonFound).toBe(true);
    expect(test1Result.buttonText).toBe('Order 1');

    expect(test2Result.method).toBe(2);
    expect(test2Result.instanceValue).toBe('test-instance');
    expect(test2Result.processed).toBe(true);
    expect(test2Result.processorType).toBe('TestTripleDecorators');
  });
});