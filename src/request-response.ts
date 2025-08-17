import { CHANNEL_HANDLERS, CLEANUP, IS_CONTROLLER_INSTANCE } from './symbols';

export interface RequestOptions extends EventInit {
  /**
   * Timeout for waiting for responses (in ms)
   */
  timeout?: number;
}

/**
 * Decorator for making requests from elements or controllers.
 * Uses async generator pattern for bidirectional communication.
 * 
 * @param requestName The name of the request
 * @param options Optional configuration
 */
export function request(requestName: string, options?: RequestOptions) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (this: any, ...args: any[]) {
      // @request always acts as requester (client side)
      const timeout = options?.timeout ?? 100; // Default 100ms timeout
      
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
      
      // Create timeout promise and expose resolve/reject
      let timeoutResolve: () => void;
      let timeoutReject: (reason?: any) => void;
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<void>((resolve, reject) => {
        timeoutResolve = resolve;
        timeoutReject = reject;
        timeoutId = setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });
      
      // Dispatch event with promises
      const eventName = `@request/${requestName}`;
      const event = new CustomEvent(eventName, {
        bubbles: options?.bubbles !== undefined ? options.bubbles : true,
        cancelable: options?.cancelable || false,
        composed: true, // Allow crossing shadow DOM boundaries
        detail: {
          payload,
          timeout: {
            resolve: () => {
              clearTimeout(timeoutId);
              timeoutResolve();
            },
            reject: timeoutReject!
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
        // Wait for timeout to be resolved or rejected
        await timeoutPromise;
        // If we get here, responder responded in time
        const response = await dataPromise;
        
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
    };
    
    return descriptor;
  };
}

/**
 * Decorator for responding to requests in elements or controllers.
 * 
 * @param requestName The name of the request to respond to
 */
export function response(requestName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Store response metadata on the prototype
    // This will be picked up by setupResponseHandlers
    if (!target[CHANNEL_HANDLERS]) {
      target[CHANNEL_HANDLERS] = [];
    }
    
    target[CHANNEL_HANDLERS].push({
      channelName: requestName,
      methodName: propertyKey,
      method: originalMethod
    });
    
    return descriptor;
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
    
    // Setup response handler
    const responseHandler = (event: CustomEvent) => {
      // Extract promises and payload
      const { data, timeout, payload } = event.detail;
      
      // Prevent other responders from responding
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      
      // Call the responder method and handle the result
      Promise.resolve(boundMethod(payload))
        .then(result => {
          // Clear the timeout and resolve the data promise
          timeout.resolve();
          data.resolve(result);
        })
        .catch(error => {
          // Clear timeout and reject the data promise on error
          timeout.resolve();
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

