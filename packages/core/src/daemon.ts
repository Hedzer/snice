import {
  runCleanupEventHandlers,
  runCleanupResponseHandlers,
  runClearDispatchTimers,
  runSetupEventHandlers,
  runSetupResponseHandlers
} from './lifecycle-hooks';
import { IS_DAEMON_CLASS } from './symbols';
import { daemonState, isDaemonInstance } from './daemon-target';

/**
 * Marks an ordinary class as a Snice daemon.
 *
 * The decorator never constructs or globally registers the class. Application
 * code owns every instance and exposes selected instances through an explicit
 * app context.
 */
export function daemon<T extends abstract new (...args: any[]) => object>(
  constructor: T,
  _context: ClassDecoratorContext<T>,
): void {
  Object.defineProperty(constructor.prototype, IS_DAEMON_CLASS, {
    value: true,
    configurable: true,
  });
}

/** @internal Activates framework-managed communication for a provided daemon. */
export function bindDaemon(instance: object): () => void {
  if (!isDaemonInstance(instance)) {
    throw new TypeError('Application contexts may provide only instances of @daemon classes.');
  }

  const state = daemonState(instance);
  if (state.bindings === 0) {
    state.active = true;
    try {
      runSetupEventHandlers(instance, state.target);
      runSetupResponseHandlers(instance, state.target);
    } catch (error) {
      runCleanupResponseHandlers(instance);
      runCleanupEventHandlers(instance);
      state.active = false;
      throw error;
    }
  }
  state.bindings += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;

    state.bindings = Math.max(0, state.bindings - 1);
    if (state.bindings !== 0) return;

    runCleanupResponseHandlers(instance);
    runCleanupEventHandlers(instance);
    runClearDispatchTimers(instance);
    state.active = false;

    // Consumers may still hold cleanup records for the old target until their
    // elements disconnect. Rotate the target so released contexts are inert
    // immediately and a later provision starts from a clean event surface.
    state.target = new EventTarget();
  };
}
