import { CHANNEL_HANDLERS, CLEANUP, RESPOND_METHODS } from './symbols';
import { RequestOptions } from './types/request-options';
import { RespondOptions } from './types/respond-options';
import { defaultCommunicationTarget, requireDaemonTarget } from './daemon-target';

/**
 * Return type for methods decorated with `@request`.
 *
 * TypeScript cannot express a method decorator changing an async generator
 * into a promise-returning method. This pragmatic helper suppresses that
 * mismatch while documenting the response value for readers and tooling.
 */
export type Response<T = any> = T | any;

// @request decorator transforms methods to return Promise<T>


/**
 * Decorator for making requests from elements or controllers.
 * Uses async generator pattern for bidirectional communication.
 * 
 * @param requestName The name of the request
 * @param options Optional configuration
 */
export function request<T = any>(requestName: string, options?: RequestOptions) {
  return function (originalMethod: any, _context: ClassMethodDecoratorContext): (...args: any[]) => Promise<T> {
    // Create timing variables for debounce/throttle
    let debounceTimeout: any;
    let throttleLastCall = 0;
    let throttleTimeout: any;
    const throttleTrailingResolvers: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

    return async function (this: any, ...args: any[]) {
      const actualRequest = async () => {
        // @request always acts as requester (client side)
        const responseTimeout = options?.timeout ?? 120000; // Default 2 minute timeout
        const discoveryTimeout = options?.discoveryTimeout ?? 50; // Default 50ms discovery timeout

        // Resolve before creating timeout promises. A missing daemon/context
        // should reject immediately without leaving an orphaned discovery
        // timer behind.
        const dispatcher = options?.daemon !== undefined
          ? requireDaemonTarget(this, options.daemon)
          : defaultCommunicationTarget(this);
        if (!dispatcher) {
          throw new TypeError(
            `@request('${requestName}') requires an element, attached controller, or provided @daemon instance.`
          );
        }
        
        // Create the generator
      const generator = originalMethod.apply(this, args);
      
      // Get the first yield (the request payload)
      const { value: payload, done } = await generator.next();
      
      if (done) {
        // Generator returned without yielding
        return payload;
      }
      
      // Create data promise and expose resolve/reject
      let dataResolve: (value: any) => void;
      let dataReject: (reason?: any) => void;
      const dataPromise = new Promise((resolve, reject) => {
        dataResolve = resolve;
        dataReject = reject;
      });
      
      // Create discovery timeout promise and expose resolve/reject
      let discoveryResolve: () => void;
      let discoveryReject: (reason?: any) => void;
      let discoveryTimeoutId: NodeJS.Timeout;
      let discovered = false;
      const discoveryPromise = new Promise<void>((resolve, reject) => {
        discoveryResolve = resolve;
        discoveryReject = reject;
        discoveryTimeoutId = setTimeout(() => {
          reject(new Error(
            `Request "${requestName}" found no @respond('${requestName}') handler within ${discoveryTimeout}ms — ` +
            `attach a responding controller/element, or pass { optional: true } to resolve undefined when unhandled.`
          ));
        }, discoveryTimeout);
      });
      
      // Dispatch event with promises
      const eventName = `@request/${requestName}`;
      const event = new CustomEvent(eventName, {
        bubbles: options?.bubbles !== undefined ? options.bubbles : true,
        cancelable: options?.cancelable || false,
        composed: true, // Allow crossing shadow DOM boundaries
        detail: {
          payload,
          discovery: {
            resolve: () => {
              discovered = true;
              clearTimeout(discoveryTimeoutId);
              discoveryResolve();
            },
            reject: discoveryReject!
          },
          data: {
            resolve: dataResolve!,
            reject: dataReject!
          }
        }
      });
      
      dispatcher.dispatchEvent(event);
      
      try {
        // Wait for discovery timeout to be cleared (handler found) or discovery timeout to reject (no handler)
        await discoveryPromise;
        
        // If we get here, a handler was found and discovery timeout was cleared
        // Now wait for the actual data response with the full response timeout
        const responseTimeoutId = setTimeout(() => {
          dataReject!(new Error(`Request "${requestName}" timed out after ${responseTimeout}ms`));
        }, responseTimeout);
        
        const response = await dataPromise;
        clearTimeout(responseTimeoutId);
        
        // Send response back to generator and get final return value
        const { value: finalValue } = await generator.next(response);
        return finalValue;
      } catch (error) {
        // optional: an unhandled request isn't an error — resume the generator
        // with undefined so `const data = await (yield payload)` sees no data.
        // A response TIMEOUT (handler exists but is slow) still throws.
        if (options?.optional && !discovered) {
          const { value: finalValue } = await generator.next(undefined);
          return finalValue;
        }

        // Drive the generator's own catch block and return whatever it recovers
        // with (e.g. a cached fallback). If the generator re-throws instead,
        // generator.throw rejects and the error propagates to the caller.
        const { value: recovered } = await generator.throw(error);
        return recovered;
      }
      }; // Close actualRequest function
      
      // Debounce
      if (options?.debounce) {
        return new Promise((resolve, reject) => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(async () => {
            try { resolve(await actualRequest()); }
            catch (error) { reject(error); }
          }, options.debounce);
        });
      }

      // No throttle — execute immediately
      if (!options?.throttle) return actualRequest();

      // Throttle: time elapsed — invoke now
      const now = Date.now();
      const remaining = options.throttle - (now - throttleLastCall);

      if (remaining <= 0) {
        // Cancelling the scheduled trailing call must not orphan the promises
        // queued for it — settle them with this fresh result. Also reset
        // throttleTimeout so later within-window calls don't attach to a dead
        // timer and hang.
        clearTimeout(throttleTimeout);
        throttleTimeout = null;
        throttleLastCall = now;
        const orphaned = throttleTrailingResolvers.splice(0);
        const p = actualRequest();
        if (orphaned.length) {
          p.then(
            (r) => { for (const x of orphaned) x.resolve(r); },
            (e) => { for (const x of orphaned) x.reject(e); }
          );
        }
        return p;
      }

      // Throttle: already has pending trailing call — attach to it
      if (throttleTimeout) {
        return new Promise((resolve, reject) => {
          throttleTrailingResolvers.push({ resolve, reject });
        });
      }

      // Throttle: schedule trailing call
      return new Promise((resolve, reject) => {
        throttleTrailingResolvers.push({ resolve, reject });
        throttleTimeout = setTimeout(async () => {
          throttleLastCall = Date.now();
          throttleTimeout = null;
          const resolvers = throttleTrailingResolvers.splice(0);
          try {
            const result = await actualRequest();
            for (const r of resolvers) r.resolve(result);
          } catch (error) {
            for (const r of resolvers) r.reject(error);
          }
        }, remaining);
      });
    };
  };
}


