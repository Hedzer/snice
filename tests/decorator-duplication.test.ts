import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on, respond, observe, context, render, html, request } from '../src/index';
import { getSymbol } from '../src/symbols';

const ON_HANDLERS = getSymbol('on-handlers');
const CHANNEL_HANDLERS = getSymbol('channel-handlers');
const OBSERVERS = getSymbol('observers');
const CONTEXT_HANDLERS = getSymbol('context-handlers');

describe('Decorator duplication bug - all decorators', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('@respond should not duplicate handlers when creating multiple instances', async () => {
    const responseHandler = vi.fn();

    const uniqueChannelName = `test-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const tagName = `test-respond-dup-${Date.now()}`;

    @element(tagName)
    class TestRespondDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @respond(uniqueChannelName)
      handleRequest(data: any) {
        responseHandler(data);
        return { success: true, received: data };
      }
    }

    const constructor = TestRespondDup as any;

    // Create 3 instances
    const instances = [];
    for (let i = 0; i < 3; i++) {
      const el = document.createElement(tagName) as TestRespondDup;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Handler should only be registered once per class
    const handlerCount = constructor[CHANNEL_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(1);

    // Manually dispatch request to the channel
    const channelEvent = new CustomEvent(`@request/${uniqueChannelName}`, {
      detail: {
        payload: { test: 'data' },
        discovery: {
          resolve: () => {},
          reject: () => {}
        },
        data: {
          resolve: (response: any) => {},
          reject: (error: any) => {}
        }
      },
      bubbles: true,
      composed: true
    });

    instances[0].dispatchEvent(channelEvent);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Handler should be called exactly once (not 3 times for 3 instances)
    expect(responseHandler).toHaveBeenCalledTimes(1);
    expect(responseHandler).toHaveBeenCalledWith({ test: 'data' });
  });

  it('@observe should not duplicate observers when creating multiple instances', async () => {
    const mutationHandler = vi.fn();

    @element('test-observe-dup')
    class TestObserveDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="content">Test</div>`;
      }

      @observe('mutation:.content', { attributes: true })
      handleMutation(mutations: MutationRecord[]) {
        mutationHandler(mutations);
      }
    }

    const constructor = TestObserveDup as any;

    // Create 3 instances
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('test-observe-dup') as TestObserveDup;
      container.appendChild(el);
      await el.ready;
    }

    // Observer should only be registered once per class
    const observerCount = constructor[OBSERVERS]?.length || 0;
    expect(observerCount).toBe(1);
  });

  it('@context should not duplicate handlers when creating multiple instances', async () => {
    const contextHandler = vi.fn();

    @element('test-context-dup')
    class TestContextDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @context()
      handleContext(ctx: any) {
        contextHandler(ctx);
      }
    }

    const constructor = TestContextDup as any;

    // Create 3 instances
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('test-context-dup') as TestContextDup;
      container.appendChild(el);
      await el.ready;
    }

    // Handler should only be registered once per class
    const handlerCount = constructor[CONTEXT_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(1);
  });

  it('multiple decorators on same class should all work without duplication', async () => {
    const clickHandler = vi.fn();
    const responseHandler = vi.fn().mockResolvedValue('response');
    const contextHandler = vi.fn();

    @element('test-multi-decorators')
    class TestMultiDecorators extends HTMLElement {
      @render()
      renderContent() {
        return html`<button>Click</button>`;
      }

      @on('click', 'button')
      handleClick(e: Event) {
        clickHandler(e);
      }

      @respond('multi-request')
      async handleRequest(data: any) {
        return responseHandler(data);
      }

      @context()
      handleContext(ctx: any) {
        contextHandler(ctx);
      }
    }

    const constructor = TestMultiDecorators as any;

    // Create 5 instances
    const instances: TestMultiDecorators[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-multi-decorators') as TestMultiDecorators;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Check all handler counts
    expect(constructor[ON_HANDLERS]?.length).toBe(1);
    expect(constructor[CHANNEL_HANDLERS]?.length).toBe(1);
    expect(constructor[CONTEXT_HANDLERS]?.length).toBe(1);

    // Click first instance button - should fire exactly once
    const button = instances[0].shadowRoot?.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Request via @request decorator should fire exactly once
    // Since we can't easily test @request in this file (requires generator),
    // we'll manually dispatch the event like a @request would
    const requestEvent = new CustomEvent('@request/multi-request', {
      detail: {
        payload: { test: 'data' },
        discovery: { resolve: () => {}, reject: () => {} },
        data: { resolve: () => {}, reject: () => {} }
      },
      bubbles: true,
      composed: true
    });
    instances[0].dispatchEvent(requestEvent);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(responseHandler).toHaveBeenCalledTimes(1);
  });

  it('creating 100 instances should not cause performance issues or duplication', async () => {
    const clickHandler = vi.fn();

    @element('test-many-instances')
    class TestManyInstances extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @on('click')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }

    const constructor = TestManyInstances as any;

    // Create 100 instances
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      const el = document.createElement('test-many-instances') as TestManyInstances;
      container.appendChild(el);
      await el.ready;
    }
    const duration = Date.now() - startTime;

    // Should complete in reasonable time (less than 5 seconds)
    expect(duration).toBeLessThan(5000);

    // Handler count should still be 1
    expect(constructor[ON_HANDLERS]?.length).toBe(1);
  });
});
