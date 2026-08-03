import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { setupEventHandlers, cleanupEventHandlers } from './on';
import { IS_CONTROLLER_CLASS, IS_CONTROLLER_INSTANCE, CONTROLLER, CONTROLLER_KEY, CONTROLLER_NAME_KEY, CONTROLLER_ID, CONTROLLER_OPERATIONS, NATIVE_CONTROLLER, CONTROLLER_REGISTRY_NAME, DIRECT_CONTROLLER, CONTROLLER_ATTRIBUTE_SYNC, IS_ELEMENT_CLASS, ROUTER_CONTEXT, CONTROLLER_ABORT, CONTROLLER_ATTACHED } from './symbols';
import { snice } from './global';
import { IController, ControllerClass } from './types/i-controller';




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
  return function <T extends ControllerClass>(constructor: T, _context: ClassDecoratorContext) {
    // Access globalThis.snice directly to ensure consistency
    const registry = (globalThis as any).snice?.controllerRegistry;
    if (!registry) {
      throw new Error('Snice global registry not initialized');
    }
    registry.set(name, constructor);
    // Mark as controller class for channel decorator detection
    (constructor.prototype as any)[IS_CONTROLLER_CLASS] = true;
    // Preserve the registry name on the class. Direct class attachments still
    // skip registry lookup; this is only their inspectable DOM label.
    Object.defineProperty(constructor, CONTROLLER_REGISTRY_NAME, {
      value: name,
      configurable: true
    });

    const pending = snice.pendingControllerAttachments.get(name);
    if (pending) {
      snice.pendingControllerAttachments.delete(name);
      queueMicrotask(() => {
        for (const element of pending) {
          const nativeName = (element as any)[NATIVE_CONTROLLER];
          const desiredName = nativeName === undefined
            ? (element as any)[CONTROLLER]
            : nativeName;
          if (desiredName !== name) continue;

          attachController(element, name).catch(error => {
            if (error?.name !== 'ControllerAttachAborted') {
              console.error(`Failed to attach controller "${name}":`, error);
            }
          });
        }
      });
    }
    return constructor;
  };
}

/** Queue an element until its controller module finishes registering. */
export function deferControllerAttachment(element: HTMLElement, controllerName: string): void {
  // Registration can win the microtask race between attachController's
  // rejected promise and this recovery path. Retry immediately in that case.
  if (snice.controllerRegistry.has(controllerName)) {
    queueMicrotask(() => {
      const nativeName = (element as any)[NATIVE_CONTROLLER];
      const desiredName = nativeName === undefined
        ? (element as any)[CONTROLLER]
        : nativeName;
      if (desiredName !== controllerName) return;

      attachController(element, controllerName).catch(error => {
        if (error?.name !== 'ControllerAttachAborted') {
          console.error(`Failed to attach controller "${controllerName}":`, error);
        }
      });
    });
    return;
  }

  let pending = snice.pendingControllerAttachments.get(controllerName);
  if (!pending) {
    pending = new Set();
    snice.pendingControllerAttachments.set(controllerName, pending);
  }
  pending.add(element);

  // Give synchronously evaluated and microtask-delayed controller modules a
  // chance to register, while keeping genuinely missing controllers loud.
  queueMicrotask(() => {
    if (snice.pendingControllerAttachments.get(controllerName)?.has(element)) {
      console.error(
        `Failed to attach controller "${controllerName}":`,
        new Error(`Controller "${controllerName}" not found in registry`)
      );
    }
  });
}

/**
 * True when the value is a controller class that went through @controller().
 * The decorator is required — it registers the class, marks it, and flushes
 * pending attachments. Direct class binding only changes the attach side.
 */
export function isControllerClass(value: unknown): value is ControllerClass {
  return typeof value === 'function'
    && (value as any).prototype?.[IS_CONTROLLER_CLASS] === true;
}

/** Human-readable label for a controller reference (registry name or class). */
function controllerLabel(controller: string | ControllerClass): string {
  return typeof controller === 'string'
    ? controller
    : (controller?.name || '(anonymous controller class)');
}

/** Registry/decorator name used for a direct class attachment's DOM marker. */
function directControllerAttributeName(controllerClass: ControllerClass): string {
  const registeredName = Object.prototype.hasOwnProperty.call(controllerClass, CONTROLLER_REGISTRY_NAME)
    ? (controllerClass as any)[CONTROLLER_REGISTRY_NAME]
    : undefined;
  return typeof registeredName === 'string'
    ? registeredName
    : controllerLabel(controllerClass);
}

