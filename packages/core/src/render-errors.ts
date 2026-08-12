import { ELEMENT_CLASS_NAME, ELEMENT_TAG_NAME } from './symbols';

/** Sanitized render attribution. It contains no host, node, constructor, or prototype. */
export interface RenderHostIdentity {
  readonly label: string;
  readonly marker: symbol;
}

const SAFE_TAG = /^[a-z][a-z0-9._-]{0,127}$/;
const SAFE_CLASS = /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;

function registeredIdentity(host: HTMLElement): { tag: string; className: string } | null {
  const prototype = Object.getPrototypeOf(host);
  if (!prototype) return null;
  const tagDescriptor = Object.getOwnPropertyDescriptor(prototype, ELEMENT_TAG_NAME);
  const tag = typeof tagDescriptor?.value === 'string' ? tagDescriptor.value : '';
  if (!SAFE_TAG.test(tag)) return null;

  const registry = globalThis.customElements;
  const constructor = registry?.get(tag);
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
