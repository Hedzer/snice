import { DAEMON_STATE, IS_CONTROLLER_INSTANCE, IS_DAEMON_CLASS, IS_DAEMON_INSTANCE } from './symbols';
import { getContext } from './context-provider';
import type { AppContext } from './types/app-context';

export interface DaemonCommunicationState {
  target: EventTarget;
  bindings: number;
  active: boolean;
}

export function isDaemonInstance(value: unknown): value is object {
  return !!value
    && (typeof value === 'object' || typeof value === 'function')
    && (value as any)[IS_DAEMON_CLASS] === true;
}

export function daemonState(instance: object): DaemonCommunicationState {
  if (!isDaemonInstance(instance)) {
    throw new TypeError('Application contexts may provide only instances of @daemon classes.');
  }

  let state = (instance as any)[DAEMON_STATE] as DaemonCommunicationState | undefined;
  if (!state) {
    state = {
      target: new EventTarget(),
      bindings: 0,
      active: false,
    };
    try {
      Object.defineProperty(instance, DAEMON_STATE, {
        value: state,
        configurable: true,
      });
      Object.defineProperty(instance, IS_DAEMON_INSTANCE, {
        value: true,
        configurable: true,
      });
    } catch {
      throw new TypeError('@daemon instances must remain extensible until they are provided to an app context.');
    }
  }
  return state;
}

export function getDaemonTarget(instance: object): EventTarget {
  return daemonState(instance).target;
}

function sourceLabel(source: unknown): string {
  const value = source as any;
  if (value?.[IS_CONTROLLER_INSTANCE] === true) return 'controller';
  if (isDaemonInstance(value)) return '@daemon instance';
  return 'element';
}

export function requireDaemonTarget(source: unknown, name: string): EventTarget {
  if (typeof name !== 'string' || !name.trim()) {
    throw new TypeError('Daemon addresses must be non-empty strings.');
  }

  const context = getContext<AppContext>(source);
  if (!context) {
    throw new Error(`[snice] ${sourceLabel(source)} cannot resolve daemon "${name}" because no app context is provided.`);
  }

  const instance = context.daemons?.[name];
  if (!instance) {
    throw new Error(`[snice] app context does not provide daemon "${name}".`);
  }
  if (!isDaemonInstance(instance)) {
    throw new TypeError(`[snice] app context entry "${name}" is not an instance of an @daemon class.`);
  }

  const state = daemonState(instance);
  if (!state.active) {
    throw new Error(`[snice] daemon "${name}" is not active because its app context has not been provided.`);
  }
  return state.target;
}

export function defaultCommunicationTarget(instance: any): EventTarget | null {
  if (isDaemonInstance(instance)) {
    return getDaemonTarget(instance);
  }
  if (instance?.[IS_CONTROLLER_INSTANCE] === true) {
    return instance.element && typeof instance.element.dispatchEvent === 'function'
      ? instance.element
      : null;
  }
  if (instance && typeof instance.dispatchEvent === 'function') {
    return instance as EventTarget;
  }
  return null;
}
