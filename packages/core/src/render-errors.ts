/** Sanitized render attribution. It contains no host, node, constructor, or prototype. */
export interface RenderHostIdentity {
  readonly label: string;
  readonly marker: symbol;
}

const SAFE_TAG = /^[a-z][a-z0-9._-]{0,127}$/;
const SAFE_CLASS = /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
interface RegisteredRenderHostIdentity {
  readonly label: string;
}

// Keys are weak and values are sanitized primitives. The same frozen value is
// recorded for the exact constructor and its exact prototype only after the
// caller has verified successful registration.
const registeredRenderHosts = new WeakMap<object, RegisteredRenderHostIdentity>();

export function registerRenderHostIdentity(constructor: unknown, tagName: string): void {
  try {
    if (typeof constructor !== 'function' || !SAFE_TAG.test(tagName)) return;
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(constructor, 'prototype');
    const prototype = prototypeDescriptor && 'value' in prototypeDescriptor
      ? prototypeDescriptor.value
      : undefined;
    if ((typeof prototype !== 'object' && typeof prototype !== 'function') || prototype === null) return;

    const nameDescriptor = Object.getOwnPropertyDescriptor(constructor, 'name');
    const name = nameDescriptor && 'value' in nameDescriptor && typeof nameDescriptor.value === 'string'
      ? nameDescriptor.value
      : '';
    const className = SAFE_CLASS.test(name) ? name : '';
    const identity = Object.freeze({
      label: className ? `<${tagName}> (${className})` : `<${tagName}>`,
    });
    registeredRenderHosts.set(constructor, identity);
    registeredRenderHosts.set(prototype, identity);
  } catch {
    // Registration diagnostics are best-effort and must not affect the
    // successful custom-elements registration that already occurred.
  }
}

function registeredIdentity(host: HTMLElement): RegisteredRenderHostIdentity | undefined {
  const prototype = Object.getPrototypeOf(host);
  if (!prototype) return undefined;
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
  const constructor = constructorDescriptor && 'value' in constructorDescriptor
    ? constructorDescriptor.value
    : undefined;
  if (typeof constructor !== 'function') return undefined;
  const prototypeIdentity = registeredRenderHosts.get(prototype);
  const constructorIdentity = registeredRenderHosts.get(constructor);
  return prototypeIdentity && prototypeIdentity === constructorIdentity
    ? prototypeIdentity
    : undefined;
}

/** Capture once at the render boundary; failures fall back without masking the render error. */
export function captureRenderHostIdentity(host: HTMLElement): RenderHostIdentity {
  let label = '<element>';
  try {
    const registration = registeredIdentity(host);
    if (registration) label = registration.label;
  } catch {
    // Host/prototype objects can be proxied. Attribution is best-effort
    // and must never replace the original render or template error.
  }
  return Object.freeze({ label, marker: Symbol('render-host-identity') });
}

class ContextualRenderError extends Error {
  readonly #identityMarker: symbol;

  constructor(identity: RenderHostIdentity, message: string, cause: unknown) {
    super(message, { cause });
    this.#identityMarker = identity.marker;
  }

  belongsTo(identity: RenderHostIdentity): boolean {
    return this.#identityMarker === identity.marker;
  }
}

export function contextualizeRenderError(identity: RenderHostIdentity, error: unknown): Error {
  if (error instanceof ContextualRenderError && error.belongsTo(identity)) return error;
  const message = error instanceof Error ? error.message : String(error);
  const contextual = new ContextualRenderError(
    identity,
    `snice: render failed for ${identity.label}: ${message}`,
    error,
  );
  if (error instanceof Error) contextual.name = error.name;
  return contextual;
}
