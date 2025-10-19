import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('@render decorator - render options', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should debounce renders with debounce option', async () => {
    let renderCount = 0;

    @element('test-debounce')
    class TestDebounce extends HTMLElement {
      @property()
      value = '';

      @render({ debounce: 50 })
      renderContent() {
        renderCount++;
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('test-debounce') as TestDebounce;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Rapid changes
    el.value = 'a';
    el.value = 'ab';
    el.value = 'abc';

    // Should not have rendered yet
    expect(renderCount).toBe(initialRenderCount);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should render once after debounce
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(el.shadowRoot?.textContent).toBe('abc');
  });

  it('should throttle renders with throttle option', async () => {
    let renderCount = 0;

    @element('test-throttle')
    class TestThrottle extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render({ throttle: 50 })
      renderContent() {
        renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-throttle') as TestThrottle;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // First change should render immediately
    el.count = 1;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(renderCount).toBe(initialRenderCount + 1);

    // Rapid changes within throttle window
    el.count = 2;
    el.count = 3;
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should still be at initialRenderCount + 1 (throttled)
    expect(renderCount).toBe(initialRenderCount + 1);

    // Wait for throttle window to pass
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should have rendered again
    expect(renderCount).toBe(initialRenderCount + 2);
    expect(el.shadowRoot?.textContent).toBe('3');
  });

  it('should disable auto-render with once option', async () => {
    @element('test-once')
    class TestOnce extends HTMLElement {
      @property()
      value = 'initial';

      @render({ once: true })
      renderContent() {
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('test-once') as TestOnce;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot?.textContent).toBe('initial');

    // Change property - should NOT auto-render
    el.value = 'changed';
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.textContent).toBe('initial');

    // Manual render by calling the method
    (el as any).renderContent();
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.shadowRoot?.textContent).toBe('changed');
  });

  it('should render synchronously with sync option', async () => {
    let renderCount = 0;

    @element('test-sync')
    class TestSync extends HTMLElement {
      @property()
      value = '';

      @render({ sync: true })
      renderContent() {
        renderCount++;
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('test-sync') as TestSync;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Change multiple properties
    el.value = 'a';
    el.value = 'b';
    el.value = 'c';

    // With sync: true, each change should render immediately (no batching)
    // So we should have 3 renders
    expect(renderCount).toBe(initialRenderCount + 3);
    expect(el.shadowRoot?.textContent).toBe('c');
  });

  it('should batch renders by default (no sync option)', async () => {
    let renderCount = 0;

    @element('test-batching-default')
    class TestBatchingDefault extends HTMLElement {
      @property()
      value1 = '';

      @property()
      value2 = '';

      @render()
      renderContent() {
        renderCount++;
        return html`<div>${this.value1} ${this.value2}</div>`;
      }
    }

    const el = document.createElement('test-batching-default') as TestBatchingDefault;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Change multiple properties
    el.value1 = 'hello';
    el.value2 = 'world';

    // Should not have rendered yet (batched in microtask)
    expect(renderCount).toBe(initialRenderCount);

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Should render once for both changes
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(el.shadowRoot?.textContent).toBe('hello world');
  });

  it('should support combining debounce with once option', async () => {
    let renderCount = 0;

    @element('test-debounce-once')
    class TestDebounceOnce extends HTMLElement {
      @property()
      value = 'initial';

      @render({ debounce: 50, once: true })
      renderContent() {
        renderCount++;
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('test-debounce-once') as TestDebounceOnce;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Property changes should NOT trigger auto-render (once: true)
    el.value = 'changed';
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(renderCount).toBe(initialRenderCount);

    // Manual render should respect debounce
    (el as any).renderContent();
    await new Promise(resolve => queueMicrotask(resolve));

    // Manual renders bypass once option
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  it('should handle rapid property changes with default batching', async () => {
    let renderCount = 0;

    @element('test-rapid-changes')
    class TestRapidChanges extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-rapid-changes') as TestRapidChanges;
    container.appendChild(el);
    await el.ready;

    const initialRenderCount = renderCount;

    // Make 100 rapid changes
    for (let i = 1; i <= 100; i++) {
      el.count = i;
    }

    // Wait for batched render
    await new Promise(resolve => queueMicrotask(resolve));

    // Should only render once despite 100 changes
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(el.shadowRoot?.textContent).toBe('100');
  });
});
