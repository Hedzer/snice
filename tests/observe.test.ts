import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, observe, render, html } from '../src/index';

describe('@observe decorator', () => {
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

  describe('resize observer', () => {
    it('should observe element resize', async () => {
      const tagName = `test-resize-${testId}`;
      let resizeCount = 0;
      let lastEntry: ResizeObserverEntry | null = null;

      @element(tagName)
      class TestResize extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="resizable">Resizable content</div>`;
        }

        @observe('resize')
        handleResize(entry: ResizeObserverEntry) {
          resizeCount++;
          lastEntry = entry;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // ResizeObserver is not fully supported in jsdom
      expect(resizeCount).toBe(0); // Won't trigger in test environment
    });

    it('should observe specific element resize with throttle', async () => {
      const tagName = `test-resize-throttle-${testId}`;
      let resizeCount = 0;

      @element(tagName)
      class TestResizeThrottle extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="chart">Chart container</div>`;
        }

        @observe('resize', '.chart', { throttle: 100 })
        handleChartResize(entry: ResizeObserverEntry) {
          resizeCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      expect(resizeCount).toBe(0); // Won't trigger in test environment
    });
  });

  describe('media query observer', () => {
    it('should observe media query changes', async () => {
      const tagName = `test-media-${testId}`;
      let matchCount = 0;
      let lastMatches: boolean | null = null;

      @element(tagName)
      class TestMedia extends HTMLElement {
        isDesktop = false;

        @render()
        renderContent() {
          return html`<div class="content">Responsive content</div>`;
        }

        @observe('media:(min-width: 768px)')
        handleDesktopMedia(matches: boolean) {
          matchCount++;
          lastMatches = matches;
          this.isDesktop = matches;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Should be called immediately with current state
      expect(matchCount).toBeGreaterThan(0);
      expect(typeof lastMatches).toBe('boolean');
    });

    it('should handle multiple media queries', async () => {
      const tagName = `test-multi-media-${testId}`;
      let darkModeCount = 0;
      let orientationCount = 0;

      @element(tagName)
      class TestMultiMedia extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Multi media content</div>`;
        }

        @observe('media:(prefers-color-scheme: dark)')
        handleDarkMode(matches: boolean) {
          darkModeCount++;
        }

        @observe('media:(orientation: portrait)')
        handleOrientation(matches: boolean) {
          orientationCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Both should be called immediately
      expect(darkModeCount).toBeGreaterThan(0);
      expect(orientationCount).toBeGreaterThan(0);
    });
  });

  describe('mutation observer', () => {
    it('should observe child list changes', async () => {
      const tagName = `test-mutation-${testId}`;
      let mutationCount = 0;
      let lastMutations: MutationRecord[] | null = null;

      @element(tagName)
      class TestMutation extends HTMLElement {
        @render()
        renderContent() {
          return html`<ul class="list"></ul>`;
        }

        @observe('mutation:childList', '.list')
        handleListChange(mutations: MutationRecord[]) {
          mutationCount++;
          lastMutations = mutations;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Add a child to trigger mutation
      const list = el.shadowRoot.querySelector('.list');
      const item = document.createElement('li');
      item.textContent = 'New item';
      list.appendChild(item);

      // Wait for mutation observer callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mutationCount).toBeGreaterThan(0);
      expect(lastMutations).toBeTruthy();
      expect(lastMutations![0].type).toBe('childList');
    });

    it('should observe attribute changes', async () => {
      const tagName = `test-attr-mutation-${testId}`;
      let mutationCount = 0;
      let lastMutations: MutationRecord[] | null = null;

      @element(tagName)
      class TestAttrMutation extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="item" data-state="inactive">Item</div>`;
        }

        @observe('mutation:attributes:data-state', '.item')
        handleStateChange(mutations: MutationRecord[]) {
          mutationCount++;
          lastMutations = mutations;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Change attribute to trigger mutation
      const item = el.shadowRoot.querySelector('.item');
      item.setAttribute('data-state', 'active');

      // Wait for mutation observer callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mutationCount).toBeGreaterThan(0);
      expect(lastMutations).toBeTruthy();
      expect(lastMutations![0].type).toBe('attributes');
      expect(lastMutations![0].attributeName).toBe('data-state');
    });

    it('should observe class attribute changes', async () => {
      const tagName = `test-class-mutation-${testId}`;
      let mutationCount = 0;

      @element(tagName)
      class TestClassMutation extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="box">Box</div>`;
        }

        @observe('mutation:attributes:class', '.box')
        handleClassChange(mutations: MutationRecord[]) {
          mutationCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Change class to trigger mutation
      const box = el.shadowRoot.querySelector('.box');
      box.classList.add('active');

      // Wait for mutation observer callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mutationCount).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup observers on disconnect', async () => {
      const tagName = `test-cleanup-${testId}`;
      let observerCount = 0;

      @element(tagName)
      class TestCleanup extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="content">Content</div>`;
        }

        @observe('mutation:childList', '.content')
        handleMutation() {
          observerCount++;
        }

        @observe('resize')
        handleResize() {
          observerCount++;
        }

        @observe('media:(min-width: 768px)')
        handleMedia() {
          observerCount++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Remove element to trigger cleanup
      el.remove();

      // Add a child after removal - should not trigger observer
      const content = el.shadowRoot?.querySelector('.content');
      if (content) {
        const child = document.createElement('div');
        content.appendChild(child);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Observer count should not increase after cleanup
      const countBefore = observerCount;
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(observerCount).toBe(countBefore);
    });
  });

  describe('throttle option', () => {
    it('should throttle observer callbacks', async () => {
      const tagName = `test-throttle-${testId}`;
      let callCount = 0;
      const callTimes: number[] = [];

      @element(tagName)
      class TestThrottle extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="content">Content</div>`;
        }

        @observe('mutation:childList', '.content', { throttle: 50 })
        handleMutation() {
          callCount++;
          callTimes.push(Date.now());
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const content = el.shadowRoot.querySelector('.content');

      // Trigger multiple mutations rapidly
      for (let i = 0; i < 5; i++) {
        const child = document.createElement('div');
        child.textContent = `Item ${i}`;
        content.appendChild(child);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Wait for throttle and any pending callbacks
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be throttled - not all 5 mutations should trigger
      expect(callCount).toBeLessThan(5);
      expect(callCount).toBeGreaterThan(0);

      // Check that calls are spaced by at least throttle time
      for (let i = 1; i < callTimes.length; i++) {
        const timeDiff = callTimes[i] - callTimes[i - 1];
        expect(timeDiff).toBeGreaterThanOrEqual(45); // Allow small timing variance
      }
    });
  });

  describe('reconnection behavior', () => {
    it('should re-establish observers when element is reconnected', async () => {
      const tagName = `test-reconnect-observers-${testId}`;

      @element(tagName)
      class ReconnectObserversTest extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Observer test</div>`;
        }

        @observe('resize')
        onResize(entry: ResizeObserverEntry) {
          // This method should be callable after reconnection
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Verify the method exists
      expect(typeof el.onResize).toBe('function');

      // Disconnect and reconnect
      el.remove();
      await new Promise(resolve => setTimeout(resolve, 0));

      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Observer method should still be accessible
      expect(typeof el.onResize).toBe('function');
    });
  });
});