import { Directive, DirectivePart, DirectiveResult, DirectiveServerContext, directive } from './directive';
import { NodePart, noChange } from './parts';
import { nothing } from './template';
import { findRenderHost, setRangeRenderHost } from './render-root';

export type ResourceSource<T> =
  | PromiseLike<T>
  | AsyncIterable<T>
  | ((signal: AbortSignal) => T | PromiseLike<T> | AsyncIterable<T>);

export interface ResourceOptions<T, E = unknown> {
  pending?: unknown | (() => unknown);
  ready?: (value: T) => unknown;
  error?: (error: E) => unknown;
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return !!value && typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
}

class ResourceDirective extends Directive {
  static renderToString(values: readonly unknown[], context: DirectiveServerContext): unknown {
    const source = values[0] as ResourceSource<unknown>;
    const options = (values[1] || {}) as ResourceOptions<unknown>;
    const pending = () => typeof options.pending === 'function'
      ? (options.pending as () => unknown)()
      : (options.pending ?? nothing);
    if (!context.async) return pending();

    return (async () => {
      const controller = new AbortController();
      try {
        const output = typeof source === 'function' ? source(controller.signal) : source;
        let value: unknown;
        if (isAsyncIterable(output)) {
          let emitted = false;
          for await (const item of output) {
            emitted = true;
            value = item;
          }
          if (!emitted) return pending();
        } else {
          value = await output;
        }
        return options.ready ? options.ready(value) : value;
      } catch (error) {
        if (options.error) return options.error(error);
        throw error;
      } finally {
        controller.abort();
      }
    })();
  }
  private part: DirectivePart | null = null;
  private source: ResourceSource<unknown> | null = null;
  private options: ResourceOptions<unknown> = {};
  private controller: AbortController | null = null;
  private iterator: AsyncIterator<unknown> | null = null;
  private version = 0;
  private started = false;
  private status: 'pending' | 'ready' | 'error' = 'pending';
  private result: unknown;

  render(): unknown {
    return nothing;
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    if (part.type !== 'node') {
      throw new TypeError('snice: resource() must be used in a node expression.');
    }
    const source = values[0] as ResourceSource<unknown>;
    const options = (values[1] || {}) as ResourceOptions<unknown>;
    if (!source || (typeof source !== 'function' && typeof (source as any).then !== 'function' && !isAsyncIterable(source))) {
      throw new TypeError('snice: resource() expects a Promise, AsyncIterable, or AbortSignal source function.');
    }

    const changed = source !== this.source;
    this.part = part;
    this.options = options;
    if (changed) {
      this.cancel();
      this.source = source;
      this.status = 'pending';
      this.result = undefined;
    }

    if (part.isConnected && !this.started) this.start();
    if (this.status !== 'pending') return this.mapResult();
    return typeof options.pending === 'function'
      ? (options.pending as () => unknown)()
      : (options.pending ?? nothing);
  }

  disconnected(): void {
    this.cancel();
  }

  reconnected(): void {
    if (!this.started && this.source) this.start();
  }

  private start(): void {
    if (!this.source || !this.part || this.started) return;
    this.started = true;
    this.controller = new AbortController();
    const version = ++this.version;

    let result: unknown;
    try {
      result = typeof this.source === 'function'
        ? this.source(this.controller.signal)
        : this.source;
    } catch (error) {
      this.commitError(error, version);
      return;
    }

    if (isAsyncIterable(result)) {
      void this.consume(result, version);
      return;
    }

    Promise.resolve(result).then(
      value => this.commitReady(value, version),
      error => this.commitError(error, version)
    );
  }

  private async consume(iterable: AsyncIterable<unknown>, version: number): Promise<void> {
    this.iterator = iterable[Symbol.asyncIterator]();
    try {
      while (true) {
        const result = await this.iterator.next();
        if (result.done || this.isStale(version)) break;
        this.commitReady(result.value, version);
      }
    } catch (error) {
      this.commitError(error, version);
    } finally {
      if (version === this.version) this.iterator = null;
    }
  }

  private commitReady(value: unknown, version: number): void {
    if (this.isStale(version)) return;
    this.status = 'ready';
    this.result = value;
    this.part?.setValue(this.mapResult());
  }

  private commitError(error: unknown, version: number): void {
    if (this.isStale(version)) return;
    this.status = 'error';
    this.result = error;
    this.part?.setValue(this.mapResult());
  }

  private mapResult(): unknown {
    if (this.status === 'ready') {
      try {
        return this.options.ready ? this.options.ready(this.result) : this.result;
      } catch (error) {
        this.status = 'error';
        this.result = error;
      }
    }
    if (this.status === 'error') {
      if (this.options.error) {
        try {
          return this.options.error(this.result);
        } catch (error) {
          console.error('snice: resource error renderer threw:', error);
          return nothing;
        }
      }
      console.error('snice: unhandled resource error:', this.result);
    }
    return nothing;
  }

  private isStale(version: number): boolean {
    return version !== this.version || !!this.controller?.signal.aborted;
  }

