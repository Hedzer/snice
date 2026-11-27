import {
  HTML_RESULT,
  type CompiledTemplateDescriptor,
  type TemplateResult,
} from './template';
import { type RenderHostIdentity } from './render-errors';
import {
  TEMPLATE_INSTANCE_BRAND,
  type Part,
  type PropertyBindingRegistry,
  type TemplateInstanceLike,
  type CompiledPartContext,
} from './part-base';

interface PreparedCompiledTemplate {
  element: HTMLTemplateElement;
  paths: number[][];
  nodeSlots: Set<number>;
}

const compiledTemplateCache = /*#__PURE__*/ new WeakMap<CompiledTemplateDescriptor, PreparedCompiledTemplate>();

function prepareCompiledTemplate(
  compiled: CompiledTemplateDescriptor,
  isSvg?: boolean
): PreparedCompiledTemplate {
  const cached = compiledTemplateCache.get(compiled);
  if (cached) return cached;

  const template = document.createElement('template');
  if (isSvg) {
    template.innerHTML = `<svg>${compiled.html}</svg>`;
    const wrapper = template.content.firstElementChild!;
    while (wrapper.firstChild) {
      template.content.insertBefore(wrapper.firstChild, wrapper);
    }
    template.content.removeChild(wrapper);
  } else {
    template.innerHTML = compiled.html;
  }

  const markerAttr = compiled.m ?? 'data-s';
  const nodePrefix = `${markerAttr}$`;
  const commentPrefix = `${markerAttr}c$`;
  const paths: number[][] = [];
  const nodeSlots = new Set<number>();

  // Walk childNodes recursively (no TreeWalker!) to record child-index paths,
  // remove temporary marker attributes, and pair node-part start/end comments.
  const walk = (parent: Node, path: number[]) => {
    const children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      path.push(i);
      if (child.nodeType === 1) {
        const el = child as Element;
        const slotAttr = el.getAttribute(markerAttr);
        if (slotAttr !== null) {
          paths[Number(slotAttr)] = path.slice();
          el.removeAttribute(markerAttr);
        }
        if (el.childNodes.length > 0) {
          walk(el, path);
        }
      } else if (child.nodeType === 8) {
        const data = (child as Comment).data;
        if (data.startsWith(nodePrefix)) {
          const slot = Number(data.slice(nodePrefix.length));
          paths[slot] = path.slice();
          nodeSlots.add(slot);
          (child as Comment).data = '';
          const endNode = document.createComment('');
          parent.insertBefore(endNode, child.nextSibling);
          i++; // skip newly inserted endNode
        } else if (data.startsWith(commentPrefix)) {
          const slot = Number(data.slice(commentPrefix.length));
          paths[slot] = path.slice();
          (child as Comment).data = '';
        }
      }
      path.pop();
    }
  };
  walk(template.content, []);

  const prepared: PreparedCompiledTemplate = { element: template, paths, nodeSlots };
  compiledTemplateCache.set(compiled, prepared);
  return prepared;
}

function resolvePath(root: Node, path: readonly number[]): Node {
  let node: Node = root;
  for (let i = 0; i < path.length; i++) {
    node = node.childNodes[path[i]];
  }
  return node;
}

/**
 * Lean template instance for build-time precompiled templates (`precompileTemplates: true`).
 * Bypasses `prepareTemplate()`, `scanTemplateQuasis()`, and `TreeWalker` completely, and
 * instantiates parts strictly via the tree-shakeable factory references imported by the caller.
 */
export class CompiledTemplateInstance implements TemplateInstanceLike {
  readonly [TEMPLATE_INSTANCE_BRAND] = true as const;
  strings: TemplateStringsArray;
  parts: Part[] = [];
  fragment: DocumentFragment | null = null;
  private compiled: CompiledTemplateDescriptor;
  private prepared: PreparedCompiledTemplate;
  private conditionalParts: Array<{ part: Part; index: number }> = [];
  private regularParts: Array<{ part: Part; index: number }> = [];
  readonly #renderIdentity: RenderHostIdentity | null;
  readonly #customElementRegistry: PropertyBindingRegistry | null;

