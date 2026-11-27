import { TemplateResult, isTemplateResult, isUnsafeHTML, UnsafeHTML, nothing } from './template';
import { isRepeatResult } from './repeat';
import { contextualizeRenderError, type RenderHostIdentity } from './render-errors';
import {
  Part,
  NOT_COMMITTED,
  noChange,
  isPrimitiveValue,
  isTemplateInstance,
  createTemplateInstance,
  getTemplateItemKey,
  type PropertyBindingRegistry,
  type TemplateInstanceLike,
  type CompiledPartContext,
} from './part-base';

const isIterable = (value: unknown): value is Iterable<unknown> =>
  Array.isArray(value) || typeof (value as any)?.[Symbol.iterator] === 'function';

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof (value as PromiseLike<unknown>).then === 'function';

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> =>
  !!value && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';

/**
 * NodePart handles text content and nested templates
 */
export class NodePart extends Part {
  readonly type = 'node' as const;
  private startNode: Comment;
  private endNode: Comment;
  private _committedValue: any = NOT_COMMITTED;
  private _itemKeys: unknown[] | null = null;
  private _asyncSource: PromiseLike<unknown> | AsyncIterable<unknown> | null = null;
  private _asyncVersion = 0;
  private _asyncIterator: AsyncIterator<unknown> | null = null;
  private _asyncRunning = false;
  private _asyncStarted = false;
  private _asyncCompleted = false;
  private _asyncPaused = false;
  private _committingAsyncValue = false;
  readonly #renderIdentity: RenderHostIdentity | null;
  readonly #customElementRegistry: PropertyBindingRegistry | null;

  constructor(
    startNode: Comment,
    endNode: Comment,
    renderIdentity: RenderHostIdentity | null = null,
    customElementRegistry: PropertyBindingRegistry | null = null
  ) {
    super();
    this.startNode = startNode;
    this.endNode = endNode;
    this.#renderIdentity = renderIdentity;
    this.#customElementRegistry = customElementRegistry;
  }

  private _withRenderContext(error: unknown): unknown {
    return this.#renderIdentity ? contextualizeRenderError(this.#renderIdentity, error) : error;
  }

  commit(value: any): void {
    if (value === noChange) {
      return;
    }

    if (isPromiseLike(value) || isAsyncIterable(value)) {
      this._commitAsync(value);
      return;
    }
    if (!this._committingAsyncValue && this._asyncSource) this._cancelAsync(true);

    if (value === nothing || value == null || value === '') {
      if (this._committedValue !== nothing) {
        const cleanupError = this._clear();
        this._committedValue = nothing;
        if (cleanupError) throw cleanupError;
      }
      this._committedValue = nothing;
      return;
    }

    if (isPrimitiveValue(value)) {
      if (value !== this._committedValue) {
        this._commitText(value);
      }
      return;
    }

    if (isTemplateResult(value)) {
      this._commitTemplateResult(value);
      return;
    }

    if (isRepeatResult(value)) {
      if (value.values.length === 0) {
        this.commit(value.empty ?? nothing);
      } else {
        this._commitIterable(value.values, value.keys);
      }
      return;
    }

    if (isUnsafeHTML(value)) {
      this._commitUnsafeHTML(value);
      return;
    }

    if ((value as Node).nodeType !== undefined) {
      this._commitNode(value as Node);
      return;
    }

    if (isIterable(value)) {
      this._commitIterable(value);
      return;
    }

    this._commitText(value);
  }

  private _commitText(value: any): void {
    const canReuse =
      this._committedValue !== NOT_COMMITTED &&
      this._committedValue !== nothing &&
      isPrimitiveValue(this._committedValue) &&
      !Array.isArray(this._committedValue);

    if (canReuse) {
      const textNode = this.startNode.nextSibling as Text;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.data = String(value);
        this._committedValue = value;
        return;
      }
    }

