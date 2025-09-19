import { CHANNEL_HANDLERS, CLEANUP, IS_CONTROLLER_INSTANCE } from './symbols';
import { RequestOptions } from './types/RequestOptions';
import { RespondOptions } from './types/RespondOptions';

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

    return async function (this: any, ...args: any[]) {
      const actualRequest = async () => {
        // @request always acts as requester (client side)
        const responseTimeout = options?.timeout ?? 120000; // Default 2 minute timeout
        const discoveryTimeout = options?.discoveryTimeout ?? 50; // Default 50ms discovery timeout
        
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
      const discoveryPromise = new Promise<void>((resolve, reject) => {
        discoveryResolve = resolve;
        discoveryReject = reject;
        discoveryTimeoutId = setTimeout(() => {
          reject(new Error(`Request "${requestName}" timed out after ${discoveryTimeout}ms - no handler found`));
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
      
      // Check if this is a controller instance using the symbol
      const isController = this[IS_CONTROLLER_INSTANCE] === true;
      const dispatcher = isController && this.element ? this.element : this;
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
        // Send error to generator
        try {
          await generator.throw(error);
        } catch (generatorError) {
          throw generatorError;
        }
      }
      }; // Close actualRequest function
      
      // Apply debounce or throttle if specified
      if (options?.debounce) {
        return new Promise((resolve, reject) => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(async () => {
            try {
              const result = await actualRequest();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, options.debounce);
        });
      }
      
      if (options?.throttle) {
        const now = Date.now();
        const remaining = options.throttle - (now - throttleLastCall);
        
        if (remaining <= 0) {
          clearTimeout(throttleTimeout);
          throttleLastCall = now;
          return actualRequest();
        } else if (!throttleTimeout) {
          return new Promise((resolve, reject) => {
            throttleTimeout = setTimeout(async () => {
              throttleLastCall = Date.now();
              throttleTimeout = null;
              try {
                const result = await actualRequest();
                resolve(result);
              } catch (error) {
                reject(error);
              }
            }, remaining);
          });
        }
        
        // If throttled and timeout already exists, return empty promise
        return Promise.resolve();
      }
      
      // No timing applied, execute immediately
      return actualRequest();
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

      // Store response metadata on the prototype
      // This will be picked up by setupResponseHandlers
      if (!constructor.prototype[CHANNEL_HANDLERS]) {
        constructor.prototype[CHANNEL_HANDLERS] = [];
      }

      constructor.prototype[CHANNEL_HANDLERS].push({
        channelName: requestName,
        methodName: propertyKey,
        method: target,
        options: options
      });
    });
  };
}

// Helper to setup response handlers for elements and controllers
export function setupResponseHandlers(instance: any, element: HTMLElement) {
  const handlers = instance.constructor.prototype[CHANNEL_HANDLERS];
  if (!handlers) return;
  
  // Store cleanup functions
  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [] };
  }
  
  for (const handler of handlers) {
    const boundMethod = handler.method.bind(instance);
    const eventName = `@request/${handler.channelName}`;
    
    // Create timing variables for debounce/throttle per handler
    let debounceTimeout: any;
    let throttleLastCall = 0;
    let throttleTimeout: any;
    
    // Create wrapped method with timing if needed
    const createTimedMethod = (originalMethod: Function) => {
      if (handler.options?.debounce) {
        return (...args: any[]) => {
          return new Promise((resolve, reject) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
              try {
                const result = await originalMethod(...args);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            }, handler.options.debounce);
          });
        };
      }
      
      if (handler.options?.throttle) {
        return (...args: any[]) => {
          const now = Date.now();
          const remaining = handler.options.throttle! - (now - throttleLastCall);
          
          if (remaining <= 0) {
            clearTimeout(throttleTimeout);
            throttleLastCall = now;
            return originalMethod(...args);
          } else if (!throttleTimeout) {
            return new Promise((resolve, reject) => {
              throttleTimeout = setTimeout(async () => {
                throttleLastCall = Date.now();
                throttleTimeout = null;
                try {
                  const result = await originalMethod(...args);
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              }, remaining);
            });
          }
          
          // If throttled and timeout already exists, return cached/empty response
          return Promise.resolve(undefined);
        };
      }
      
      return originalMethod;
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
      Promise.resolve(timedMethod(payload))
        .then(result => {
          data.resolve(result);
        })
        .catch(error => {
          data.reject(error);
          console.error(`Error in response handler ${handler.methodName}:`, error);
        });
    };
    
    element.addEventListener(eventName, responseHandler as EventListener);
    
    instance[CLEANUP].channels.push(() => {
      element.removeEventListener(eventName, responseHandler as EventListener);
    });
  }
}

// Helper to cleanup response handlers
export function cleanupResponseHandlers(instance: any) {
  if (instance[CLEANUP]?.channels) {
    for (const cleanup of instance[CLEANUP].channels) {
      cleanup();
    }
    instance[CLEANUP].channels = [];
  }
}

