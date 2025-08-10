import { setupEventHandlers, cleanupEventHandlers } from './events';

type Maybe<T> = T | null | undefined;

export interface IController<T extends HTMLElement = HTMLElement> {
  element: Maybe<T>;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}

export type ControllerClass<T extends HTMLElement = HTMLElement> = new() => IController<T>;

const CONTROLLER_REGISTRY = new Map<string, ControllerClass>();
const CONTROLLER_KEY = Symbol('controller');
const CONTROLLER_NAME_KEY = Symbol('controller-name');

/**
 * Decorator to register a controller class with a name
 * @param name The name to register the controller under
 */
export function controller(name: string) {
  return function <T extends ControllerClass>(constructor: T) {
    CONTROLLER_REGISTRY.set(name, constructor);
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
  
  if (existingController) {
    await detachController(element);
  }
  
  const ControllerClass = CONTROLLER_REGISTRY.get(controllerName);
  if (!ControllerClass) {
    throw new Error(`Controller "${controllerName}" not found in registry`);
  }
  
  const controllerInstance = new ControllerClass();
  controllerInstance.element = element;
  
  await controllerInstance.attach(element);
  
  // Setup @on event handlers for controller
  setupEventHandlers(controllerInstance, element);
  
  (element as any)[CONTROLLER_KEY] = controllerInstance;
  (element as any)[CONTROLLER_NAME_KEY] = controllerName;
  
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
  
  if (!controllerInstance) {
    return;
  }
  
  await controllerInstance.detach(element);
  controllerInstance.element = null;
  
  // Cleanup @on event handlers for controller
  cleanupEventHandlers(controllerInstance);
  
  delete (element as any)[CONTROLLER_KEY];
  delete (element as any)[CONTROLLER_NAME_KEY];
  
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