    const cleanupError = this._clear();
    this._insertBefore(document.createTextNode(String(value)));
    this._committedValue = value;
    if (cleanupError) throw cleanupError;
  }

  private _commitTemplateResult(result: TemplateResult): void {
    const committedInstance = this._committedValue as TemplateInstanceLike;

    if (isTemplateInstance(committedInstance) && committedInstance.isSameTemplate(result.strings)) {
      committedInstance.update(result.values);
      return;
    }

    const instance = createTemplateInstance(
      result,
      this.#renderIdentity,
      this.#customElementRegistry
    );
    const fragment = instance.renderFragment();
    try {
      instance.update(result.values);
    } catch (error) {
      instance.clear();
      throw error;
    }

    const previousValue = this._committedValue;
    const previousKeys = this._itemKeys;
    const previousFragment = this.endNode.ownerDocument.createDocumentFragment();
    let previousNode = this.startNode.nextSibling;
    while (previousNode && previousNode !== this.endNode) {
      const next = previousNode.nextSibling;
      previousFragment.appendChild(previousNode);
      previousNode = next;
    }

    this._insertBefore(fragment);
    this._committedValue = instance;
    this._itemKeys = null;
    try {
      if (this.isConnected) instance.reconnected();
    } catch (error) {
      try {
        instance.clear();
      } catch (cleanupError) {
        console.error('snice: failed to clean up a rejected nested template:', cleanupError);
      }
      let node = this.startNode.nextSibling;
      while (node && node !== this.endNode) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
      this._insertBefore(previousFragment);
      this._committedValue = previousValue;
      this._itemKeys = previousKeys;
      throw error;
    }

    this._disposeCommitted(previousValue);
  }

  private _commitIterable(value: Iterable<unknown>, explicitKeys?: readonly unknown[]): void {
    const items = Array.isArray(value) ? (value as unknown[]) : Array.from(value);
    const newKeys = explicitKeys
      ? Array.from(explicitKeys)
      : items.map(item => getTemplateItemKey(item, this.#renderIdentity));
    if (newKeys.length !== items.length) {
      throw new Error('snice: keyed iterable produced a different number of keys and values.');
    }
    const definedKeys = newKeys.filter(key => key !== undefined);
    if (definedKeys.length > 0 && definedKeys.length !== newKeys.length) {
      if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
        console.warn(
          'snice: a list mixes keyed and unkeyed items. Identity falls back to position; ' +
          'use repeat(items, { key, render }) for deterministic updates.'
        );
      }
    }
    if (definedKeys.length > 0 && new Set(definedKeys).size !== definedKeys.length) {
      throw new Error('snice: a keyed list contains duplicate keys.');
    }

    let cleanupError: unknown;
    if (!Array.isArray(this._committedValue) ||
        !(this._committedValue[0] instanceof NodePart)) {
      cleanupError = this._clear();
      this._committedValue = [];
      this._itemKeys = null;
    }
    const allKeyed = items.length > 0 && newKeys.every(k => k !== undefined);
    const oldKeys = this._itemKeys;

    if (allKeyed && oldKeys && (this._committedValue as NodePart[]).length > 0) {
      const sameOrder =
        oldKeys.length === newKeys.length &&
        newKeys.every((k, i) => k === oldKeys[i]);

      if (!sameOrder) {
        cleanupError ??= this._reconcileKeyed(
          items,
          newKeys,
          this._committedValue as NodePart[],
          oldKeys
        );
        this._itemKeys = newKeys;
        if (cleanupError) throw cleanupError;
        return;
      }
    }

    const itemParts = this._committedValue as NodePart[];
    let partIndex = 0;

    for (const item of items) {
      let itemPart: NodePart;

      if (partIndex >= itemParts.length) {
        const startMarker = document.createComment('');
        const endMarker = document.createComment('');
        this._insertBefore(startMarker);
        this._insertBefore(endMarker);
        itemPart = new NodePart(
          startMarker,
          endMarker,
          this.#renderIdentity,
          this.#customElementRegistry
        );
        itemParts.push(itemPart);
      } else {
        itemPart = itemParts[partIndex];
      }

      itemPart.commit(item);
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      for (let i = partIndex; i < itemParts.length; i++) {
        const part = itemParts[i];
        try {
          part.destroy();
        } catch (error) {
          cleanupError ??= error;
        }
        part.startNode.remove();
        part.endNode.remove();
      }
      itemParts.length = partIndex;
    }

    this._itemKeys = allKeyed ? newKeys : null;
    if (cleanupError) throw cleanupError;
  }

  private _reconcileKeyed(
    items: unknown[],
    newKeys: unknown[],
    oldParts: NodePart[],
    oldKeys: unknown[]
  ): unknown {
    const parent = this.endNode.parentNode!;
    let cleanupError: unknown;

    const oldByKey = new Map<unknown, NodePart>();
    for (let i = 0; i < oldParts.length; i++) {
      if (!oldByKey.has(oldKeys[i])) oldByKey.set(oldKeys[i], oldParts[i]);
    }

    const reused = new Set<NodePart>();
    const newParts: (NodePart | null)[] = new Array(items.length).fill(null);
    for (let i = 0; i < items.length; i++) {
      const candidate = oldByKey.get(newKeys[i]);
      if (candidate && !reused.has(candidate)) {
        reused.add(candidate);
        newParts[i] = candidate;
      }
    }

    for (const part of oldParts) {
      if (!reused.has(part)) {
        try {
          part.destroy();
        } catch (error) {
          cleanupError ??= error;
        }
        part.startNode.remove();
        part.endNode.remove();
      }
    }

    let ref: Node = this.startNode.nextSibling!;
    for (let i = 0; i < newParts.length; i++) {
      let part = newParts[i];

      if (part) {
        if (part.startNode === ref) {
          ref = part.endNode.nextSibling!;
        } else {
          const range = document.createDocumentFragment();
          let node: Node | null = part.startNode;
          const stop: Node | null = part.endNode.nextSibling;
          while (node && node !== stop) {
            const next: Node | null = node.nextSibling;
            range.appendChild(node);
            node = next;
          }
          parent.insertBefore(range, ref);
        }
      } else {
        const startMarker = document.createComment('');
        const endMarker = document.createComment('');
        parent.insertBefore(startMarker, ref);
        parent.insertBefore(endMarker, ref);
        part = new NodePart(
          startMarker,
          endMarker,
          this.#renderIdentity,
          this.#customElementRegistry
        );
        newParts[i] = part;
      }

      part.commit(items[i]);
    }

    this._committedValue = newParts as NodePart[];
    return cleanupError;
  }

  private _commitNode(node: Node): void {
    if (this._committedValue !== node) {
      const cleanupError = this._clear();
      this._insertBefore(node);
      this._committedValue = node;
      if (cleanupError) throw cleanupError;
    }
  }

  private _commitUnsafeHTML(value: UnsafeHTML): void {
    const prev = this._committedValue;
    if (isUnsafeHTML(prev) && (prev as UnsafeHTML).html === value.html) {
      return;
    }

    const cleanupError = this._clear();
    const temp = document.createElement('template');
    temp.innerHTML = value.html;
    this._insertBefore(temp.content);
    this._committedValue = value;
    if (cleanupError) throw cleanupError;
  }

  private _commitAsync(source: PromiseLike<unknown> | AsyncIterable<unknown>): void {
    if (source === this._asyncSource) return;
    this._cancelAsync(false);
    this._asyncSource = source;
    this._asyncStarted = false;
    this._asyncCompleted = false;
    this._asyncPaused = false;
    const cleanupError = this._clear();
    this._committedValue = nothing;
    this._startAsyncSource();
    if (cleanupError) throw cleanupError;
  }

  private _startAsyncSource(forceConnected = false): void {
    const source = this._asyncSource;
    if (
      !source || this._asyncRunning || this._asyncCompleted ||
      (!forceConnected && !this.isConnected)
    ) return;
    this._asyncRunning = true;
    this._asyncStarted = true;
    this._asyncPaused = false;
    const version = ++this._asyncVersion;

    if (isAsyncIterable(source)) {
      try {
        this._asyncIterator = source[Symbol.asyncIterator]();
      } catch (error) {
        this._asyncRunning = false;
        this._asyncCompleted = true;
        console.error('snice: async iterable template value failed:', this._withRenderContext(error));
        return;
      }
      void (async () => {
        try {
          while (this._asyncIterator) {
            const result = await this._asyncIterator.next();
            if (result.done || version !== this._asyncVersion) break;
            this._commitAsyncValue(result.value);
          }
        } catch (error) {
          if (version === this._asyncVersion) {
            console.error('snice: async iterable template value failed:', this._withRenderContext(error));
          }
        } finally {
          if (version === this._asyncVersion) {
            this._asyncIterator = null;
            this._asyncRunning = false;
            this._asyncCompleted = true;
          }
        }
      })();
      return;
    }

    Promise.resolve(source).then(
      value => {
        if (version !== this._asyncVersion) return;
        this._asyncRunning = false;
        this._asyncCompleted = true;
        try {
          this._commitAsyncValue(value);
        } catch (error) {
          console.error('snice: promise template value failed:', this._withRenderContext(error));
        }
      },
      error => {
        if (version !== this._asyncVersion) return;
        this._asyncRunning = false;
        this._asyncCompleted = true;
        console.error('snice: promise template value failed:', this._withRenderContext(error));
      }
    );
  }

  private _commitAsyncValue(value: unknown): void {
    this._committingAsyncValue = true;
    try {
      this.commit(value);
    } finally {
      this._committingAsyncValue = false;
    }
  }

  private _cancelAsync(clearSource: boolean): void {
    this._asyncVersion++;
    const iterator = this._asyncIterator;
    this._asyncIterator = null;
    this._asyncRunning = false;
    if (clearSource) {
      this._asyncSource = null;
      this._asyncStarted = false;
      this._asyncCompleted = false;
      this._asyncPaused = false;
    }
    if (iterator?.return) {
      try {
        void Promise.resolve(iterator.return()).catch(() => {});
      } catch {
        // Cancellation is best-effort; internal state is already detached.
      }
    }
  }

  private _insertBefore(node: Node): void {
    this.endNode.parentNode?.insertBefore(node, this.endNode);
  }

  _clear(): unknown {
    const parent = this.startNode.parentNode;
    const committed = this._committedValue;
    let cleanupError: unknown;
    try {
      this._disposeCommitted(committed);
    } catch (error) {
      cleanupError = error;
    }
    if (!parent) {
      this._committedValue = nothing;
      return cleanupError;
    }

    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      parent.removeChild(node);
      node = next;
    }
    this._committedValue = nothing;
    return cleanupError;
  }

  private _disposeCommitted(committed: unknown): void {
    let lifecycleError: unknown;
    if (isTemplateInstance(committed)) {
      try {
        committed.clear();
      } catch (error) {
        lifecycleError = error;
      }
    } else if (Array.isArray(committed)) {
      for (const item of committed) {
        if (!(item instanceof NodePart)) continue;
        try {
          item.destroy();
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  clear(): void {
    this._cancelAsync(true);
    const cleanupError = this._clear();
    if (cleanupError) throw cleanupError;
  }

  get isConnected(): boolean {
    return this.startNode.isConnected;
  }

  disconnected(preserveEventListeners = false): void {
    let lifecycleError: unknown;
    if (isTemplateInstance(this._committedValue)) {
      try {
        this._committedValue.disconnected(preserveEventListeners);
      } catch (error) {
        lifecycleError ??= error;
      }
    } else if (Array.isArray(this._committedValue)) {
      for (const part of this._committedValue) {
        if (!(part instanceof NodePart)) continue;
        try {
          part.disconnected(preserveEventListeners);
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (this._asyncSource && this._asyncRunning) {
      this._cancelAsync(false);
      this._asyncPaused = true;
    }
    if (lifecycleError) throw lifecycleError;
  }

  reconnected(): void {
    let lifecycleError: unknown;
    if (isTemplateInstance(this._committedValue)) {
      try {
        this._committedValue.reconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    } else if (Array.isArray(this._committedValue)) {
      for (const part of this._committedValue) {
        if (!(part instanceof NodePart)) continue;
        try {
          part.reconnected();
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (this._asyncSource && (!this._asyncStarted || this._asyncPaused)) {
      this._startAsyncSource(true);
    }
    if (lifecycleError) throw lifecycleError;
  }
}

/** @internal Tree-shakeable compiled-template factory for NodePart */
export function __pNode(
  node: Node,
  _a: unknown,
  _b: unknown,
  ctx: CompiledPartContext
): NodePart {
  return new NodePart(
    node as Comment,
    ctx.endNodes.get(node)!,
    ctx.renderIdentity,
    ctx.customElementRegistry
  );
}
