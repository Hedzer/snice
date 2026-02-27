/**
 * Method decorators for common patterns
 * @debounce, @throttle, @once, @memoize
 */

import { getSymbol } from './symbols';

const DEBOUNCE_TIMERS = getSymbol('debounce-timers');
const THROTTLE_TIMERS = getSymbol('throttle-timers');
const ONCE_CALLED = getSymbol('once-called');
const MEMOIZE_CACHE = getSymbol('memoize-cache');

/**
 * @debounce decorator - delays function execution until after wait time has elapsed
 * since the last invocation
 *
 * @param wait - Time to wait in milliseconds (default: 300)
 * @param options - Debounce options
 * @param options.leading - Invoke on the leading edge (default: false)
 * @param options.trailing - Invoke on the trailing edge (default: true)
 * @param options.maxWait - Maximum time to wait before invoking (default: undefined)
 *
 * @example
 * ```typescript
 * @element('search-input')
 * class SearchInput extends HTMLElement {
 *   @debounce(500)
 *   handleSearch(query: string) {
 *     // Only called 500ms after last keystroke
 *     fetch(`/api/search?q=${query}`);
 *   }
 * }
 * ```
 */
export function debounce(
  wait = 300,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
) {
  const { leading = false, trailing = true, maxWait } = options;

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    return function (this: any, ...args: any[]) {
      if (!this[DEBOUNCE_TIMERS]) {
        this[DEBOUNCE_TIMERS] = {};
      }

      const timers = this[DEBOUNCE_TIMERS];
      const timerKey = methodName;

      // Clear existing timer
      if (timers[timerKey]) {
        clearTimeout(timers[timerKey].timeout);
      }

      // Track when debounce started for maxWait
      const now = Date.now();
      const isFirstCall = !timers[timerKey];
      const startTime = isFirstCall ? now : timers[timerKey].startTime;

      // Check if maxWait exceeded
      const shouldInvokeFromMaxWait =
        maxWait !== undefined && now - startTime >= maxWait;

      // Leading edge invocation
      if (leading && isFirstCall) {
        const result = originalMethod.apply(this, args);
        timers[timerKey] = {
          timeout: null,
          startTime,
          lastArgs: args,
        };
        return result;
      }

      // Set new timer for trailing edge
      const timeout = setTimeout(() => {
        if (trailing || shouldInvokeFromMaxWait) {
          originalMethod.apply(this, timers[timerKey].lastArgs);
        }
        delete timers[timerKey];
      }, shouldInvokeFromMaxWait ? 0 : wait);

      timers[timerKey] = {
        timeout,
        startTime,
        lastArgs: args,
      };
    };
  };
}

/**
 * @throttle decorator - ensures function is called at most once per specified time period
 *
 * @param wait - Time to wait in milliseconds (default: 300)
 * @param options - Throttle options
 * @param options.leading - Invoke on the leading edge (default: true)
 * @param options.trailing - Invoke on the trailing edge (default: true)
 *
 * @example
 * ```typescript
 * @element('scroll-tracker')
 * class ScrollTracker extends HTMLElement {
 *   @throttle(100)
 *   handleScroll(e: Event) {
 *     // Called at most once every 100ms
 *     this.updateScrollPosition();
 *   }
 * }
 * ```
 */
export function throttle(
  wait = 300,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
) {
  const { leading = true, trailing = true } = options;

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    return function (this: any, ...args: any[]) {
      if (!this[THROTTLE_TIMERS]) {
        this[THROTTLE_TIMERS] = {};
      }

      const timers = this[THROTTLE_TIMERS];
      const timerKey = methodName;
      const now = Date.now();

      // First call
      if (!timers[timerKey]) {
        if (leading) originalMethod.apply(this, args);

        timers[timerKey] = { lastInvoke: now, timeout: null, lastArgs: args };

        if (trailing && !leading) {
          timers[timerKey].timeout = setTimeout(() => {
            originalMethod.apply(this, timers[timerKey].lastArgs);
            delete timers[timerKey];
          }, wait);
        }
        return;
      }

      // Subsequent calls
      const timeSinceLastInvoke = now - timers[timerKey].lastInvoke;
      timers[timerKey].lastArgs = args;

      if (timers[timerKey].timeout) {
        clearTimeout(timers[timerKey].timeout);
      }

      // Enough time passed — invoke immediately
      if (timeSinceLastInvoke >= wait) {
        originalMethod.apply(this, args);
        timers[timerKey].lastInvoke = now;
        return;
      }

      // Set up trailing call
      if (trailing) {
        const remaining = wait - timeSinceLastInvoke;
        timers[timerKey].timeout = setTimeout(() => {
          originalMethod.apply(this, timers[timerKey].lastArgs);
          timers[timerKey].lastInvoke = Date.now();
          timers[timerKey].timeout = null;
        }, remaining);
      }
    };
  };
}

