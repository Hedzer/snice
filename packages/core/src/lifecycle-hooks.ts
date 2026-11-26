import { getSniceGlobal } from './global';
import type { ControllerClass } from './types/i-controller';

export interface ControllerBridge {
  attachController: (element: HTMLElement, controller: string | ControllerClass) => Promise<void>;
  detachController: (element: HTMLElement) => Promise<void>;
  deferControllerAttachment: (element: HTMLElement, controllerName: string) => void;
  restoreDirectControllerAttribute: (element: HTMLElement) => boolean;
}

interface LifecycleFeatureHooks {
  setupEventHandlers?: (instance: any, target: EventTarget) => void;
  cleanupEventHandlers?: (instance: any) => void;
  setupResponseHandlers?: (instance: any, target: EventTarget, options?: any) => void;
  cleanupResponseHandlers?: (instance: any) => void;
  setupContextHandler?: (instance: object, catchUp?: false | 'microtask' | 'task') => void | Promise<void>;
  cleanupContextHandler?: (instance: object) => void;
  setupObservers?: (instance: any, element: HTMLElement) => void;
  cleanupObservers?: (instance: any) => void;
  clearDispatchTimers?: (instance: any) => void;
  clearDebounceTimers?: (instance: any) => void;
  clearThrottleTimers?: (instance: any) => void;
}

const hooks: LifecycleFeatureHooks = {};
let controllerBridge: ControllerBridge | null = null;

export function registerEventHooks(
  setup: (instance: any, target: EventTarget) => void,
  cleanup: (instance: any) => void
): void {
  if (!hooks.setupEventHandlers) {
    hooks.setupEventHandlers = setup;
    hooks.cleanupEventHandlers = cleanup;
  }
}

export function registerResponseHooks(
  setup: (instance: any, target: EventTarget, options?: any) => void,
  cleanup: (instance: any) => void
): void {
  if (!hooks.setupResponseHandlers) {
    hooks.setupResponseHandlers = setup;
    hooks.cleanupResponseHandlers = cleanup;
  }
}

export function registerContextHooks(
  setup: (instance: object, catchUp?: false | 'microtask' | 'task') => void | Promise<void>,
  cleanup: (instance: object) => void
): void {
  if (!hooks.setupContextHandler) {
    hooks.setupContextHandler = setup;
    hooks.cleanupContextHandler = cleanup;
  }
}

export function registerObserveHooks(
  setup: (instance: any, element: HTMLElement) => void,
  cleanup: (instance: any) => void
): void {
  if (!hooks.setupObservers) {
    hooks.setupObservers = setup;
    hooks.cleanupObservers = cleanup;
  }
}

export function registerDispatchHook(clear: (instance: any) => void): void {
  if (!hooks.clearDispatchTimers) {
    hooks.clearDispatchTimers = clear;
  }
}

export function registerDebounceHook(clear: (instance: any) => void): void {
  if (!hooks.clearDebounceTimers) {
    hooks.clearDebounceTimers = clear;
  }
}

export function registerThrottleHook(clear: (instance: any) => void): void {
  if (!hooks.clearThrottleTimers) {
    hooks.clearThrottleTimers = clear;
  }
}

export function registerControllerBridge(bridge: ControllerBridge): void {
  if (!controllerBridge) {
    controllerBridge = bridge;
  }
}

export function runSetupEventHandlers(instance: any, target: EventTarget): void {
  hooks.setupEventHandlers?.(instance, target);
}

export function runCleanupEventHandlers(instance: any): void {
  hooks.cleanupEventHandlers?.(instance);
}

export function runSetupResponseHandlers(instance: any, target: EventTarget, options?: any): void {
  hooks.setupResponseHandlers?.(instance, target, options);
}

export function runCleanupResponseHandlers(instance: any): void {
  hooks.cleanupResponseHandlers?.(instance);
}

export function runSetupContextHandler(
  instance: object,
  catchUp?: false | 'microtask' | 'task'
): void | Promise<void> {
  return hooks.setupContextHandler?.(instance, catchUp);
}

export function runCleanupContextHandler(instance: object): void {
  hooks.cleanupContextHandler?.(instance);
}

export function runSetupObservers(instance: any, element: HTMLElement): void {
  hooks.setupObservers?.(instance, element);
}

export function runCleanupObservers(instance: any): void {
  hooks.cleanupObservers?.(instance);
}

export function runClearDispatchTimers(instance: any): void {
  hooks.clearDispatchTimers?.(instance);
}

