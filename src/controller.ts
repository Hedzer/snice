import { setupEventHandlers, cleanupEventHandlers } from './events';
import { setupChannelHandlers, cleanupChannelHandlers } from './channel';
import { IS_CONTROLLER_CLASS, CONTROLLER_KEY, CONTROLLER_NAME_KEY, CONTROLLER_ID, CONTROLLER_OPERATIONS } from './symbols';
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
  
  if (existingName === controllerName) {
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
  
  (controllerInstance as any)[CONTROLLER_ID] = controllerId;
  controllerInstance.element = element;
  
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
  
  // Setup @channel handlers for controller
  setupChannelHandlers(controllerInstance, element);
  
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
  
  // Cleanup @channel handlers for controller
  cleanupChannelHandlers(controllerInstance);
  
  // Cleanup the controller scope
  if (scope) {
    await scope.cleanup();
  }
  
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