  constructor(
    result: TemplateResult,
    renderIdentity: RenderHostIdentity | null = null,
    customElementRegistry: PropertyBindingRegistry | null =
      document.defaultView?.customElements ?? globalThis.customElements ?? null
  ) {
    this.#renderIdentity = renderIdentity;
    this.#customElementRegistry = customElementRegistry;
    this.strings = result.strings;
    this.compiled = result.compiled!;
    this.prepared = prepareCompiledTemplate(this.compiled, result.svg);
  }

  isSameTemplate(strings: TemplateStringsArray): boolean {
    return this.strings === strings;
  }

  getRenderHostIdentity(): RenderHostIdentity | null {
    return this.#renderIdentity;
  }

  renderFragment(): DocumentFragment {
    if (!this.fragment) {
      this.fragment = this.prepared.element.content.cloneNode(true) as DocumentFragment;
      const { paths, nodeSlots } = this.prepared;
      const specs = this.compiled.parts;

      // Resolve all slot nodes BEFORE running part constructors (conditionals
      // relocate children into DocumentFragments and remove <if>/<case> hosts).
      const resolvedNodes: Node[] = new Array(paths.length);
      const endNodes = new Map<Node, Comment>();
      for (let s = 0; s < paths.length; s++) {
        if (!paths[s]) continue;
        const node = resolvePath(this.fragment, paths[s]);
        resolvedNodes[s] = node;
        if (nodeSlots.has(s)) {
          endNodes.set(node, node.nextSibling as Comment);
        }
      }

      let dynamicWhenElements: Set<Element> | null = null;
      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        if ((spec[2] as any)._isWhen) {
          if (!dynamicWhenElements) dynamicWhenElements = new Set<Element>();
          dynamicWhenElements.add(resolvedNodes[spec[0]] as Element);
        }
      }

      const ctx: CompiledPartContext = {
        renderIdentity: this.#renderIdentity,
        customElementRegistry: this.#customElementRegistry,
        dynamicWhenElements,
        endNodes,
      };

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const node = resolvedNodes[spec[0]];
        const valueIndex = spec[1];
        const factory = spec[2];
        const part: Part = factory(node, spec[3], spec[4], ctx);
        this.parts.push(part);

        if (part._isCond) {
          this.conditionalParts.push({ part, index: valueIndex });
        } else {
          this.regularParts.push({ part, index: valueIndex });
        }
      }
    }

    return this.fragment;
  }

  render(values: readonly any[]): DocumentFragment {
    const fragment = this.renderFragment();
    this.update(values);
    return fragment;
  }

  update(values: readonly any[]): void {
    if (this.conditionalParts.length > 0) {
      for (const { part, index } of this.conditionalParts) {
        part.commit(values[index]);
      }
      const flushed = new Set<Part>();
      for (const { part } of this.conditionalParts) {
        const coordinator = part._getCoordinator ? part._getCoordinator() : part;
        if (flushed.has(coordinator)) continue;
        flushed.add(coordinator);
        coordinator._flush?.();
      }
    }

    for (const { part, index } of this.regularParts) {
      if (part._multi) {
        part.commit(values, index);
      } else {
        part.commit(values[index]);
      }
    }

    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        if (part.isConnected) part.reconnected();
        else part.disconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  clear(): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.destroy();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  disconnected(preserveEventListeners = false): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.disconnected(preserveEventListeners);
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  reconnected(): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.reconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }
}

function createCompiledInstance(
  result: TemplateResult,
  renderIdentity: RenderHostIdentity | null,
  customElementRegistry: PropertyBindingRegistry | null
): CompiledTemplateInstance {
  return new CompiledTemplateInstance(result, renderIdentity, customElementRegistry);
}

/**
 * Runtime constructor for build-time pre-compiled templates (`precompileTemplates: true`).
 * Does NOT import `parts.ts`, `prepareTemplate`, `TreeWalker`, or any unused Part subclass.
 */
export function __sniceTemplate(
  strings: TemplateStringsArray,
  values: readonly any[],
  compiled: CompiledTemplateDescriptor,
  isSvg?: boolean
): TemplateResult {
  return isSvg
    ? { _$litType$: HTML_RESULT, strings, values, svg: true, compiled, _create: createCompiledInstance }
    : { _$litType$: HTML_RESULT, strings, values, compiled, _create: createCompiledInstance };
}
