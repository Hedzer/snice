import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('@render decorator - all option permutations', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // Single options (baseline)

  it('should work with debounce only', async () => {
    @element('test-debounce-only')
    class TestDebounceOnly extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50 })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-only') as TestDebounceOnly;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialRenderCount = el.renderCount;

    // Rapid updates
    el.count = 1;
    el.count = 2;
    el.count = 3;

    // Should not render yet
    expect(el.renderCount).toBe(initialRenderCount);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have rendered once
    expect(el.renderCount).toBe(initialRenderCount + 1);
    expect(el.shadowRoot?.textContent).toBe('3');
  });

  it('should work with throttle only', async () => {
    @element('test-throttle-only')
    class TestThrottleOnly extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ throttle: 100 })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-throttle-only') as TestThrottleOnly;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    el.count = 1;
    await new Promise(resolve => queueMicrotask(resolve));
    const afterFirstUpdate = el.renderCount;

    // Immediate updates should be throttled
    el.count = 2;
    el.count = 3;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(el.renderCount).toBe(afterFirstUpdate);

    // Wait for throttle window
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have rendered the throttled update
    expect(el.renderCount).toBeGreaterThan(afterFirstUpdate);
  });

  it('should work with sync only', async () => {
    @element('test-sync-only')
    class TestSyncOnly extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ sync: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-sync-only') as TestSyncOnly;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    el.count = 1;
    // Sync render should happen immediately, no need to wait
    expect(el.renderCount).toBe(initialRenderCount + 1);

    el.count = 2;
    expect(el.renderCount).toBe(initialRenderCount + 2);
  });

  it('should work with once only', async () => {
    @element('test-once-only')
    class TestOnceOnly extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-once-only') as TestOnceOnly;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.renderCount).toBe(1);

    // Property changes should not trigger re-renders
    el.count = 1;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.renderCount).toBe(1);

    el.count = 2;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.renderCount).toBe(1);
  });

  // Two-option permutations

  it('should work with debounce + throttle', async () => {
    @element('test-debounce-throttle')
    class TestDebounceThrottle extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, throttle: 100 })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-throttle') as TestDebounceThrottle;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    // Rapid updates - debounce should take precedence
    el.count = 1;
    el.count = 2;
    el.count = 3;

    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.renderCount).toBe(initialRenderCount);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBeGreaterThan(initialRenderCount);
  });

  it('should work with debounce + sync', async () => {
    @element('test-debounce-sync')
    class TestDebounceSync extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, sync: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-sync') as TestDebounceSync;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    // Debounce should take precedence over sync
    el.count = 1;
    expect(el.renderCount).toBe(initialRenderCount); // Not immediate

    el.count = 2;
    el.count = 3;

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBe(initialRenderCount + 1);
  });

  it('should work with debounce + once', async () => {
    @element('test-debounce-once')
    class TestDebounceOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-once') as TestDebounceOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(el.renderCount).toBe(1);

    // Once should prevent any re-renders
    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBe(1);
  });

  it('should work with throttle + sync', async () => {
    @element('test-throttle-sync')
    class TestThrottleSync extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ throttle: 100, sync: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-throttle-sync') as TestThrottleSync;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    // Throttle should take precedence over sync
    el.count = 1;
    await new Promise(resolve => queueMicrotask(resolve));
    const afterFirst = el.renderCount;
    expect(afterFirst).toBeGreaterThan(initialRenderCount);

    // Immediate updates should be throttled
    el.count = 2;
    el.count = 3;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.renderCount).toBe(afterFirst);

    // Wait for throttle
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(el.renderCount).toBeGreaterThan(afterFirst);
  });

  it('should work with throttle + once', async () => {
    @element('test-throttle-once')
    class TestThrottleOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ throttle: 100, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-throttle-once') as TestThrottleOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.renderCount).toBe(1);

    // Once should prevent any re-renders
    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(el.renderCount).toBe(1);
  });

  it('should work with sync + once', async () => {
    @element('test-sync-once')
    class TestSyncOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ sync: true, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-sync-once') as TestSyncOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.renderCount).toBe(1);

    // Once should prevent any re-renders
    el.count = 1;
    expect(el.renderCount).toBe(1);

    el.count = 2;
    expect(el.renderCount).toBe(1);
  });

  // Three-option permutations

  it('should work with debounce + throttle + sync', async () => {
    @element('test-debounce-throttle-sync')
    class TestDebounceThrottleSync extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, throttle: 100, sync: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-throttle-sync') as TestDebounceThrottleSync;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    const initialRenderCount = el.renderCount;

    // Debounce should take precedence
    el.count = 1;
    el.count = 2;
    el.count = 3;

    await new Promise(resolve => queueMicrotask(resolve));
    expect(el.renderCount).toBe(initialRenderCount);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBeGreaterThan(initialRenderCount);
  });

  it('should work with debounce + throttle + once', async () => {
    @element('test-debounce-throttle-once')
    class TestDebounceThrottleOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, throttle: 100, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-throttle-once') as TestDebounceThrottleOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(el.renderCount).toBe(1);

    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBe(1);
  });

  it('should work with debounce + sync + once', async () => {
    @element('test-debounce-sync-once')
    class TestDebounceSyncOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, sync: true, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-debounce-sync-once') as TestDebounceSyncOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(el.renderCount).toBe(1);

    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(el.renderCount).toBe(1);
  });

  it('should work with throttle + sync + once', async () => {
    @element('test-throttle-sync-once')
    class TestThrottleSyncOnce extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ throttle: 100, sync: true, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-throttle-sync-once') as TestThrottleSyncOnce;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.renderCount).toBe(1);

    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(el.renderCount).toBe(1);
  });

  // All four options

  it('should work with debounce + throttle + sync + once', async () => {
    @element('test-all-options')
    class TestAllOptions extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50, throttle: 100, sync: true, once: true })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement('test-all-options') as TestAllOptions;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(el.renderCount).toBe(1);

    // Once should prevent all re-renders regardless of other options
    el.count = 1;
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(el.renderCount).toBe(1);
  });

  // Edge cases with nested elements and options

  it('should work with different options on parent and child', async () => {
    @element('nested-child-with-options')
    class NestedChildWithOptions extends HTMLElement {
      @property({ type: Number })
      value = 0;

      renderCount = 0;

      @render({ sync: true })
      renderContent() {
        this.renderCount++;
        return html`<div class="child">${this.value}</div>`;
      }
    }

    @element('nested-parent-with-options')
    class NestedParentWithOptions extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 50 })
      renderContent() {
        this.renderCount++;
        return html`
          <div class="parent">
            <nested-child-with-options .value=${this.count}></nested-child-with-options>
          </div>
        `;
      }
    }

    const el = document.createElement('nested-parent-with-options') as NestedParentWithOptions;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialParentRenderCount = el.renderCount;

    el.count = 1;
    el.count = 2;
    el.count = 3;

    // Parent debounce should delay
    expect(el.renderCount).toBe(initialParentRenderCount);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Parent should have rendered
    expect(el.renderCount).toBe(initialParentRenderCount + 1);

    const child = el.shadowRoot?.querySelector('nested-child-with-options') as any;
    await child?.ready;

    // Child should have sync rendering
    expect(child?.value).toBe(3);
  });

  it('should handle rapid option changes in deeply nested tree', async () => {
    @element('rapid-leaf')
    class RapidLeaf extends HTMLElement {
      @property({ type: Number })
      value = 0;

      renderCount = 0;

      @render({ throttle: 50 })
      renderContent() {
        this.renderCount++;
        return html`<div>${this.value}</div>`;
      }
    }

    @element('rapid-parent')
    class RapidParent extends HTMLElement {
      @property({ type: Number })
      count = 0;

      renderCount = 0;

      @render({ debounce: 30 })
      renderContent() {
        this.renderCount++;
        return html`<rapid-leaf .value=${this.count}></rapid-leaf>`;
      }
    }

    const el = document.createElement('rapid-parent') as RapidParent;
    container.appendChild(el);
    await el.ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    // Rapidly change values
    for (let i = 0; i < 50; i++) {
      el.count = i;
    }

    // Wait for all debounce/throttle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should have rendered but not 50 times
    const child = el.shadowRoot?.querySelector('rapid-leaf') as any;
    await child?.ready;

    expect(child?.value).toBe(49);
    expect(el.renderCount).toBeLessThan(50);
    expect(child?.renderCount).toBeLessThan(50);
  });
});
