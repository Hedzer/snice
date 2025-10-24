import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, controller, observe, render, html } from '../src/index';

describe('@observe in controllers', () => {
  let container: HTMLElement;
  let testId = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    testId++;
  });

  afterEach(() => {
    container.remove();
  });

  it('should support @observe in controllers', async () => {
    const controllerName = `test-observe-controller-${testId}`;
    const tagName = `test-observe-element-${testId}`;
    let mediaCount = 0;
    let mutationCount = 0;
    let lastMediaMatch: boolean | null = null;

    @controller(controllerName)
    class ObserverController {
      element: HTMLElement | null = null;

      @observe('media:(min-width: 500px)')
      handleMedia(matches: boolean) {
        mediaCount++;
        lastMediaMatch = matches;
      }

      @observe('mutation:childList', '.content')
      handleMutation(mutations: MutationRecord[]) {
        mutationCount++;
      }

      async attach(element: HTMLElement) {
        this.element = element;
      }

      async detach(element: HTMLElement) {
        this.element = null;
      }
    }

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="content">Initial content</div>`;
      }
    }

    container.innerHTML = `<${tagName} controller="${controllerName}"></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    // Wait for media query callback
    await new Promise(resolve => setTimeout(resolve, 10));

    // Media query should be called immediately
    expect(mediaCount).toBeGreaterThan(0);
    expect(typeof lastMediaMatch).toBe('boolean');

    // Trigger mutation
    const content = el.shadowRoot.querySelector('.content');
    const child = document.createElement('span');
    child.textContent = 'New child';
    content.appendChild(child);

    // Wait for mutation observer
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mutationCount).toBeGreaterThan(0);
  });

  it('should cleanup observers when controller detaches', async () => {
    const controllerName = `test-cleanup-controller-${testId}`;
    const tagName = `test-cleanup-element-${testId}`;
    let observerCount = 0;

    @controller(controllerName)
    class CleanupController {
      element: HTMLElement | null = null;

      @observe('media:(max-width: 600px)')
      handleMedia() {
        observerCount++;
      }

      @observe('mutation:attributes:data-test', '.item')
      handleAttributeChange() {
        observerCount++;
      }

      async attach(element: HTMLElement) {
        this.element = element;
      }

      async detach(element: HTMLElement) {
        this.element = null;
      }
    }

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="item" data-test="initial">Item</div>`;
      }
    }

    container.innerHTML = `<${tagName} controller="${controllerName}"></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    // Wait for media query callback
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialCount = observerCount;

    // Remove controller by setting to empty string
    el.setAttribute('controller', '');
    
    // Wait for detach
    await new Promise(resolve => setTimeout(resolve, 10));

    // Try to trigger observers - they should not fire
    const item = el.shadowRoot?.querySelector('.item');
    if (item) {
      item.setAttribute('data-test', 'changed');
    }

    await new Promise(resolve => setTimeout(resolve, 10));

    // Count should not have increased after detach
    expect(observerCount).toBe(initialCount);
  });

  it('should work with multiple @observe decorators in controller', async () => {
    const controllerName = `test-mixed-controller-${testId}`;
    const tagName = `test-mixed-element-${testId}`;
    let mediaCount = 0;
    let mutationCount = 0;

    @controller(controllerName)
    class MixedController {
      element: HTMLElement | null = null;

      @observe('media:(min-width: 1px)')
      handleMedia() {
        mediaCount++;
      }

      @observe('mutation:childList')
      handleMutation() {
        mutationCount++;
      }

      async attach(element: HTMLElement) {
        this.element = element;
      }

      async detach(element: HTMLElement) {
        this.element = null;
      }
    }

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="content">Content</div>`;
      }
    }

    container.innerHTML = `<${tagName} controller="${controllerName}"></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    // Wait for media query
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Media query should have fired
    expect(mediaCount).toBeGreaterThan(0);

    // Add content to shadow root to trigger mutation
    el.shadowRoot.appendChild(document.createElement('p'));
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mutationCount).toBeGreaterThan(0);
  });

  it('should handle throttled observers in controller', async () => {
    const controllerName = `test-throttle-controller-${testId}`;
    const tagName = `test-throttle-element-${testId}`;
    let callCount = 0;
    const callTimes: number[] = [];

    @controller(controllerName)
    class ThrottleController {
      element: HTMLElement | null = null;

      @observe('mutation:childList', '.list', { throttle: 50 })
      handleListChange() {
        callCount++;
        callTimes.push(Date.now());
      }

      async attach(element: HTMLElement) {
        this.element = element;
      }

      async detach(element: HTMLElement) {
        this.element = null;
      }
    }

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<ul class="list"></ul>`;
      }
    }

    container.innerHTML = `<${tagName} controller="${controllerName}"></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const list = el.shadowRoot.querySelector('.list');

    // Add multiple items rapidly
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('li');
      item.textContent = `Item ${i}`;
      list.appendChild(item);
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Wait for throttle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be throttled
    expect(callCount).toBeLessThan(5);
    expect(callCount).toBeGreaterThan(0);

    // Check timing (allow more variance for CI environments)
    for (let i = 1; i < callTimes.length; i++) {
      const timeDiff = callTimes[i] - callTimes[i - 1];
      expect(timeDiff).toBeGreaterThanOrEqual(40); // Allow variance for timing in tests
    }
  });
});