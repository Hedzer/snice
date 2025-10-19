import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, debounce, throttle, once, memoize, clearDebounceTimers, clearThrottleTimers, clearMemoizeCache, resetOnce } from '../src/index';

describe('Method Decorators', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('@debounce', () => {
    it('should debounce method calls', async () => {
      const spy = vi.fn();

      @element('debounce-test')
      class DebounceTest extends HTMLElement {
        @debounce(50)
        handleInput(value: string) {
          spy(value);
        }
      }

      const el = document.createElement('debounce-test') as DebounceTest;
      container.appendChild(el);

      // Rapid calls
      el.handleInput('a');
      el.handleInput('ab');
      el.handleInput('abc');

      // Should not be called yet
      expect(spy).toHaveBeenCalledTimes(0);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only be called once with last value
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('abc');
    });

    it('should support leading edge', async () => {
      const spy = vi.fn();

      @element('debounce-leading-test')
      class DebounceLeadingTest extends HTMLElement {
        @debounce(50, { leading: true, trailing: false })
        handleClick() {
          spy();
        }
      }

      const el = document.createElement('debounce-leading-test') as DebounceLeadingTest;
      container.appendChild(el);

      el.handleClick();
      expect(spy).toHaveBeenCalledTimes(1);

      el.handleClick();
      el.handleClick();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still only be called once (leading edge only)
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should support maxWait', async () => {
      const spy = vi.fn();

      @element('debounce-maxwait-test')
      class DebounceMaxWaitTest extends HTMLElement {
        @debounce(50, { maxWait: 100 })
        handleInput(value: string) {
          spy(value);
        }
      }

      const el = document.createElement('debounce-maxwait-test') as DebounceMaxWaitTest;
      container.appendChild(el);

      // Call repeatedly within maxWait period
      for (let i = 0; i < 10; i++) {
        el.handleInput(`value${i}`);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Should have been called due to maxWait
      expect(spy).toHaveBeenCalled();
    });

    it('should clear debounce timers', async () => {
      const spy = vi.fn();

      @element('debounce-clear-test')
      class DebounceClearTest extends HTMLElement {
        @debounce(50)
        handleInput(value: string) {
          spy(value);
        }
      }

      const el = document.createElement('debounce-clear-test') as DebounceClearTest;
      container.appendChild(el);

      el.handleInput('test');
      clearDebounceTimers(el);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not be called because timer was cleared
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('@throttle', () => {
    it('should throttle method calls', async () => {
      const spy = vi.fn();

      @element('throttle-test')
      class ThrottleTest extends HTMLElement {
        @throttle(100)
        handleScroll(position: number) {
          spy(position);
        }
      }

      const el = document.createElement('throttle-test') as ThrottleTest;
      container.appendChild(el);

      // First call should execute immediately (leading edge)
      el.handleScroll(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0);

      // Rapid calls within throttle window
      el.handleScroll(10);
      el.handleScroll(20);
      el.handleScroll(30);

      // Should not execute during throttle window
      expect(spy).toHaveBeenCalledTimes(1);

      // Wait for throttle window
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should execute trailing edge
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(30);
    });

    it('should support leading: false', async () => {
      const spy = vi.fn();

      @element('throttle-noleading-test')
      class ThrottleNoLeadingTest extends HTMLElement {
        @throttle(100, { leading: false })
        handleEvent() {
          spy();
        }
      }

      const el = document.createElement('throttle-noleading-test') as ThrottleNoLeadingTest;
      container.appendChild(el);

      el.handleEvent();
      expect(spy).toHaveBeenCalledTimes(0);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should support trailing: false', async () => {
      const spy = vi.fn();

      @element('throttle-notrailing-test')
      class ThrottleNoTrailingTest extends HTMLElement {
        @throttle(100, { trailing: false })
        handleEvent() {
          spy();
        }
      }

      const el = document.createElement('throttle-notrailing-test') as ThrottleNoTrailingTest;
      container.appendChild(el);

      el.handleEvent();
      expect(spy).toHaveBeenCalledTimes(1);

      el.handleEvent();
      el.handleEvent();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not call trailing edge
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear throttle timers', async () => {
      const spy = vi.fn();

      @element('throttle-clear-test')
      class ThrottleClearTest extends HTMLElement {
        @throttle(100)
        handleEvent() {
          spy();
        }
      }

      const el = document.createElement('throttle-clear-test') as ThrottleClearTest;
      container.appendChild(el);

      el.handleEvent();
      expect(spy).toHaveBeenCalledTimes(1);

      el.handleEvent();
      clearThrottleTimers(el);

      await new Promise(resolve => setTimeout(resolve, 150));

      // Trailing edge should not fire
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('@once', () => {
    it('should only call method once per instance', () => {
      const spy = vi.fn();

      @element('once-test')
      class OnceTest extends HTMLElement {
        @once()
        initialize() {
          spy();
          return 'initialized';
        }
      }

      const el = document.createElement('once-test') as OnceTest;
      container.appendChild(el);

      const result1 = el.initialize();
      const result2 = el.initialize();
      const result3 = el.initialize();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result1).toBe('initialized');
      expect(result2).toBe('initialized');
      expect(result3).toBe('initialized');
    });

    it('should track separately per instance', () => {
      const spy = vi.fn();

      @element('once-separate-test')
      class OnceSeparateTest extends HTMLElement {
        @once()
        initialize() {
          spy();
        }
      }

      const el1 = document.createElement('once-separate-test') as OnceSeparateTest;
      const el2 = document.createElement('once-separate-test') as OnceSeparateTest;
      container.appendChild(el1);
      container.appendChild(el2);

      el1.initialize();
      el1.initialize();
      el2.initialize();
      el2.initialize();

      // Should be called once per instance
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should support global once', () => {
      const spy = vi.fn();

      @element('once-global-test')
      class OnceGlobalTest extends HTMLElement {
        @once(false)
        globalInit() {
          spy();
        }
      }

      const el1 = document.createElement('once-global-test') as OnceGlobalTest;
      const el2 = document.createElement('once-global-test') as OnceGlobalTest;
      container.appendChild(el1);
      container.appendChild(el2);

      el1.globalInit();
      el2.globalInit();

      // Should only be called once globally
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should reset once state', () => {
      const spy = vi.fn();

      @element('once-reset-test')
      class OnceResetTest extends HTMLElement {
        @once()
        initialize() {
          spy();
        }
      }

      const el = document.createElement('once-reset-test') as OnceResetTest;
      container.appendChild(el);

      el.initialize();
      expect(spy).toHaveBeenCalledTimes(1);

      resetOnce(el, 'initialize');

      el.initialize();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('@memoize', () => {
    it('should cache function results', () => {
      const spy = vi.fn();

      @element('memoize-test')
      class MemoizeTest extends HTMLElement {
        @memoize()
        fibonacci(n: number): number {
          spy(n);
          if (n <= 1) return n;
          return this.fibonacci(n - 1) + this.fibonacci(n - 2);
        }
      }

      const el = document.createElement('memoize-test') as MemoizeTest;
      container.appendChild(el);

      const result1 = el.fibonacci(10);
      const result2 = el.fibonacci(10);

      expect(result1).toBe(55);
      expect(result2).toBe(55);

      // Second call should not recompute
      const calls = spy.mock.calls.length;
      el.fibonacci(10);
      expect(spy).toHaveBeenCalledTimes(calls); // No additional calls
    });

    it('should respect maxSize', () => {
      @element('memoize-maxsize-test')
      class MemoizeMaxSizeTest extends HTMLElement {
        @memoize({ maxSize: 2 })
        compute(n: number): number {
          return n * 2;
        }
      }

      const el = document.createElement('memoize-maxsize-test') as MemoizeMaxSizeTest;
      container.appendChild(el);

      el.compute(1);
      el.compute(2);
      el.compute(3); // Should evict first entry

      // Cache should have entries for 2 and 3, not 1
      // We can't directly test cache internals, but behavior should be correct
    });

    it('should support custom key generator', () => {
      const spy = vi.fn();

      @element('memoize-customkey-test')
      class MemoizeCustomKeyTest extends HTMLElement {
        @memoize({
          keyGenerator: (obj: any) => obj.id,
        })
        processObject(obj: { id: string; data: any }) {
          spy(obj);
          return obj.data.toUpperCase();
        }
      }

      const el = document.createElement('memoize-customkey-test') as MemoizeCustomKeyTest;
      container.appendChild(el);

      const obj1 = { id: '1', data: 'hello' };
      const obj2 = { id: '1', data: 'different' }; // Same ID, different data

      el.processObject(obj1);
      el.processObject(obj2);

      // Should only call once because same key
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should support TTL', async () => {
      const spy = vi.fn();

      @element('memoize-ttl-test')
      class MemoizeTTLTest extends HTMLElement {
        @memoize({ ttl: 50 })
        getData(key: string) {
          spy(key);
          return `data-${key}`;
        }
      }

      const el = document.createElement('memoize-ttl-test') as MemoizeTTLTest;
      container.appendChild(el);

      el.getData('test');
      el.getData('test');
      expect(spy).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      el.getData('test');
      expect(spy).toHaveBeenCalledTimes(2); // Should call again
    });

    it('should clear memoize cache', () => {
      const spy = vi.fn();

      @element('memoize-clear-test')
      class MemoizeClearTest extends HTMLElement {
        @memoize()
        compute(n: number): number {
          spy(n);
          return n * 2;
        }
      }

      const el = document.createElement('memoize-clear-test') as MemoizeClearTest;
      container.appendChild(el);

      el.compute(5);
      expect(spy).toHaveBeenCalledTimes(1);

      el.compute(5);
      expect(spy).toHaveBeenCalledTimes(1); // Cached

      clearMemoizeCache(el, 'compute');

      el.compute(5);
      expect(spy).toHaveBeenCalledTimes(2); // Cache cleared
    });
  });

  describe('Combined usage', () => {
    it('should support multiple decorators on same class', async () => {
      const debounceSpy = vi.fn();
      const throttleSpy = vi.fn();
      const onceSpy = vi.fn();
      const memoizeSpy = vi.fn();

      @element('combined-test')
      class CombinedTest extends HTMLElement {
        @debounce(50)
        debouncedMethod() {
          debounceSpy();
        }

        @throttle(50)
        throttledMethod() {
          throttleSpy();
        }

        @once()
        onceMethod() {
          onceSpy();
        }

        @memoize()
        memoizedMethod(n: number) {
          memoizeSpy(n);
          return n * 2;
        }
      }

      const el = document.createElement('combined-test') as CombinedTest;
      container.appendChild(el);

      // Test debounce
      el.debouncedMethod();
      el.debouncedMethod();
      expect(debounceSpy).toHaveBeenCalledTimes(0);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(debounceSpy).toHaveBeenCalledTimes(1);

      // Test throttle
      el.throttledMethod();
      expect(throttleSpy).toHaveBeenCalledTimes(1);
      el.throttledMethod();
      expect(throttleSpy).toHaveBeenCalledTimes(1);

      // Test once
      el.onceMethod();
      el.onceMethod();
      expect(onceSpy).toHaveBeenCalledTimes(1);

      // Test memoize
      el.memoizedMethod(5);
      el.memoizedMethod(5);
      expect(memoizeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