  private cancel(): void {
    this.version++;
    this.controller?.abort();
    this.controller = null;
    const iterator = this.iterator;
    this.iterator = null;
    this.started = false;
    if (iterator?.return) {
      try {
        void Promise.resolve(iterator.return()).catch(() => {});
      } catch {
        // Cancellation is best-effort; internal state is already detached.
      }
    }
  }
}

const resourceResult = directive<ResourceDirective, readonly [ResourceSource<unknown>, ResourceOptions<unknown>?]>(ResourceDirective);

export function resource<T, E = unknown>(
  source: ResourceSource<T>,
  options?: ResourceOptions<T, E>
): DirectiveResult {
  return resourceResult(
    source as ResourceSource<unknown>,
    options as ResourceOptions<unknown> | undefined
  );
}

export type PortalTarget =
  | ParentNode
  | string
  | null
  | undefined
  | (() => ParentNode | null | undefined);

class PortalDirective extends Directive {
  static renderToString(): unknown { return nothing; }
  private targetSpec: PortalTarget;
  private target: ParentNode | null = null;
  private start: Comment | null = null;
  private end: Comment | null = null;
  private contentPart: NodePart | null = null;
  private content: unknown = nothing;
  private connected = false;
  private owner: HTMLElement | null = null;
  private hostPart: NodePart | null = null;

  render(): unknown {
    return noChange;
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    if (part.type !== 'node') throw new TypeError('snice: portal() must be used in a node expression.');
    this.hostPart = part as NodePart;
    const targetSpec = values[0] as PortalTarget;
    this.content = values[1];
    this.owner = findRenderHost((part as NodePart).startMarker);
    if (targetSpec !== this.targetSpec) {
      this.targetSpec = targetSpec;
    }
    const resolvedTarget = this.resolveTarget();
    if (this.connected && resolvedTarget !== this.target) {
      if (resolvedTarget) this.movePortal(resolvedTarget);
      else if (this.targetSpec == null) this.destroyPortal();
      else throw new Error(`snice: portal target ${String(this.targetSpec)} was not found.`);
    }
    if (part.isConnected && !this.connected) this.createPortal(resolvedTarget);
    this.contentPart?.commit(this.content);
    this.markOwner();
    return noChange;
  }

  disconnected(): void {
    this.destroyPortal();
  }

  reconnected(): void {
    if (this.hostPart) this.owner = findRenderHost(this.hostPart.startMarker);
    this.createPortal();
    this.contentPart?.commit(this.content);
    this.markOwner();
  }

  private resolveTarget(): ParentNode | null {
    const value = typeof this.targetSpec === 'function' ? this.targetSpec() : this.targetSpec;
    if (typeof value === 'string') return document.querySelector(value);
    return value || null;
  }

  private createPortal(resolvedTarget = this.resolveTarget()): void {
    if (this.connected) return;
    const target = resolvedTarget;
    if (!target) {
      if (this.targetSpec != null) {
        throw new Error(`snice: portal target ${String(this.targetSpec)} was not found.`);
      }
      return;
    }
    this.validateTarget(target);
    const documentRef = (target as Node).ownerDocument || document;
    this.start = documentRef.createComment('portal');
    this.end = documentRef.createComment('/portal');
    target.appendChild(this.start);
    target.appendChild(this.end);
    this.contentPart = new NodePart(this.start, this.end);
    this.target = target;
    this.connected = true;
  }

  private movePortal(target: ParentNode): void {
    if (!this.start || !this.end || target === this.target) return;
    this.validateTarget(target);
    const fragment = this.start.ownerDocument.createDocumentFragment();
    let node: Node | null = this.start;
    const stop = this.end.nextSibling;
    while (node && node !== stop) {
      const next: Node | null = node.nextSibling;
      fragment.appendChild(node);
      node = next;
    }
    target.appendChild(fragment);
    this.target = target;
  }

  private validateTarget(target: ParentNode): void {
    if (typeof (target as ParentNode).appendChild !== 'function') {
      throw new TypeError('snice: portal() target must be a ParentNode, selector, or target function.');
    }
  }

  private markOwner(): void {
    if (this.start && this.end) setRangeRenderHost(this.start, this.end, this.owner);
  }

  private destroyPortal(): void {
    if (!this.start || !this.end) {
      this.connected = false;
      return;
    }
    setRangeRenderHost(this.start, this.end, null);
    let cleanupError: unknown;
    try {
      this.contentPart?.destroy();
    } catch (error) {
      cleanupError = error;
    }
    let node: Node | null = this.start;
    const stop = this.end.nextSibling;
    while (node && node !== stop) {
      const next: Node | null = node.nextSibling;
      node.parentNode?.removeChild(node);
      node = next;
    }
    this.start = null;
    this.end = null;
    this.contentPart = null;
    this.target = null;
    this.connected = false;
    if (cleanupError) throw cleanupError;
  }
}

const portalResult = directive<PortalDirective, readonly [PortalTarget, unknown]>(PortalDirective);

export function portal(target: PortalTarget, content: unknown): DirectiveResult {
  return portalResult(target, content);
}