export function runClearDebounceTimers(instance: any): void {
  hooks.clearDebounceTimers?.(instance);
}

export function runClearThrottleTimers(instance: any): void {
  hooks.clearThrottleTimers?.(instance);
}

/**
 * Queue a string-named controller attachment in the shared global store when
 * the controller module has not registered yet. A later `@controller(name)`
 * flushes the set; if none registers by the next microtask, log the standard
 * missing-controller error.
 */
export function deferPendingControllerAttachment(element: HTMLElement, controllerName: string): void {
  const snice = getSniceGlobal();
  let pending = snice.pendingControllerAttachments.get(controllerName);
  if (!pending) {
    pending = new Set();
    snice.pendingControllerAttachments.set(controllerName, pending);
  }
  pending.add(element);

  queueMicrotask(() => {
    if (getSniceGlobal().pendingControllerAttachments.get(controllerName)?.has(element)) {
      console.error(
        `Failed to attach controller "${controllerName}":`,
        new Error(`Controller "${controllerName}" not found in registry`)
      );
    }
  });
}

export function cancelPendingControllerAttachment(element: HTMLElement, controllerName?: unknown): void {
  const pendingMap = (globalThis as any).snice?.pendingControllerAttachments as
    | Map<string, Set<HTMLElement>>
    | undefined;
  if (!pendingMap) return;
  if (typeof controllerName === 'string') {
    const set = pendingMap.get(controllerName);
    if (set) {
      set.delete(element);
      if (set.size === 0) pendingMap.delete(controllerName);
    }
    return;
  }
  for (const [name, set] of pendingMap) {
    set.delete(element);
    if (set.size === 0) pendingMap.delete(name);
  }
}

export function attachElementController(
  element: HTMLElement,
  value: string | ControllerClass
): void {
  const label = typeof value === 'string' ? value : (value?.name || '(anonymous controller class)');
  if (!controllerBridge) {
    if (typeof value === 'string') {
      deferPendingControllerAttachment(element, value);
      return;
    }
    console.error(
      `Failed to attach controller "${label}":`,
      new Error(`Controller class "${label}" must be decorated with @controller('name') before it can be attached.`)
    );
    return;
  }

  controllerBridge.attachController(element, value).catch((error: any) => {
    if (error?.name === 'ControllerAttachAborted') {
      if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
        console.debug(`Controller "${label}" attach aborted (element detached before ready)`);
      }
      return;
    }
    if (typeof value === 'string' && error?.message === `Controller "${value}" not found in registry`) {
      controllerBridge!.deferControllerAttachment(element, value);
      return;
    }
    console.error(`Failed to attach controller "${label}":`, error);
  });
}

export function attachPendingElementController(
  element: HTMLElement,
  pendingControllerClass: ControllerClass
): void {
  const pendingLabel = pendingControllerClass?.name || '(anonymous controller class)';
  if (!controllerBridge) {
    console.error(
      `Failed to attach controller "${pendingLabel}":`,
      new Error(`Controller class "${pendingLabel}" must be decorated with @controller('name') before it can be attached.`)
    );
    return;
  }

  controllerBridge.attachController(element, pendingControllerClass).catch((error: any) => {
    if (error?.name === 'ControllerAttachAborted') {
      if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
        console.debug(`Controller "${pendingLabel}" attach aborted (element detached before ready)`);
      }
      return;
    }
    console.error(`Failed to attach controller "${pendingLabel}":`, error);
  });
}

export function attachControllerClassViaBridge(
  element: HTMLElement,
  controllerClass: any
): void {
  const label = controllerClass?.name || String(controllerClass);
  if (!controllerBridge) {
    console.error(
      `Failed to attach controller "${label}":`,
      new Error(`Controller class "${label}" must be decorated with @controller('name') before it can be attached.`)
    );
    return;
  }

  controllerBridge.attachController(element, controllerClass).catch((error: any) => {
    if (error?.name === 'ControllerAttachAborted') return;
    console.error(`Failed to attach controller "${label}":`, error);
  });
}

export function detachElementController(element: HTMLElement, previousValue?: unknown): void {
  cancelPendingControllerAttachment(element, previousValue);
  if (!controllerBridge) return;
  controllerBridge.detachController(element).catch((error: any) => {
    console.error('Failed to detach controller:', error);
  });
}

export function restoreDirectControllerAttributeViaBridge(element: HTMLElement): boolean {
  return controllerBridge ? controllerBridge.restoreDirectControllerAttribute(element) : false;
}