/**
 * Decorator for responding to requests in elements or controllers.
 * 
 * @param requestName The name of the request to respond to
 * @param options Optional configuration
 */
export function respond(requestName: string, options?: RespondOptions) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const propertyKey = context.name as string;
    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      // hasOwnProperty guards so subclasses don't mutate parent state via
      // the prototype chain.
      if (!Object.prototype.hasOwnProperty.call(constructor, RESPOND_METHODS)) {
        constructor[RESPOND_METHODS] = new Set();
      }
      if (constructor[RESPOND_METHODS].has(target)) return;
      constructor[RESPOND_METHODS].add(target);

      if (!Object.prototype.hasOwnProperty.call(constructor, CHANNEL_HANDLERS)) {
        const inherited = constructor[CHANNEL_HANDLERS];
        constructor[CHANNEL_HANDLERS] = inherited ? [...inherited] : [];
      }

      constructor[CHANNEL_HANDLERS].push({
        channelName: requestName,
        methodName: propertyKey,
        method: target,
        options: options
      });
    });
  };
}

export interface SetupResponseHandlerOptions {
  /**
   * Runs on every incoming request and must settle before the responder method
   * is invoked. Controllers use it to accept requests that arrive while their
   * host is still becoming ready: discovery resolves at once, the answer
   * follows as soon as the controller is attached.
   */
  claim?: () => Promise<void>;
  /**
   * Keep a `@respond({ daemon })` handler unregistered — and silent — when its
   * daemon is not resolvable yet, instead of warning and dropping it. A caller
   * that registers early (before the host is connected or ready) passes this
   * and calls `setupResponseHandlers` again later; the second call registers
   * whatever was deferred and warns then if it is still unresolvable.
   */
  deferUnresolvableDaemons?: boolean;
}

// Which handler descriptors an instance has already registered, so a second
// setup pass only picks up what the first one deferred.
const registeredHandlers = new WeakMap<object, Set<unknown>>();

/**
 * Helper to setup response handlers for elements and controllers.
 *
 * Safe to call more than once for the same instance: a handler already
 * registered is skipped rather than double-bound.
 */