/**
 * Write the inspectable controller marker without feeding it back into the
 * custom-element attribute channel. Native MutationObservers are asynchronous
 * and are excluded independently by DIRECT_CONTROLLER.
 */
function writeControllerAttribute(element: HTMLElement, value: string | null): void {
  if (value === null) {
    if (!element.hasAttribute('controller')) return;
  } else if (element.getAttribute('controller') === value) {
    return;
  }

  (element as any)[CONTROLLER_ATTRIBUTE_SYNC] = true;
  try {
    if (value === null) element.removeAttribute('controller');
    else element.setAttribute('controller', value);
  } finally {
    delete (element as any)[CONTROLLER_ATTRIBUTE_SYNC];
  }
}

/**
 * Restore the diagnostic attribute for an attached class controller. Returns
 * true when the direct class channel owns the element.
 */
export function restoreDirectControllerAttribute(element: HTMLElement): boolean {
  if (!(element as any)[DIRECT_CONTROLLER]) return false;
  const source = (element as any)[CONTROLLER_NAME_KEY] as string | ControllerClass | undefined;
  if (typeof source !== 'function') return false;
  writeControllerAttribute(element, directControllerAttributeName(source));
  return true;
}

/**
 * Attaches a controller to an element
 * @param element The element to attach the controller to
 * @param controller The registry name of the controller, or the decorated
 *                   controller class itself (classes skip the registry)
 */
