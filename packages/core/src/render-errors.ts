import { ELEMENT_CLASS_NAME, ELEMENT_TAG_NAME } from './symbols';

/** Sanitized render attribution. It contains no host, node, constructor, or prototype. */
export interface RenderHostIdentity {
  readonly label: string;
  readonly marker: symbol;
}

const SAFE_TAG = /^[a-z][a-z0-9._-]{0,127}$/;
const SAFE_CLASS = /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const AMBIENT_DOCUMENT = typeof document === 'undefined' ? undefined : document;
const AMBIENT_WINDOW = typeof window === 'undefined' ? undefined : window;
const AMBIENT_REGISTRY = typeof customElements === 'undefined' ? undefined : customElements;
const FUNCTION_TO_STRING = Function.prototype.toString;

function isNativeFunction(value: unknown): value is Function {
  if (typeof value !== 'function') return false;
  try {
    return /\{\s*\[native code\]\s*\}/.test(FUNCTION_TO_STRING.call(value));
  } catch {
    return false;
  }
}

type PlatformInterface = 'node' | 'document' | 'window' | 'registry';

function hasOwnMethod(prototype: object, key: PropertyKey): boolean {
  return typeof Object.getOwnPropertyDescriptor(prototype, key)?.value === 'function';
}

function isPlatformPrototype(prototype: object, kind: PlatformInterface): boolean {
  switch (kind) {
    case 'node':
      return hasOwnMethod(prototype, 'contains') &&
        hasOwnMethod(prototype, 'getRootNode') &&
        hasOwnMethod(prototype, 'cloneNode');
    case 'document':
      return hasOwnMethod(prototype, 'createElement') &&
        hasOwnMethod(prototype, 'adoptNode') &&
        Object.getOwnPropertyDescriptor(prototype, 'implementation') !== undefined;
    case 'window':
      return Object.getOwnPropertyDescriptor(prototype, 'document') !== undefined &&
        Object.getOwnPropertyDescriptor(prototype, 'location') !== undefined &&
        hasOwnMethod(prototype, 'postMessage');
    case 'registry':
      return hasOwnMethod(prototype, 'define') &&
        hasOwnMethod(prototype, 'get') &&
        hasOwnMethod(prototype, 'whenDefined') &&
        hasOwnMethod(prototype, 'upgrade');
  }
}

/**
 * Read data directly from DOM instances or from a structurally identified DOM
 * interface prototype. The realm's terminal Object/Function prototypes and
 * arbitrary user accessors are never candidates.
 */
function trustedPlatformValue(
  object: unknown,
  key: PropertyKey,
  kind: PlatformInterface,
): unknown {
  if ((typeof object !== 'object' && typeof object !== 'function') || object === null) return undefined;
  const own = Object.getOwnPropertyDescriptor(object, key);
  if (own && 'value' in own) return own.value;
  // Window is exposed through an exotic WindowProxy in browsers, where
  // genuine Web IDL descriptors can be own accessors. Accept that shape only
  // after it satisfies the same interface signature as a platform prototype.
  if (isNativeFunction(own?.get) && isPlatformPrototype(object as object, kind)) {
    try {
      return own.get.call(object);
    } catch {
      return undefined;
    }
  }

  let prototype: object | null = Object.getPrototypeOf(object);
  while (prototype) {
    const parent = Object.getPrototypeOf(prototype);
    if (parent === null) break;
    if (isPlatformPrototype(prototype, kind)) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (!descriptor) return undefined;
      if ('value' in descriptor) return descriptor.value;
      try {
        return descriptor.get?.call(object);
      } catch {
        return undefined;
      }
    }
    prototype = parent;
  }
  return undefined;
}

function registeredIdentity(host: HTMLElement): { tag: string; className: string } | null {
  const prototype = Object.getPrototypeOf(host);
  if (!prototype) return null;
  const tagDescriptor = Object.getOwnPropertyDescriptor(prototype, ELEMENT_TAG_NAME);
  const tag = typeof tagDescriptor?.value === 'string' ? tagDescriptor.value : '';
  if (!SAFE_TAG.test(tag)) return null;

  const ownerDocument = trustedPlatformValue(host, 'ownerDocument', 'node');
  const ownerWindow = trustedPlatformValue(ownerDocument, 'defaultView', 'document') ??
    (ownerDocument === AMBIENT_DOCUMENT ? AMBIENT_WINDOW : undefined);
  const ownerRegistry = trustedPlatformValue(ownerWindow, 'customElements', 'window') ??
    (ownerWindow === AMBIENT_WINDOW ? AMBIENT_REGISTRY : undefined);
  const registry = ownerRegistry;
  const get = trustedPlatformValue(registry, 'get', 'registry');
  const constructor = typeof get === 'function' ? get.call(registry, tag) : undefined;
  if (typeof constructor !== 'function') return null;

  const prototypeDescriptor = Object.getOwnPropertyDescriptor(constructor, 'prototype');
  const registeredPrototype = prototypeDescriptor?.value;
  if (registeredPrototype !== prototype) return null;

  const classDescriptor = Object.getOwnPropertyDescriptor(prototype, ELEMENT_CLASS_NAME);
  const className = typeof classDescriptor?.value === 'string' ? classDescriptor.value : '';
  return { tag, className: SAFE_CLASS.test(className) ? className : '' };
}

/** Capture once at the render boundary; failures fall back without masking the render error. */
export function captureRenderHostIdentity(host: HTMLElement): RenderHostIdentity {
  let label = '<element>';
  try {
    const registration = registeredIdentity(host);
    if (registration) {
      label = registration.className
        ? `<${registration.tag}> (${registration.className})`
        : `<${registration.tag}>`;
    }
  } catch {
    // Host/prototype/registry objects can be proxied. Attribution is best-effort
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
