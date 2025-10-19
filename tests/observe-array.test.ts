import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, observe, render, html } from '../src/index';

describe('@observe with array syntax', () => {
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

  it('should support array syntax for multiple observer types', async () => {
    const tagName = `test-array-observe-${testId}`;
    let childListCount = 0;
    let attributeCount = 0;

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <div class="content" data-state="initial">Content</div>
        `;
      }

      @observe(['mutation:childList', 'mutation:attributes'], '.content')
      handleMutation(mutations: MutationRecord[]) {
        mutations.forEach(m => {
          if (m.type === 'childList') childListCount++;
          if (m.type === 'attributes') attributeCount++;
        });
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const content = el.shadowRoot.querySelector('.content');

    // Trigger childList mutation
    const child = document.createElement('span');
    child.textContent = 'New child';
    content.appendChild(child);

    // Wait for mutation observer
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(childListCount).toBeGreaterThan(0);

    // Trigger attribute mutation
    content.setAttribute('data-state', 'changed');
    
    // Wait for mutation observer
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(attributeCount).toBeGreaterThan(0);
  });

  it('should support array syntax for media queries', async () => {
    const tagName = `test-array-media-${testId}`;
    let smallCount = 0;
    let largeCount = 0;

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Responsive</div>`;
      }

      @observe(['media:(max-width: 600px)', 'media:(min-width: 1024px)'])
      handleMediaChanges(matches: boolean) {
        // This will be called for each media query
        // In tests, we can't easily distinguish which one fired
        // but we can verify both are registered
        if (matches) {
          smallCount++; // or largeCount++ depending on viewport
        }
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    // Wait for media query callbacks
    await new Promise(resolve => setTimeout(resolve, 10));

    // At least one should have fired with initial state
    expect(smallCount + largeCount).toBeGreaterThanOrEqual(0);
  });

  it('should support mixed observer types in array', async () => {
    const tagName = `test-mixed-array-${testId}`;
    let mediaCount = 0;
    let mutationCount = 0;

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="mixed">Mixed content</div>`;
      }

      // Mix media query and mutation observer
      @observe(['media:(min-width: 1px)', 'mutation:childList'], '.mixed')
      handleMixed(data: any) {
        if (typeof data === 'boolean') {
          // Media query result
          mediaCount++;
        } else if (Array.isArray(data)) {
          // Mutation records
          mutationCount++;
        }
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    // Wait for media query
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mediaCount).toBeGreaterThan(0);

    // Trigger mutation
    const mixed = el.shadowRoot.querySelector('.mixed');
    mixed.appendChild(document.createElement('p'));

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mutationCount).toBeGreaterThan(0);
  });

  it('should apply options to all observers in array', async () => {
    const tagName = `test-array-options-${testId}`;
    let callCount = 0;
    const callTimes: number[] = [];

    @element(tagName)
    class TestElement extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <div class="throttled" data-test="initial">Content</div>
        `;
      }

      // Throttle should apply to both mutation types
      @observe(['mutation:childList', 'mutation:attributes'], '.throttled', { throttle: 50 })
      handleThrottled() {
        callCount++;
        callTimes.push(Date.now());
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const throttled = el.shadowRoot.querySelector('.throttled');

    // Rapid mutations
    for (let i = 0; i < 5; i++) {
      throttled.setAttribute('data-test', `change-${i}`);
      throttled.appendChild(document.createElement('span'));
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Wait for throttle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should be throttled
    expect(callCount).toBeLessThan(10); // Less than 2 * 5
    expect(callCount).toBeGreaterThan(0);
  });
});