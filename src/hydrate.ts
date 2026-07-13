import { TemplateInstance } from './parts';
import { TemplateResult, isTemplateResult } from './template';
import { RENDER_INSTANCE } from './symbols';
import { ensureRenderRoot, SniceRenderRoot } from './render-root';

export interface HydrateOptions {
  /** Behavior when server and client structures differ. Defaults to throw. */
  onMismatch?: 'throw' | 'replace';
}

export class HydrationError extends Error {
  readonly code = 'SNICE_HYDRATION_MISMATCH';

  constructor(message: string, readonly path: string) {
    super(`snice: hydration mismatch at ${path}: ${message}`);
    this.name = 'HydrationError';
  }
}

function isFrameworkStyle(node: Node): boolean {
  return node.nodeType === Node.ELEMENT_NODE &&
    (node as Element).tagName === 'STYLE' &&
    (node as Element).hasAttribute('data-snice-style');
}

function nodeLabel(node: Node | undefined): string {
  if (!node) return 'nothing';
  if (node.nodeType === Node.TEXT_NODE) return 'text';
  if (node.nodeType === Node.COMMENT_NODE) return `comment "${(node as Comment).data}"`;
  if (node.nodeType === Node.ELEMENT_NODE) return `<${(node as Element).localName}>`;
  return node.nodeName.toLowerCase();
}

function syncAttributes(desired: Element, existing: Element): void {
  for (const attribute of Array.from(existing.attributes)) {
    if (!desired.hasAttributeNS(attribute.namespaceURI, attribute.localName)) {
      existing.removeAttributeNS(attribute.namespaceURI, attribute.localName);
    }
  }
  for (const attribute of Array.from(desired.attributes)) {
    if (attribute.namespaceURI) {
      existing.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    } else {
      existing.setAttribute(attribute.name, attribute.value);
    }
  }
}

function mapPair(
  desired: Node,
  existing: Node,
  path: string,
  nodeMap: Map<Node, Node>
): void {
  if (desired.nodeType !== existing.nodeType) {
    throw new HydrationError(`expected ${nodeLabel(desired)}, found ${nodeLabel(existing)}`, path);
  }

  if (desired.nodeType === Node.ELEMENT_NODE) {
    const desiredElement = desired as Element;
    const existingElement = existing as Element;
    if (
      desiredElement.localName !== existingElement.localName ||
      desiredElement.namespaceURI !== existingElement.namespaceURI
    ) {
      throw new HydrationError(`expected ${nodeLabel(desired)}, found ${nodeLabel(existing)}`, path);
    }
  } else if (desired.nodeType === Node.TEXT_NODE) {
    // Text values are reconciled only after the complete structure validates.
  } else if (desired.nodeType === Node.COMMENT_NODE) {
    const expected = (desired as Comment).data;
    const actual = (existing as Comment).data;
    // Boundary comment labels are structural. Authored comments may contain
    // dynamic text, so reconcile other comment data in place.
    const structural = new Set(['', 'if', '/if', 'case', '/case', 'component', '/component', 'transition', '/transition']);
    if (structural.has(expected) && expected !== actual) {
      throw new HydrationError(`expected ${nodeLabel(desired)}, found ${nodeLabel(existing)}`, path);
    }
  }

  nodeMap.set(desired, existing);
  mapChildren(desired, existing, path, nodeMap);
}

function reconcileNodes(nodeMap: ReadonlyMap<Node, Node>): void {
  for (const [desired, existing] of nodeMap) {
    if (desired.nodeType === Node.ELEMENT_NODE) {
      syncAttributes(desired as Element, existing as Element);
    } else if (desired.nodeType === Node.TEXT_NODE) {
      if (existing.nodeValue !== desired.nodeValue) existing.nodeValue = desired.nodeValue;
    } else if (desired.nodeType === Node.COMMENT_NODE) {
      const expected = (desired as Comment).data;
      if ((existing as Comment).data !== expected) (existing as Comment).data = expected;
    }
  }
}

function mapChildren(
  desiredParent: Node,
  existingParent: Node,
  path: string,
  nodeMap: Map<Node, Node>
): void {
  const desired = Array.from(desiredParent.childNodes);
  const existing = Array.from(existingParent.childNodes).filter(node => !isFrameworkStyle(node));
  if (desired.length !== existing.length) {
    throw new HydrationError(
      `expected ${desired.length} child nodes, found ${existing.length}`,
      path
    );
  }
  for (let index = 0; index < desired.length; index++) {
    mapPair(desired[index], existing[index], `${path}/${index}:${nodeLabel(desired[index])}`, nodeMap);
  }
}

function replaceContents(container: ParentNode, fragment: DocumentFragment): void {
  for (const node of Array.from(container.childNodes)) {
    if (!isFrameworkStyle(node)) node.remove();
  }
  container.appendChild(fragment);
}

/**
 * Attach a TemplateInstance to structurally equivalent server DOM.
 * Matching nodes are retained by identity; only values/listeners are updated.
 */
export function hydrate(
  result: TemplateResult,
  container: ParentNode,
  options: HydrateOptions = {}
): TemplateInstance {
  if (!isTemplateResult(result)) throw new TypeError('snice: hydrate() expects an html`` or svg`` template result.');
  if (!container || typeof container.appendChild !== 'function') {
    throw new TypeError('snice: hydrate() expects a DocumentFragment, Element, or ShadowRoot container.');
  }

  const instance = new TemplateInstance(result);
  const fragment = instance.renderFragment();
  try {
    instance.update(result.values);
  } catch (error) {
    instance.clear();
    throw error;
  }
  const nodeMap = new Map<Node, Node>();

  try {
    mapChildren(fragment, container as Node, 'root', nodeMap);
  } catch (error) {
    if (options.onMismatch !== 'replace') {
      instance.clear();
      throw error;
    }
    console.warn(error instanceof Error ? error.message : error);
    replaceContents(container, fragment);
    if ((container as Node).isConnected) instance.reconnected();
    return instance;
  }

  // Attribute/text/comment reconciliation is deliberately a second pass: a
  // later structural mismatch must not leave earlier server nodes half-mutated
  // when the default policy throws.
  reconcileNodes(nodeMap);
  instance.adoptNodes(nodeMap);
  // Retargeted attribute/event/directive parts intentionally reset their
  // commit caches; this pass attaches them to the retained server nodes.
  instance.update(result.values);
  if ((container as Node).isConnected) instance.reconnected();
  return instance;
}

/** Hydrate a custom element's configured light/shadow render root. */
export function hydrateElement(
  element: HTMLElement,
  result: TemplateResult,
  options?: HydrateOptions
): TemplateInstance {
  const root: SniceRenderRoot = ensureRenderRoot(element);
  const instance = hydrate(result, root, options);
  (element as any)[RENDER_INSTANCE] = instance;
  element.removeAttribute('data-snice-hydrate');
  return instance;
}