/**
 * @once decorator - ensures function is only called once
 * Subsequent calls return the result of the first call
 *
 * @param perInstance - If true, function can be called once per instance (default: true)
 *                      If false, function can only be called once globally across all instances
 *
 * @example
 * ```typescript
 * @element('data-loader')
 * class DataLoader extends HTMLElement {
 *   @once()
 *   async loadData() {
 *     // Only loads data once, even if called multiple times
 *     const data = await fetch('/api/data');
 *     return data.json();
 *   }
 * }
 * ```
 */
export function once(perInstance = true) {
  let globalCalled = false;
  let globalResult: any;

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    return function (this: any, ...args: any[]) {
      // Per-instance tracking
      if (perInstance) {
        if (!this[ONCE_CALLED]) this[ONCE_CALLED] = {};

        if (!this[ONCE_CALLED][methodName]) {
          this[ONCE_CALLED][methodName] = {
            called: true,
            result: originalMethod.apply(this, args),
          };
        }

        return this[ONCE_CALLED][methodName].result;
      }

      // Global tracking
      if (!globalCalled) {
        globalCalled = true;
        globalResult = originalMethod.apply(this, args);
      }

      return globalResult;
    };
  };
}

/**
 * @memoize decorator - caches function results based on arguments
 * Uses JSON.stringify for argument comparison by default
 *
 * @param options - Memoization options
 * @param options.keyGenerator - Custom function to generate cache key from arguments
 * @param options.maxSize - Maximum cache size (default: 100)
 * @param options.ttl - Time to live in milliseconds (default: undefined - no expiration)
 *
 * @example
 * ```typescript
 * @element('calculator')
 * class Calculator extends HTMLElement {
 *   @memoize({ maxSize: 50 })
 *   fibonacci(n: number): number {
 *     // Results are cached, subsequent calls with same n are instant
 *     if (n <= 1) return n;
 *     return this.fibonacci(n - 1) + this.fibonacci(n - 2);
 *   }
 * }
 * ```
 */
export function memoize(
  options: {
    keyGenerator?: (...args: any[]) => string;
    maxSize?: number;
    ttl?: number;
  } = {}
) {
  const { keyGenerator = (...args) => JSON.stringify(args), maxSize = 100, ttl } = options;

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    return function (this: any, ...args: any[]) {
      if (!this[MEMOIZE_CACHE]) {
        this[MEMOIZE_CACHE] = {};
      }

      if (!this[MEMOIZE_CACHE][methodName]) {
        this[MEMOIZE_CACHE][methodName] = new Map();
      }

      const cache = this[MEMOIZE_CACHE][methodName];
      const key = keyGenerator(...args);

      // Check if cached
      if (cache.has(key)) {
        const cached = cache.get(key);
        const expired = ttl !== undefined && (Date.now() - cached.timestamp) > ttl;

        if (expired) {
          cache.delete(key);
        } else {
          return cached.value;
        }
      }

      // Compute result
      const result = originalMethod.apply(this, args);

      // Store in cache
      cache.set(key, {
        value: result,
        timestamp: Date.now(),
      });

      // Enforce max size (LRU - delete oldest)
      if (cache.size > maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return result;
    };
  };
}

/**
 * Clear all debounce timers for an instance
 * Useful in cleanup/disconnectedCallback
 */
export function clearDebounceTimers(instance: any): void {
  if (instance[DEBOUNCE_TIMERS]) {
    for (const timerKey in instance[DEBOUNCE_TIMERS]) {
      if (instance[DEBOUNCE_TIMERS][timerKey]?.timeout) {
        clearTimeout(instance[DEBOUNCE_TIMERS][timerKey].timeout);
      }
    }
    instance[DEBOUNCE_TIMERS] = {};
  }
}

/**
 * Clear all throttle timers for an instance
 * Useful in cleanup/disconnectedCallback
 */
export function clearThrottleTimers(instance: any): void {
  if (instance[THROTTLE_TIMERS]) {
    for (const timerKey in instance[THROTTLE_TIMERS]) {
      if (instance[THROTTLE_TIMERS][timerKey]?.timeout) {
        clearTimeout(instance[THROTTLE_TIMERS][timerKey].timeout);
      }
    }
    instance[THROTTLE_TIMERS] = {};
  }
}

/**
 * Clear memoize cache for an instance
 */
export function clearMemoizeCache(instance: any, methodName?: string): void {
  if (instance[MEMOIZE_CACHE]) {
    if (methodName) {
      delete instance[MEMOIZE_CACHE][methodName];
    } else {
      instance[MEMOIZE_CACHE] = {};
    }
  }
}

/**
 * Reset once-called state for an instance
 */
export function resetOnce(instance: any, methodName?: string): void {
  if (instance[ONCE_CALLED]) {
    if (methodName) {
      delete instance[ONCE_CALLED][methodName];
    } else {
      instance[ONCE_CALLED] = {};
    }
  }
}
