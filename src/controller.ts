import { setupEventHandlers, cleanupEventHandlers } from './events';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { IS_CONTROLLER_CLASS, IS_CONTROLLER_INSTANCE, CONTROLLER_KEY, CONTROLLER_NAME_KEY, CONTROLLER_ID, CONTROLLER_OPERATIONS, NATIVE_CONTROLLER, IS_ELEMENT_CLASS, ROUTER_CONTEXT } from './symbols';
import { snice } from './global';

type Maybe<T> = T | null | undefined;

export interface IController<T extends HTMLElement = HTMLElement> {
  element: Maybe<T>;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}

export type ControllerClass<T extends HTMLElement = HTMLElement> = new() => IController<T>;

// Controller-scoped cleanup registry
class ControllerScope {
  private cleanupFns: Map<string, Function> = new Map();
  private pendingOperations: Set<Promise<void>> = new Set();
  
  register(key: string, cleanup: Function): void {
    this.cleanupFns.set(key, cleanup);
  }
  
  unregister(key: string): void {
    this.cleanupFns.delete(key);
  }
  
  async cleanup(): Promise<void> {
    // Wait for all pending operations
    await Promise.all(this.pendingOperations);
    
    // Run all cleanup functions
    for (const cleanup of this.cleanupFns.values()) {
      try {
        await cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    this.cleanupFns.clear();
  }
  
  async runOperation<T>(operation: () => Promise<T>): Promise<T> {
    const promise = operation();
    const voidPromise = promise.then(() => {}, () => {});
    this.pendingOperations.add(voidPromise);
    
    try {
      const result = await promise;
      this.pendingOperations.delete(voidPromise);
      return result;
    } catch (error) {
      this.pendingOperations.delete(voidPromise);
      throw error;
    }
  }
}

/**
 * Decorator to register a controller class with a name
 * @param name The name to register the controller under
 */
export function controller(name: string) {
  return function <T extends ControllerClass>(constructor: T) {
    snice.controllerRegistry.set(name, constructor);
    // Mark as controller class for channel decorator detection
    (constructor.prototype as any)[IS_CONTROLLER_CLASS] = true;
    return constructor;
  };
}

/**
 * Attaches a controller to an element
 * @param element The element to attach the controller to
 * @param controllerName The name of the controller to attach
 */
export async function attachController(element: HTMLElement, controllerName: string): Promise<void> {
  const existingController = (element as any)[CONTROLLER_KEY] as IController | undefined;
  const existingName = (element as any)[CONTROLLER_NAME_KEY] as string | undefined;
  
  // For native elements, check if this is actually the desired controller
  const nativeController = (element as any)[NATIVE_CONTROLLER];
  if (nativeController !== undefined && nativeController !== controllerName) {
    // This attachment is outdated, skip it
    return;
  }
  
  if (existingName === controllerName && existingController) {
    // Already attached and controller exists
    return;
  }
  
  // If there's an existing controller, detach it first
  if (existingController) {
    await detachController(element);
  }
  
  const ControllerClass = snice.controllerRegistry.get(controllerName);
  if (!ControllerClass) {
    throw new Error(`Controller "${controllerName}" not found in registry`);
  }
  
  // Create controller instance with unique ID and scope
  const controllerInstance = new ControllerClass();
  snice.controllerIdCounter += 1;
  const controllerId = snice.controllerIdCounter;
  const scope = new ControllerScope();
  
  // Mark this as a controller instance
  (controllerInstance as any)[IS_CONTROLLER_INSTANCE] = true;
  (controllerInstance as any)[CONTROLLER_ID] = controllerId;
  controllerInstance.element = element;
  
  // Pass router context from element to controller if it exists
  const routerContext = (element as any)[ROUTER_CONTEXT];
  if (routerContext !== undefined) {
    (controllerInstance as any)[ROUTER_CONTEXT] = routerContext;
  }
  
  // Store references
  (element as any)[CONTROLLER_KEY] = controllerInstance;
  (element as any)[CONTROLLER_NAME_KEY] = controllerName;
  (element as any)[CONTROLLER_OPERATIONS] = scope;
  
  // Wait for element to be ready (required)
  await (element as any).ready;
  
  // Run attach in the controller's scope
  await scope.runOperation(async () => {
    await controllerInstance.attach(element);
  });
  
  // Setup @on event handlers for controller
  setupEventHandlers(controllerInstance, element);
  
  // Setup @observe observers for controller
  setupObservers(controllerInstance, element);
  
  // Setup @channel handlers for controller
  setupResponseHandlers(controllerInstance, element);
  
  element.dispatchEvent(new CustomEvent('controller.attached', {
    detail: { name: controllerName, controller: controllerInstance }
  }));
}

/**
 * Detaches a controller from an element
 * @param element The element to detach the controller from
 */
export async function detachController(element: HTMLElement): Promise<void> {
  const controllerInstance = (element as any)[CONTROLLER_KEY] as IController | undefined;
  const controllerName = (element as any)[CONTROLLER_NAME_KEY] as string | undefined;
  const scope = (element as any)[CONTROLLER_OPERATIONS] as ControllerScope | undefined;
  
  if (!controllerInstance) {
    return;
  }
  
  // Run detach in the controller's scope
  if (scope) {
    await scope.runOperation(async () => {
      await controllerInstance.detach(element);
    });
  } else {
    await controllerInstance.detach(element);
  }
  
  controllerInstance.element = null;
  
  // Cleanup @on event handlers for controller
  cleanupEventHandlers(controllerInstance);
  
  // Cleanup @observe observers for controller
  cleanupObservers(controllerInstance);
  
  // Cleanup @channel handlers for controller
  cleanupResponseHandlers(controllerInstance);
  
  // Cleanup the controller scope
  if (scope) {
    await scope.cleanup();
  }
  
  // Clean up router context reference
  delete (controllerInstance as any)[ROUTER_CONTEXT];
  
  delete (element as any)[CONTROLLER_KEY];
  delete (element as any)[CONTROLLER_NAME_KEY];
  delete (element as any)[CONTROLLER_OPERATIONS];
  
  element.dispatchEvent(new CustomEvent('controller.detached', {
    detail: { name: controllerName, controller: controllerInstance }
  }));
}

/**
 * Gets the controller instance attached to an element
 * @param element The element to get the controller from
 * @returns The controller instance or undefined
 */
export function getController<T extends IController = IController>(element: HTMLElement): T | undefined {
  return (element as any)[CONTROLLER_KEY] as T | undefined;
}

/**
 * Gets the controller scope for an element
 * @param element The element to get the scope from
 * @returns The controller scope or undefined
 */
export function getControllerScope(element: HTMLElement): ControllerScope | undefined {
  return (element as any)[CONTROLLER_OPERATIONS] as ControllerScope | undefined;
}

/**
 * Enable controller support for native HTML elements
 * This sets up a MutationObserver to watch for controller attributes
 * on non-custom elements (elements without hyphens in their tag names)
 */
export function useNativeElementControllers() {
  // Return if already initialized
  if ((globalThis as any).sniceNativeControllersInitialized) {
    return;
  }
  (globalThis as any).sniceNativeControllersInitialized = true;

  // Process elements that already have controller attribute
  function processElement(element: Element) {
    if (!(element instanceof HTMLElement)) return;
    
    // Skip custom elements (they handle controllers themselves)
    if (element.tagName.includes('-')) return;
    
    // Skip elements that are @element decorated (they have their own controller handling)
    if ((element as any)[IS_ELEMENT_CLASS]) return;
    
    const controllerName = element.getAttribute('controller');
    const currentControllerName = (element as any)[NATIVE_CONTROLLER];
    
    if (controllerName && controllerName !== currentControllerName) {
      // Controller added or changed
      (element as any)[NATIVE_CONTROLLER] = controllerName;
      
      // For non-custom elements, we need to add the ready promise
      if (!(element as any).ready) {
        (element as any).ready = Promise.resolve();
      }
      
      // Detach old controller if exists (don't await - let it run async)
      if (currentControllerName) {
        detachController(element as HTMLElement).catch(error => {
          console.error(`Failed to detach old controller from native element:`, error);
        });
      }
      
      // Attach the new controller
      attachController(element as HTMLElement, controllerName).catch(error => {
        console.error(`Failed to attach controller "${controllerName}" to native element:`, error);
      });
    } else if (!controllerName && currentControllerName) {
      // Controller was removed
      delete (element as any)[NATIVE_CONTROLLER];
      // Clear the controller name immediately to allow re-attachment
      delete (element as any)[CONTROLLER_NAME_KEY];
      detachController(element as HTMLElement).catch(error => {
        console.error(`Failed to detach controller from native element:`, error);
      });
    }
  }

  // Set up MutationObserver to watch for controller attributes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'controller') {
        processElement(mutation.target as Element);
      } else if (mutation.type === 'childList') {
        // Process added nodes
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            // Process the node itself
            processElement(node);
            // Process all descendants with controller attribute
            node.querySelectorAll('[controller]:not([class*="-"])').forEach(processElement);
          }
        });
      }
    }
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Process existing elements (excluding custom elements)
      document.querySelectorAll('[controller]:not([class*="-"])').forEach(processElement);
      
      // Start observing
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['controller'],
        childList: true,
        subtree: true
      });
    });
  } else {
    // DOM already loaded
    document.querySelectorAll('[controller]:not([class*="-"])').forEach(processElement);
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['controller'],
      childList: true,
      subtree: true
    });
  }

  // Store observer reference for cleanup if needed
  (globalThis as any).sniceNativeControllerObserver = observer;
}

/**
 * Stop watching for native element controllers
 */
export function cleanupNativeElementControllers() {
  const observer = (globalThis as any).sniceNativeControllerObserver;
  if (observer) {
    observer.disconnect();
    delete (globalThis as any).sniceNativeControllerObserver;
    delete (globalThis as any).sniceNativeControllersInitialized;
  }
}

/**
 * Registers a cleanup function for the current controller
 * @param controller The controller instance
 * @param key A unique key for this cleanup function
 * @param cleanup The cleanup function to register
 */
export function registerControllerCleanup(controller: IController, key: string, cleanup: Function): void {
  if (!controller.element) return;
  
  const scope = getControllerScope(controller.element as HTMLElement);
  if (scope) {
    scope.register(key, cleanup);
  }
}