export async function attachController(element: HTMLElement, controller: string | ControllerClass): Promise<void> {
  if (typeof controller !== 'string') {
    if (typeof controller !== 'function') {
      throw new Error(
        'attachController: expected a controller name or a controller class, ' +
        `got ${typeof controller}. Controller instances are not supported — pass the class itself.`
      );
    }
    if (!isControllerClass(controller)) {
      throw new Error(
        `Controller class "${controllerLabel(controller)}" must be decorated with ` +
        `@controller('name') before it can be attached.`
      );
    }
  }

  const controllerName = controllerLabel(controller);
  const existingController = (element as any)[CONTROLLER_KEY] as IController | undefined;
  const existingSource = (element as any)[CONTROLLER_NAME_KEY] as string | ControllerClass | undefined;

  // For attribute-managed native elements, check if this is actually the
  // desired controller. Class attachments take the element over instead.
  const nativeController = (element as any)[NATIVE_CONTROLLER];
  if (typeof controller === 'string' && nativeController !== undefined && nativeController !== controller) {
    // This attachment is outdated, skip it
    return;
  }

  if (existingSource === controller && existingController) {
    // Already attached and controller exists (name or class reference match)
    if (typeof controller !== 'string') {
      restoreDirectControllerAttribute(element);
    }
    return;
  }

  // If there's an existing controller, detach it first
  if (existingController) {
    await detachController(element);

    // Light-DOM reconciliation can issue commit() and reconnected() requests
    // for the same class while the previous controller is still detaching.
    // If the other request already installed that exact source, this request
    // is redundant. Different sources retain the established rapid-switch
    // behavior and continue through the normal replacement path.
    const replacement = (element as any)[CONTROLLER_KEY] as IController | undefined;
    const replacementSource = (element as any)[CONTROLLER_NAME_KEY] as string | ControllerClass | undefined;
    if (replacement && replacementSource === controller) {
      if (typeof controller !== 'string') restoreDirectControllerAttribute(element);
      return;
    }
  }

  let ControllerClass: ControllerClass;
  if (typeof controller === 'string') {
    // Access globalThis.snice directly to ensure consistency
    const registry = (globalThis as any).snice?.controllerRegistry;
    if (!registry) {
      throw new Error('Snice global registry not initialized');
    }

    ControllerClass = registry.get(controller);
    if (!ControllerClass) {
      throw new Error(`Controller "${controller}" not found in registry`);
    }
  } else {
    ControllerClass = controller;
  }

  // Create controller instance with unique ID and scope
  const controllerInstance = new ControllerClass();
  if (typeof controller !== 'string') {
    // Construction succeeded, so the class channel can safely take ownership.
    // Setting this before construction would leave a stale observer guard when
    // a controller constructor throws.
    (element as any)[DIRECT_CONTROLLER] = true;
    delete (element as any)[NATIVE_CONTROLLER];
  }
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
  
  // Store references. CONTROLLER_NAME_KEY holds the attach source — the
  // registry name string, or the class reference itself for class attaches
  // (reference equality is the dedupe key for classes).
  (element as any)[CONTROLLER_KEY] = controllerInstance;
  (element as any)[CONTROLLER_NAME_KEY] = controller;
  (element as any)[CONTROLLER_OPERATIONS] = scope;
  if (typeof controller !== 'string') {
    // The class reference remains the sole attachment authority. This
    // attribute is diagnostic only; custom-element callbacks and native
    // MutationObservers are guarded from treating it as a string attachment.
    restoreDirectControllerAttribute(element);
  }

  // Wait for element to be ready. Race against abort (detachController) and
  // a 30s deadline so a caller that forgets to append the element gets a
  // clear error instead of an unresolvable promise.
  const abort = new AbortController();
  (element as any)[CONTROLLER_ABORT] = abort;
  const ATTACH_DEADLINE_MS = 30_000;

  try {
    await Promise.race([
      (element as any).ready,
      new Promise<never>((_, reject) => {
        const onAbort = () => {
          // Tagged so fire-and-forget call sites can tell this designed
          // teardown path apart from real attach failures and stay quiet.
          const error = new Error(`attachController("${controllerName}"): aborted before element was ready (likely detached or never connected)`);
          error.name = 'ControllerAttachAborted';
          reject(error);
        };
        if (abort.signal.aborted) return onAbort();
        abort.signal.addEventListener('abort', onAbort, { once: true });
        const timerId = setTimeout(() => reject(
          new Error(`attachController("${controllerName}"): element did not become ready within ${ATTACH_DEADLINE_MS}ms (did you forget to appendChild it?)`)
        ), ATTACH_DEADLINE_MS);
        abort.signal.addEventListener('abort', () => clearTimeout(timerId), { once: true });
      }),
    ]);
  } catch (error) {
    // Attach never got past `ready` (aborted or deadline). Roll back the stored
    // references so nothing is left pointing at a controller that never
    // attached — otherwise a later attach short-circuits as "already attached"
    // and a detach would run detach() on it.
    if ((element as any)[CONTROLLER_KEY] === controllerInstance) {
      if (typeof controller !== 'string') {
        writeControllerAttribute(element, null);
      }
      delete (element as any)[CONTROLLER_KEY];
      delete (element as any)[CONTROLLER_NAME_KEY];
      delete (element as any)[CONTROLLER_OPERATIONS];
      if (typeof controller !== 'string') {
        delete (element as any)[DIRECT_CONTROLLER];
      }
    }
    throw error;
  } finally {
    if ((element as any)[CONTROLLER_ABORT] === abort) {
      delete (element as any)[CONTROLLER_ABORT];
    }
  }

  // Past `ready` — mark the controller so detach knows attach was actually run.
  (controllerInstance as any)[CONTROLLER_ATTACHED] = true;

  // Run attach in the controller's scope
  await scope.runOperation(async () => {
    await controllerInstance.attach(element);
  });

  // Setup @observe observers for controller
  setupObservers(controllerInstance, element);

  // Setup @channel handlers for controller
  setupResponseHandlers(controllerInstance, element);

  // Setup @on event handlers for controller
  setupEventHandlers(controllerInstance, element);

  element.dispatchEvent(new CustomEvent('controller-attached', {
    detail: { name: controllerName, controller: controllerInstance }
  }));
}

/**
 * Detaches a controller from an element
 * @param element The element to detach the controller from
 */
