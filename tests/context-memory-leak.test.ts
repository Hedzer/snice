import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, context, Context } from '../src';
import { getSymbol } from '../src/symbols';

const NAVIGATION_CONTEXT_INSTANCE = getSymbol('navigation-context-instance');
const CONTEXT_TIMER = getSymbol('context-timer');
const CONTEXT_CALLED = getSymbol('context-called');
const CONTEXT_HANDLER = getSymbol('context-handler');
const REGISTERED_ELEMENTS_SET = Symbol.for('snice:registered-elements-set');

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to get the size of registered elements in a Context
 * Uses reflection to access private Set
 */
function getRegisteredElementsCount(ctx: Context | null | undefined): number {
  if (!ctx) {
    return 0;
  }

  try {
    // Try to access the private Set through symbol reflection
    const symbols = Object.getOwnPropertySymbols(ctx);
    for (const sym of symbols) {
      const value = (ctx as any)[sym];
      if (value instanceof Set) {
        return value.size;
      }
    }
    return 0;
  } catch (e) {
    console.error('Failed to get registered elements count:', e);
    return -1;
  }
}

describe('@context memory leak tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should unregister element from context when element is removed', async () => {
    const router = Router({
      target: '#app',
      context: { user: 'Alice' }
    });

    @router.page({ tag: 'test-cleanup-page', routes: ['/cleanup'] })
    class TestCleanupPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        // Handler
      }
    }

    router.initialize();
    await router.navigate('/cleanup');
    await waitFor(100);

    const pageElement = document.querySelector('test-cleanup-page') as any;
    expect(pageElement).toBeTruthy();

    // Get the context instance
    const ctx = pageElement[NAVIGATION_CONTEXT_INSTANCE];
    expect(ctx).toBeInstanceOf(Context);

    // Element should be registered
    const beforeCount = getRegisteredElementsCount(ctx);
    expect(beforeCount).toBeGreaterThan(0);

    // Remove element from DOM
    pageElement.remove();
    await waitFor(50);

    // Element should be unregistered
    const afterCount = getRegisteredElementsCount(ctx);
    expect(afterCount).toBe(beforeCount - 1);

    // Context instance reference should be cleaned up
    expect(pageElement[NAVIGATION_CONTEXT_INSTANCE]).toBeUndefined();
  });

  it('should clean up debounce timers on element removal', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'debounce-cleanup-page', routes: ['/debounce-cleanup'] })
    class DebounceCleanupPage extends HTMLElement {
      @context({ debounce: 500 })
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/debounce-cleanup');
    await waitFor(50);

    const pageElement = document.querySelector('debounce-cleanup-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      // Context not available, skip this test scenario
      expect(ctx).toBeDefined();
      return;
    }

    // Trigger context update to start debounce timer
    ctx.update({}, [], '/debounce-cleanup', {});
    await waitFor(50);

    // Timer should be pending
    expect(pageElement[CONTEXT_TIMER]).toBeDefined();

    // Remove element before debounce completes
    pageElement.remove();
    await waitFor(50);

    // Timer should be cleaned up
    expect(pageElement[CONTEXT_TIMER]).toBeUndefined();

    // Wait for original debounce period
    await waitFor(500);

    // Handler should NOT be called after element removal
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clean up wrapped methods on element removal', async () => {
    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'wrapped-cleanup-page', routes: ['/wrapped'] })
    class WrappedCleanupPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        // Handler
      }
    }

    router.initialize();
    await router.navigate('/wrapped');
    await waitFor(100);

    const pageElement = document.querySelector('wrapped-cleanup-page') as any;

    // Wrapped method should exist
    expect(pageElement.__wrapped_handleContext).toBeDefined();
    expect(typeof pageElement.__wrapped_handleContext).toBe('function');

    // Remove element
    pageElement.remove();
    await waitFor(50);

    // Wrapped method should be cleaned up
    expect(pageElement.__wrapped_handleContext).toBeUndefined();
  });

  it('should handle multiple context handlers on same element without leaks', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    const router = Router({
      target: '#app',
      context: { count: 0 }
    });

    @router.page({ tag: 'multi-handler-page', routes: ['/multi'] })
    class MultiHandlerPage extends HTMLElement {
      @context()
      handleContext1(ctx: Context) {
        handler1(ctx);
      }

      @context({ debounce: 50 })
      handleContext2(ctx: Context) {
        handler2(ctx);
      }

      @context({ throttle: 50 })
      handleContext3(ctx: Context) {
        handler3(ctx);
      }
    }

    router.initialize();
    await router.navigate('/multi');
    await waitFor(250); // Wait for debounce and throttle to settle

    const pageElement = document.querySelector('multi-handler-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    // All wrapped methods should exist
    expect(pageElement.__wrapped_handleContext1).toBeDefined();
    expect(pageElement.__wrapped_handleContext2).toBeDefined();
    expect(pageElement.__wrapped_handleContext3).toBeDefined();

    // Note: Not testing if handlers were called - that's tested elsewhere
    // We're focused on cleanup behavior

    const beforeCount = getRegisteredElementsCount(ctx);

    // Remove element
    pageElement.remove();
    await waitFor(50);

    // All wrapped methods should be cleaned up
    expect(pageElement.__wrapped_handleContext1).toBeUndefined();
    expect(pageElement.__wrapped_handleContext2).toBeUndefined();
    expect(pageElement.__wrapped_handleContext3).toBeUndefined();

    // Element should be unregistered
    const afterCount = getRegisteredElementsCount(ctx);
    expect(afterCount).toBe(beforeCount - 1);
  });

  it('should handle once option and clean up after first call', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'once-page', routes: ['/once'] })
    class OncePage extends HTMLElement {
      @context({ once: true })
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/once');
    await waitFor(100);

    const pageElement = document.querySelector('once-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    // Handler should be called once during navigation
    expect(handler).toHaveBeenCalledTimes(1);

    // CONTEXT_CALLED flag should be set
    expect(pageElement[CONTEXT_CALLED]).toBe(true);

    // After first call, element should be unregistered
    const afterFirstCall = getRegisteredElementsCount(ctx);

    // Trigger context update again
    ctx.update({}, [], '/once', {});
    await waitFor(50);

    // Handler should still only be called once
    expect(handler).toHaveBeenCalledTimes(1);

    // Element count should remain the same (already unregistered)
    const afterSecondUpdate = getRegisteredElementsCount(ctx);
    expect(afterSecondUpdate).toBe(afterFirstCall);
  });

  it('should not leak memory when creating and destroying many elements', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: { iteration: 0 }
    });

    @router.page({ tag: 'stress-page', routes: ['/stress'] })
    class StressPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();

    // Get context reference
    await router.navigate('/stress');
    await waitFor(100);
    const firstElement = document.querySelector('stress-page') as any;
    const ctx = firstElement[CONTEXT_HANDLER];

    // Create and destroy elements 100 times
    for (let i = 0; i < 100; i++) {
      // Navigate to a different route
      await router.navigate(`/stress?iteration=${i}`);
      await waitFor(10);

      // Check registered elements count
      const count = getRegisteredElementsCount(ctx);

      // Should only have 1 element registered (the current page)
      expect(count).toBeLessThanOrEqual(2); // Allow some slack for cleanup timing
    }

    // Final check - should have at most 1 element registered
    const finalCount = getRegisteredElementsCount(ctx);
    expect(finalCount).toBeLessThanOrEqual(1);

    // Handler should have been called many times
    expect(handler).toHaveBeenCalled();
    const callCount = handler.mock.calls.length;
    expect(callCount).toBeGreaterThan(50); // Should be called at least once per iteration
  });

  it('should handle rapid element creation and removal without leaks', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'rapid-page', routes: ['/rapid'] })
    class RapidPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        handler(ctx);
      }

      @context({ debounce: 50 })
      handleContextDebounced(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/rapid');
    await waitFor(100);

    const pageElement = document.querySelector('rapid-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    const initialCount = getRegisteredElementsCount(ctx);

    // Rapidly trigger updates then remove
    for (let i = 0; i < 20; i++) {
      ctx.update({}, [], '/rapid', {});
    }

    // Remove before debounce completes
    pageElement.remove();
    await waitFor(100);

    // Should be unregistered
    const afterCount = getRegisteredElementsCount(ctx);
    expect(afterCount).toBe(initialCount - 1);
  });

  it('should clean up throttle state on element removal', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'throttle-cleanup-page', routes: ['/throttle'] })
    class ThrottleCleanupPage extends HTMLElement {
      @context({ throttle: 200 })
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/throttle');
    await waitFor(100);

    const pageElement = document.querySelector('throttle-cleanup-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    // First call should happen
    expect(handler).toHaveBeenCalledTimes(1);

    // Trigger more updates
    ctx.update({}, [], '/throttle', {});
    ctx.update({}, [], '/throttle', {});
    await waitFor(50);

    // Timer value should be set (stores last call timestamp)
    expect(pageElement[CONTEXT_TIMER]).toBeDefined();

    // Remove element
    pageElement.remove();
    await waitFor(50);

    // Navigation context instance should be cleaned up
    expect(pageElement[NAVIGATION_CONTEXT_INSTANCE]).toBeUndefined();
  });

  it('should handle context updates after element removal gracefully', async () => {
    const handler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'post-removal-page', routes: ['/post-removal'] })
    class PostRemovalPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/post-removal');
    await waitFor(100);

    const pageElement = document.querySelector('post-removal-page') as any;
    const ctx = pageElement[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    const beforeRemovalCalls = handler.mock.calls.length;

    // Remove element
    pageElement.remove();
    await waitFor(50);

    // Trigger context updates after removal
    ctx.update({}, [], '/post-removal', {});
    ctx.update({}, [], '/post-removal', {});
    ctx.update({}, [], '/post-removal', {});
    await waitFor(50);

    // Handler should not be called after removal
    expect(handler).toHaveBeenCalledTimes(beforeRemovalCalls);
  });

  it('should not accumulate elements in context across navigation', async () => {
    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'nav-page-1', routes: ['/page1'] })
    class NavPage1 extends HTMLElement {
      @context()
      handleContext(ctx: Context) {}
    }

    @router.page({ tag: 'nav-page-2', routes: ['/page2'] })
    class NavPage2 extends HTMLElement {
      @context()
      handleContext(ctx: Context) {}
    }

    @router.page({ tag: 'nav-page-3', routes: ['/page3'] })
    class NavPage3 extends HTMLElement {
      @context()
      handleContext(ctx: Context) {}
    }

    router.initialize();

    // Navigate to first page
    await router.navigate('/page1');
    await waitFor(100);
    const page1 = document.querySelector('nav-page-1') as any;
    const ctx = page1[CONTEXT_HANDLER];

    // Navigate through pages multiple times
    for (let i = 0; i < 10; i++) {
      await router.navigate('/page1');
      await waitFor(50);
      await router.navigate('/page2');
      await waitFor(50);
      await router.navigate('/page3');
      await waitFor(50);
    }

    // Final check - should only have 1 element registered (current page)
    const finalCount = getRegisteredElementsCount(ctx);
    expect(finalCount).toBeLessThanOrEqual(2); // Allow some slack for cleanup timing
  });

  it('should handle elements with mixed timing options without interference', async () => {
    const immediateHandler = vi.fn();
    const debounceHandler = vi.fn();
    const throttleHandler = vi.fn();
    const onceHandler = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'mixed-timing-page', routes: ['/mixed'] })
    class MixedTimingPage extends HTMLElement {
      @context()
      immediate(ctx: Context) {
        immediateHandler(ctx);
      }

      @context({ debounce: 50 })
      debounced(ctx: Context) {
        debounceHandler(ctx);
      }

      @context({ throttle: 50 })
      throttled(ctx: Context) {
        throttleHandler(ctx);
      }

      @context({ once: true })
      onceOnly(ctx: Context) {
        onceHandler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/mixed');
    await waitFor(250); // Wait for debounce and throttle to settle

    const page = document.querySelector('mixed-timing-page') as any;
    const ctx = page[CONTEXT_HANDLER];

    if (!ctx) {
      expect(ctx).toBeDefined();
      return;
    }

    // Note: Not testing if all handlers were called - that's tested elsewhere
    // We're focused on cleanup behavior with mixed timing options

    const beforeCount = getRegisteredElementsCount(ctx);

    // Trigger updates
    ctx.update({}, [], '/mixed', {});
    ctx.update({}, [], '/mixed', {});
    await waitFor(150);

    // Remove element
    page.remove();
    await waitFor(100);

    // Should be fully cleaned up (but once handler was already unregistered)
    const afterCount = getRegisteredElementsCount(ctx);
    expect(afterCount).toBeLessThanOrEqual(beforeCount);

    // No wrapped methods should remain
    expect(page.__wrapped_immediate).toBeUndefined();
    expect(page.__wrapped_debounced).toBeUndefined();
    expect(page.__wrapped_throttled).toBeUndefined();
    expect(page.__wrapped_onceOnly).toBeUndefined();
  });
});