export function setupResponseHandlers(instance: any, element: EventTarget, options?: SetupResponseHandlerOptions) {
  const handlers = instance.constructor[CHANNEL_HANDLERS];
  if (!handlers) return;

  const claim = options?.claim;
  let registered = registeredHandlers.get(instance);
  if (!registered) {
    registered = new Set();
    registeredHandlers.set(instance, registered);
  }

  // Store cleanup functions
  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [] };
  }
  
  for (const handler of handlers) {
    if (registered.has(handler)) continue;
    const boundMethod = handler.method.bind(instance);
    const eventName = `@request/${handler.channelName}`;
    
    // Create timing variables for debounce/throttle per handler
    let debounceTimeout: any;
    let throttleLastCall = 0;
    let throttleTimeout: any;
    const throttleTrailingResolvers: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];
    let throttleLatestArgs: any[] | null = null;

    // Create wrapped method with timing if needed
    const createTimedMethod = (originalMethod: Function) => {
      if (handler.options?.debounce) {
        return (...args: any[]) => new Promise((resolve, reject) => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(async () => {
            try { resolve(await originalMethod(...args)); }
            catch (error) { reject(error); }
          }, handler.options.debounce);
        });
      }

      if (!handler.options?.throttle) return originalMethod;

      return (...args: any[]) => {
        const now = Date.now();
        const remaining = handler.options.throttle! - (now - throttleLastCall);

        if (remaining <= 0) {
          // Same as the @request side: settle any queued trailing callers with
          // this fresh result rather than orphaning their promises.
          clearTimeout(throttleTimeout);
          throttleTimeout = null;
          throttleLastCall = now;
          const orphaned = throttleTrailingResolvers.splice(0);
          throttleLatestArgs = null;
          const result = originalMethod(...args);
          if (orphaned.length) {
            Promise.resolve(result).then(
              (r) => { for (const x of orphaned) x.resolve(r); },
              (e) => { for (const x of orphaned) x.reject(e); }
            );
          }
          return result;
        }

        // Remember the LATEST args so the trailing call uses fresh input,
        // and queue every suppressed caller's resolver so they all receive
        // the trailing result instead of `undefined`.
        throttleLatestArgs = args;
        return new Promise((resolve, reject) => {
          throttleTrailingResolvers.push({ resolve, reject });
          if (throttleTimeout) return; // already scheduled
          throttleTimeout = setTimeout(async () => {
            throttleLastCall = Date.now();
            throttleTimeout = null;
            const resolvers = throttleTrailingResolvers.splice(0);
            const finalArgs = throttleLatestArgs ?? args;
            throttleLatestArgs = null;
            try {
              const result = await originalMethod(...finalArgs);
              for (const r of resolvers) r.resolve(result);
            } catch (error) {
              for (const r of resolvers) r.reject(error);
            }
          }, remaining);
        });
      };
    };
    
    const timedMethod = createTimedMethod(boundMethod);
    
    // Setup response handler
    const responseHandler = (event: CustomEvent) => {
      // Extract promises and payload
      const { data, discovery, payload } = event.detail;
      
      // Prevent other responders from responding
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      
      // Clear the discovery timeout immediately - we found a handler
      discovery.resolve();
      
      // Call the timed responder method and handle the result
      const answer = claim
        ? Promise.resolve(claim()).then(() => timedMethod(payload))
        : Promise.resolve(timedMethod(payload));

      answer
        .then(result => {
          data.resolve(result);
        })
        .catch(error => {
          data.reject(error);
          console.error(`Error in response handler ${handler.methodName}:`, error);
        });
    };
    
    let responseTarget = element;
    if (handler.options?.daemon !== undefined) {
      try {
        responseTarget = requireDaemonTarget(instance, handler.options.daemon);
      } catch (error) {
        // The app context reaches a controller through its host element, so it
        // can be unreachable while the host is still disconnected. Leave the
        // handler for the later pass instead of dropping it permanently.
        if (options?.deferUnresolvableDaemons) continue;
        console.warn(`[snice/@respond] ${(error as Error).message} Responder "${handler.channelName}" skipped.`);
        registered.add(handler);
        continue;
      }
    }

    registered.add(handler);
    responseTarget.addEventListener(eventName, responseHandler as EventListener);

    instance[CLEANUP].channels.push(() => {
      responseTarget.removeEventListener(eventName, responseHandler as EventListener);
    });
  }
}

// Helper to cleanup response handlers
export function cleanupResponseHandlers(instance: any) {
  registeredHandlers.delete(instance);
  if (instance[CLEANUP]?.channels) {
    for (const cleanup of instance[CLEANUP].channels) {
      cleanup();
    }
    instance[CLEANUP].channels = [];
  }
}