export async function detachController(element: HTMLElement): Promise<void> {
  // If attachController is currently awaiting `.ready`, short-circuit that
  // wait so the pending attach rejects immediately instead of hanging.
  const pendingAbort = (element as any)[CONTROLLER_ABORT] as AbortController | undefined;
  if (pendingAbort) pendingAbort.abort();

  const controllerInstance = (element as any)[CONTROLLER_KEY] as IController | undefined;
  const controllerSource = (element as any)[CONTROLLER_NAME_KEY] as string | ControllerClass | undefined;
  const scope = (element as any)[CONTROLLER_OPERATIONS] as ControllerScope | undefined;

  if (!controllerInstance) {
    return;
  }

  // Claim the controller immediately — before any await — so a second detach
  // that overlaps this one (e.g. disconnect's fire-and-forget detach racing a
  // controller reassignment) finds no instance and returns, instead of running
  // detach() a second time on the same controller. The rest of this function
  // works off the locals captured above.
  if (typeof controllerSource === 'function') {
    // Remove the class channel's diagnostic marker while its guards are still
    // active. A queued native MutationObserver therefore sees no attribute and
    // cannot resurrect a registry attachment after detach.
    writeControllerAttribute(element, null);
  }
  delete (element as any)[CONTROLLER_KEY];
  delete (element as any)[CONTROLLER_NAME_KEY];
  delete (element as any)[CONTROLLER_OPERATIONS];
  if (typeof controllerSource === 'function') {
    // Class attach owned the element — release it back to the attribute channel.
    delete (element as any)[DIRECT_CONTROLLER];
  }

  // A controller whose attach() was aborted before it ever ran must not have
  // detach() (or the teardown/event) run on it.
  if (!(controllerInstance as any)[CONTROLLER_ATTACHED]) {
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

  // Cleanup @observe observers for controller
  cleanupObservers(controllerInstance);

  // Cleanup @channel handlers for controller
  cleanupResponseHandlers(controllerInstance);

  // Cleanup @on event handlers for controller
  cleanupEventHandlers(controllerInstance);
  
  // Cleanup the controller scope
  if (scope) {
    await scope.cleanup();
  }
  
  // Clean up router context reference
  delete (controllerInstance as any)[ROUTER_CONTEXT];

  element.dispatchEvent(new CustomEvent('controller-detached', {
    detail: {
      name: controllerSource === undefined ? undefined : controllerLabel(controllerSource),
      controller: controllerInstance
    }
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
    // `tagName` can briefly be null when happy-dom/native mutation observers
    // fire on a node that's been detached mid-callback. Skip cleanly.
    if (!element.tagName || element.tagName.includes('-')) return;
    if ((element as any)[IS_ELEMENT_CLASS]) return;

    // A controller CLASS is attached (template binding or direct
    // attachController(el, Class)). The class channel owns the element:
    // attribute writes must not attach over it, and insertion sweeps must
    // not detach it.
    if ((element as any)[DIRECT_CONTROLLER]) {
      // External writes cannot replace a class binding. Keep the DOM marker
      // honest about the class that is actually attached.
      restoreDirectControllerAttribute(element);
      return;
    }

    const controllerName = element.getAttribute('controller');
    const currentControllerName = (element as any)[NATIVE_CONTROLLER];

    // No change
    if (controllerName === currentControllerName) return;

    // No attribute and never attribute-managed — nothing for this channel to
    // do. Without this guard, every added native element (including ones a
    // class controller was imperatively attached to before insertion) would
    // fall into the removal branch and get spuriously detached.
    if (!controllerName && currentControllerName === undefined) return;

    // Controller removed
    if (!controllerName) {
      delete (element as any)[NATIVE_CONTROLLER];
      delete (element as any)[CONTROLLER_NAME_KEY];
      detachController(element as HTMLElement).catch(error => {
        console.error(`Failed to detach controller from native element:`, error);
      });
      return;
    }

    // Controller added or changed
    (element as any)[NATIVE_CONTROLLER] = controllerName;

    if (!(element as any).ready) {
      (element as any).ready = Promise.resolve();
    }

    if (currentControllerName) {
      detachController(element as HTMLElement).catch(error => {
        console.error(`Failed to detach old controller from native element:`, error);
      });
    }

    attachController(element as HTMLElement, controllerName).catch(error => {
      // Detached before ready — designed teardown, not a failure
      if (error?.name === 'ControllerAttachAborted') {
        console.debug(`Controller "${controllerName}" attach aborted (element detached before ready)`);
        return;
      }
      if (error?.message === `Controller "${controllerName}" not found in registry`) {
        deferControllerAttachment(element as HTMLElement, controllerName);
        return;
      }
      console.error(`Failed to attach controller "${controllerName}" to native element:`, error);
    });
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
            node.querySelectorAll('[controller]').forEach(processElement);
          }
        });
      }
    }
  });

  function startObserving() {
    document.querySelectorAll('[controller]').forEach(processElement);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['controller'],
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
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
