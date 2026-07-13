import { ELEMENT_OPTIONS, RENDER_ROOT } from './symbols';
import type { ElementOptions } from './types/element-options';

export type SniceRenderRoot = HTMLElement | ShadowRoot;

const renderHosts = new WeakSet<HTMLElement>();
const explicitRenderHosts = new WeakMap<Node, HTMLElement>();

export function getRenderRoot(element: HTMLElement): SniceRenderRoot | null {
  return (element as any)[RENDER_ROOT] || element.shadowRoot || null;
}

export function ensureRenderRoot(element: HTMLElement): SniceRenderRoot {
  const existing = getRenderRoot(element);
  if (existing) return existing;

  const options = (element.constructor as any)[ELEMENT_OPTIONS] as ElementOptions | undefined;
  let root: SniceRenderRoot;

  if (options?.renderRoot === 'light' || options?.shadow === false) {
    root = element;
  } else if (typeof (element as any).createRenderRoot === 'function') {
    root = (element as any).createRenderRoot();
  } else {
    const mode = typeof options?.shadow === 'string' ? options.shadow : 'open';
    root = element.attachShadow({ mode, delegatesFocus: options?.delegatesFocus });
  }

  if (root !== element && !(root instanceof ShadowRoot)) {
    throw new TypeError('snice: createRenderRoot() must return the host element or a ShadowRoot.');
  }
  (element as any)[RENDER_ROOT] = root;
  renderHosts.add(element);
  return root;
}

export function findRenderHost(node: Node): HTMLElement | null {
  const root = node.getRootNode();
  if (root instanceof ShadowRoot) return root.host as HTMLElement;

  let current: Node | null = node;
  while (current) {
    const explicit = explicitRenderHosts.get(current);
    if (explicit) return explicit;
    if (current instanceof HTMLElement && renderHosts.has(current)) return current;
    current = current.parentNode;
  }
  return null;
}

/**
 * Associate wrapper-free DOM moved outside a render root (for example portal
 * content) with the component that owns its template event handlers.
 */
export function setRangeRenderHost(start: Node, end: Node, host: HTMLElement | null): void {
  let node = start.nextSibling;
  while (node && node !== end) {
    if (host) explicitRenderHosts.set(node, host);
    else explicitRenderHosts.delete(node);
    node = node.nextSibling;
  }
}
