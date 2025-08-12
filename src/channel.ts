import { CHANNEL_HANDLERS, CLEANUP } from './symbols';

export interface ChannelOptions extends EventInit {
  /**
   * Timeout for waiting for responses (in ms)
   */
  timeout?: number;
}

/**
 * Decorator for bidirectional communication channels.
 * On elements: Opens a channel using async generator
 * On controllers: Responds to channel requests
 * 
 * @param channelName The name of the channel
 * @param options Optional configuration
 */
export function channel(channelName: string, options?: ChannelOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // We'll determine at runtime whether this is element or controller
    // by checking if 'this' is an HTMLElement
    descriptor.value = async function (this: any, ...args: any[]) {
      // Runtime check: if 'this' is an HTMLElement, it's element-side
      if (this instanceof HTMLElement) {
        // Element side - handle async generator
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
            reject(new Error(`Channel timeout after ${timeout}ms`));
          }, timeout);
        });
        
        // Dispatch event with promises
        const eventName = `@channel:${channelName}`;
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
        
        this.dispatchEvent(event);
        
        try {
          // Wait for timeout to be resolved or rejected
          await timeoutPromise;
          // If we get here, controller responded in time
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
      } else {
        // Controller side - just call the original method
        // The actual channel setup happens in setupChannelHandlers
        return originalMethod.apply(this, args);
      }
    };
    
    // Store channel metadata on the prototype for controllers
    // This will be picked up by setupChannelHandlers
    if (!target[CHANNEL_HANDLERS]) {
      target[CHANNEL_HANDLERS] = [];
    }
    
    target[CHANNEL_HANDLERS].push({
      channelName,
      methodName: propertyKey,
      method: originalMethod
    });
    
    return descriptor;
  };
}

// Helper to setup channel handlers for controllers
export function setupChannelHandlers(instance: any, element: HTMLElement) {
  const handlers = instance.constructor.prototype[CHANNEL_HANDLERS];
  if (!handlers) return;
  
  // Store cleanup functions
  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [] };
  }
  
  for (const handler of handlers) {
    const boundMethod = handler.method.bind(instance);
    const eventName = `@channel:${handler.channelName}`;
    
    // Setup channel handler
    const channelHandler = (event: CustomEvent) => {
      // Extract promises and payload
      const { data, timeout, payload } = event.detail;
      
      // Prevent other controllers from responding
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      
      // Call the controller method and handle the result
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
          console.error(`Error in channel handler ${handler.methodName}:`, error);
        });
    };
    
    element.addEventListener(eventName, channelHandler as EventListener);
    
    instance[CLEANUP].channels.push(() => {
      element.removeEventListener(eventName, channelHandler as EventListener);
    });
  }
}

// Helper to cleanup channel handlers
export function cleanupChannelHandlers(instance: any) {
  if (instance[CLEANUP]?.channels) {
    for (const cleanup of instance[CLEANUP].channels) {
      cleanup();
    }
    instance[CLEANUP].channels = [];
  }
}