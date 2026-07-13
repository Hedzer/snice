import {
  Directive,
  DirectiveDisconnectContext,
  DirectivePart,
  DirectiveResult,
  PartInfo,
  DirectiveServerContext,
  directive,
  directiveServerResult
} from './directive';
import { noChange } from './parts';
import { nothing } from './template';
import { findRenderHost } from './render-root';

export interface Ref<T extends Element = Element> {
  value: T | null;
}

export type RefCallback<T extends Element = Element> = (value: T | null) => void;
export type RefTarget<T extends Element = Element> = Ref<T> | RefCallback<T>;

export function createRef<T extends Element = Element>(): Ref<T> {
  return { value: null };
}

function writeRef<T extends Element>(target: RefTarget<T>, value: T | null): void {
  if (typeof target === 'function') target(value);
  else target.value = value;
}

class RefDirective extends Directive {
  static renderToString(): unknown { return nothing; }
  private target: RefTarget | null = null;
  private element: Element | null = null;
  private assigned = false;

  render(target: RefTarget): unknown {
    return this.updateTarget(target);
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    const target = values[0] as RefTarget;
    if (part.type !== 'element' || !part.element) {
      throw new TypeError('snice: ref() must be used in an element position: <div ${ref(target)}>.');
    }
    if (typeof target !== 'function' && (!target || typeof target !== 'object' || !('value' in target))) {
      throw new TypeError('snice: ref() expects createRef() or a callback.');
    }
    this.element = part.element;

    if (target !== this.target) {
      try {
        this.clearAssignment();
      } catch (error) {
        console.error('snice: ref() cleanup callback failed:', error);
      }
      this.target = target;
    }

    if (part.isConnected && !this.assigned) {
      writeRef(this.target, part.element);
      this.assigned = true;
    }
    return noChange;
  }

  private updateTarget(target: RefTarget): unknown {
    this.target = target;
    return noChange;
  }

  disconnected(): void {
    this.clearAssignment();
  }

  reconnected(): void {
    if (!this.target || !this.element || this.assigned) return;
    writeRef(this.target, this.element);
    this.assigned = true;
  }

  adopted(nodeMap: ReadonlyMap<Node, Node>): void {
    const adopted = this.element ? nodeMap.get(this.element) : undefined;
    if (adopted instanceof Element) this.element = adopted;
  }

  private clearAssignment(): void {
    const target = this.assigned ? this.target : null;
    this.assigned = false;
    if (target) writeRef(target, null);
  }
}

export const ref = directive<RefDirective, readonly [RefTarget]>(RefDirective);

export interface UseHandle<T = unknown> {
  update?(value: T): void;
  destroy?(): void;
}

export type UseCleanup = void | (() => void) | UseHandle;
export type UseAction<T = unknown> = (element: Element, value: T) => UseCleanup;

class UseDirective extends Directive {
  static renderToString(): unknown { return nothing; }
  private action: UseAction | null = null;
  private element: Element | null = null;
  private handle: UseCleanup = undefined;
  private value: unknown;
  private connected = false;

  render(): unknown {
    return noChange;
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    if (part.type !== 'element' || !part.element) {
      throw new TypeError('snice: use() must be used in an element position.');
    }

    const action = values[0] as UseAction;
    const value = values[1];
    if (typeof action !== 'function') throw new TypeError('snice: use() expects an action function.');
    this.element = part.element;
    let cleanupError: unknown;

    if (this.action !== action) {
      try {
        this.destroyHandle();
      } catch (error) {
        cleanupError = error;
      }
      this.action = action;
      this.connected = false;
    }

    if (!part.isConnected) {
      this.value = value;
      if (cleanupError) console.error('snice: use() cleanup failed while updating an action:', cleanupError);
      return noChange;
    }

    if (!this.connected) {
      this.value = value;
      this.handle = action(part.element, value);
      this.connected = true;
    } else if (!Object.is(value, this.value)) {
      this.value = value;
      if (this.handle && typeof this.handle === 'object' && this.handle.update) {
        this.handle.update(value);
      } else {
        try {
          this.destroyHandle();
        } catch (error) {
          cleanupError ??= error;
        }
        this.handle = action(part.element, value);
        this.connected = true;
      }
    }
    if (cleanupError) console.error('snice: use() cleanup failed while updating an action:', cleanupError);
    return noChange;
  }

  disconnected(): void {
    this.destroyHandle();
  }

  reconnected(): void {
    if (!this.action || !this.element || this.connected) return;
    this.handle = this.action(this.element, this.value);
    this.connected = true;
  }

  adopted(nodeMap: ReadonlyMap<Node, Node>): void {
    const adopted = this.element ? nodeMap.get(this.element) : undefined;
    if (adopted instanceof Element) this.element = adopted;
  }

  private destroyHandle(): void {
    const handle = this.handle;
    this.handle = undefined;
    this.connected = false;
    if (typeof handle === 'function') handle();
    else if (handle && typeof handle === 'object') handle.destroy?.();
  }
}

export const use = directive<UseDirective, readonly [UseAction, unknown?]>(UseDirective);

type SpreadKind = 'properties' | 'attributes' | 'events';
type SpreadValues = Readonly<Record<string, unknown>> | null | undefined;

function normalizeEventName(name: string): string {
  return name.startsWith('@') ? name.slice(1) : name;
}

function validateEventSpread(next: Record<string, unknown>, label: string): void {
  const names = new Set<string>();
  for (const [rawName, value] of Object.entries(next)) {
    const name = normalizeEventName(rawName);
    if (!name) throw new TypeError(`snice: ${label} contains an empty event name.`);
    if (names.has(name)) throw new TypeError(`snice: ${label} contains duplicate event name "${name}".`);
    names.add(name);
    const listenerObject = !!value && typeof value === 'object' &&
      typeof (value as EventListenerObject).handleEvent === 'function';
    if (
      value !== nothing && value != null && value !== false &&
      typeof value !== 'function' && !listenerObject
    ) {
      throw new TypeError(`snice: ${label} event "${name}" expects a function, EventListenerObject, or null.`);
    }
  }
}

abstract class SpreadDirective extends Directive {
  protected abstract readonly kind: SpreadKind;
  private values: Record<string, unknown> = {};
  private element: Element | null = null;
  private listeners = new Map<string, { value: unknown; listener: EventListener; options?: AddEventListenerOptions }>();
  private consumedOnce = new Map<string, unknown>();

  render(): unknown {
    return noChange;
  }

  update(part: DirectivePart, args: readonly unknown[]): unknown {
    if (part.type !== 'element' || !part.element) {
      throw new TypeError(`snice: ${this.kind} spread must be used in an element position.`);
    }
    const next = (args[0] ?? {}) as SpreadValues;
    if (typeof next !== 'object' || Array.isArray(next)) {
      throw new TypeError(`snice: ${this.kind} spread expects an object.`);
    }
    this.element = part.element;
    this.apply(part.element, (next || {}) as Record<string, unknown>);
    return noChange;
  }

  disconnected(context?: DirectiveDisconnectContext): void {
    if (this.kind === 'events' && context?.reason !== 'host' && this.element) {
      this.clearListeners(this.element);
    }
  }

  reconnected(): void {
    if (this.element) this.apply(this.element, this.values, true);
  }

  adopted(nodeMap: ReadonlyMap<Node, Node>): void {
    const previous = this.element;
    if (previous && this.kind === 'events') this.clearListeners(previous);
    const adopted = previous ? nodeMap.get(previous) : undefined;
    if (adopted instanceof Element) this.element = adopted;
    // The adopted element has its own property/listener state. Force the
    // post-adoption update to establish every spread entry on that element.
    this.values = {};
  }

  private apply(element: Element, next: Record<string, unknown>, reconnect = false): void {
    if (this.kind === 'events') {
      this.applyEvents(element, next, reconnect);
      this.values = { ...next };
      return;
    }

    if (!reconnect) {
      for (const key of Object.keys(this.values)) {
        if (Object.prototype.hasOwnProperty.call(next, key)) continue;
        if (this.kind === 'properties') (element as any)[key] = undefined;
        else element.removeAttribute(key);
      }
    }

    for (const [key, value] of Object.entries(next)) {
      if (!reconnect && Object.is(this.values[key], value)) continue;
      if (this.kind === 'properties') {
        (element as any)[key] = value === nothing ? undefined : value;
      } else if (value === nothing || value == null || value === false) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value === true ? '' : String(value));
      }
    }
    this.values = { ...next };
  }

  private applyEvents(element: Element, next: Record<string, unknown>, reconnect: boolean): void {
    validateEventSpread(next, `${this.kind} spread`);
    for (const [name, value] of this.consumedOnce) {
      const key = Object.keys(next).find(candidate => normalizeEventName(candidate) === name);
      if (!key || !Object.is(next[key], value)) this.consumedOnce.delete(name);
    }
    if (!reconnect) {
      for (const [name, entry] of this.listeners) {
        const key = Object.keys(this.values).find(k => normalizeEventName(k) === name);
        if (key && Object.prototype.hasOwnProperty.call(next, key) && Object.is(next[key], entry.value)) continue;
        element.removeEventListener(name, entry.listener, entry.options);
        this.listeners.delete(name);
      }
    }

    for (const [rawName, value] of Object.entries(next)) {
      const name = normalizeEventName(rawName);
      if (this.listeners.has(name)) continue;
      const isObject = !!value && typeof value === 'object' &&
        typeof (value as EventListenerObject).handleEvent === 'function';
      if (value === nothing || value == null || value === false) continue;
      if (this.consumedOnce.has(name) && Object.is(this.consumedOnce.get(name), value)) continue;
      this.consumedOnce.delete(name);
      const options = isObject ? value as AddEventListenerOptions : undefined;
      const listener = ((event: Event) => {
        if (options?.once) this.consumedOnce.set(name, value);
        if (isObject) (value as EventListenerObject).handleEvent(event);
        else (value as EventListener).call(findRenderHost(element) || element, event);
      }) as EventListener;
      element.addEventListener(name, listener, options);
      this.listeners.set(name, { value, listener, options });
    }
  }

  private clearListeners(element: Element): void {
    for (const [name, entry] of this.listeners) {
      element.removeEventListener(name, entry.listener, entry.options);
    }
    this.listeners.clear();
  }
}

class PropertiesDirective extends SpreadDirective {
  protected readonly kind = 'properties' as const;
  static renderToString(values: readonly unknown[]): unknown {
    return directiveServerResult('properties', values[0]);
  }
}

class AttributesDirective extends SpreadDirective {
  protected readonly kind = 'attributes' as const;
  static renderToString(values: readonly unknown[]): unknown {
    return directiveServerResult('attributes', values[0]);
  }
}

class EventsDirective extends SpreadDirective {
  protected readonly kind = 'events' as const;
  static renderToString(values: readonly unknown[]): unknown {
    return directiveServerResult('events', values[0]);
  }
}

export const props = directive<PropertiesDirective, readonly [SpreadValues]>(PropertiesDirective);
export const attrs = directive<AttributesDirective, readonly [SpreadValues]>(AttributesDirective);
export const events = directive<EventsDirective, readonly [SpreadValues]>(EventsDirective);

export interface BindOptions<T = unknown> {
  /** DOM event(s) that publish the view value. Inferred for native controls. */
  event?: string | readonly string[];
  /** Convert a DOM value before assigning it to the model. */
  fromView?: (value: unknown, element: Element, event: Event) => T;
  /** Convert a model value before assigning it to the DOM property. */
  toView?: (value: T, element: Element) => unknown;
}

class BindDirective extends Directive {
  static renderToString(values: readonly unknown[], _context: DirectiveServerContext): unknown {
    const target = values[0] as Record<PropertyKey, unknown> | null;
    const key = values[1] as PropertyKey;
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
      throw new TypeError('snice: bind() expects an object target.');
    }
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
      throw new TypeError('snice: bind() expects a string, number, or symbol property key.');
    }
    // DOM-dependent toView transforms run when the client attaches. The raw
    // model value gives form controls useful initial SSR markup and remains
    // deterministic in a DOM-free server environment.
    return target[key];
  }
  private part: DirectivePart | null = null;
  private target: Record<PropertyKey, any> | null = null;
  private key: PropertyKey | null = null;
  private options: BindOptions = {};
  private eventNames: readonly string[] = [];
  private connected = false;
  private composing = false;

  render(): unknown {
    return noChange;
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    if (part.type !== 'property' || !part.element || !part.name) {
      throw new TypeError('snice: bind() must be used in a property binding such as .value=${bind(this, \'value\')}.');
    }

    const target = values[0] as Record<PropertyKey, any>;
    const key = values[1] as PropertyKey;
    const options = (values[2] || {}) as BindOptions;
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
      throw new TypeError('snice: bind() expects an object target.');
    }
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
      throw new TypeError('snice: bind() expects a string, number, or symbol property key.');
    }

    const events = this.resolveEvents(part.element, part.name, options.event);
    const configurationChanged =
      target !== this.target ||
      key !== this.key ||
      options.fromView !== this.options.fromView ||
      options.toView !== this.options.toView ||
      events.length !== this.eventNames.length ||
      events.some((name, index) => name !== this.eventNames[index]);

    if (configurationChanged) this.detach();
    this.part = part;
    this.target = target;
    this.key = key;
    this.options = options;
    this.eventNames = events;

    const modelValue = target[key];
    const viewValue = options.toView
      ? options.toView(modelValue, part.element)
      : modelValue;
    if (!Object.is((part.element as any)[part.name], viewValue)) {
      (part.element as any)[part.name] = viewValue;
    }

    if (part.isConnected && !this.connected) this.attach();
    return noChange;
  }

  disconnected(context?: DirectiveDisconnectContext): void {
    if (context?.reason !== 'host') this.detach();
  }

  reconnected(): void {
    if (!this.connected) this.attach();
  }

  private resolveEvents(element: Element, property: string, configured?: string | readonly string[]): readonly string[] {
    if (configured) return typeof configured === 'string' ? [configured] : configured;
    if (property === 'files' || element.tagName.toLowerCase() === 'select') return ['change'];
    if (property === 'checked') return ['input', 'change'];
    return ['input'];
  }

  private attach(): void {
    if (!this.part?.element || !this.target || this.key === null || this.connected) return;
    for (const event of this.eventNames) this.part.element.addEventListener(event, this.handleViewEvent);
    if (this.part.name === 'value') {
      this.part.element.addEventListener('compositionstart', this.handleCompositionStart);
      this.part.element.addEventListener('compositionend', this.handleCompositionEnd);
    }
    this.connected = true;
  }

  private detach(): void {
    if (!this.part?.element || !this.connected) return;
    for (const event of this.eventNames) this.part.element.removeEventListener(event, this.handleViewEvent);
    this.part.element.removeEventListener('compositionstart', this.handleCompositionStart);
    this.part.element.removeEventListener('compositionend', this.handleCompositionEnd);
    this.connected = false;
    this.composing = false;
  }

  private handleCompositionStart = (): void => {
    this.composing = true;
  };

  private handleCompositionEnd = (event: Event): void => {
    this.composing = false;
    this.publish(event);
  };

  private handleViewEvent = (event: Event): void => {
    if (!this.composing) this.publish(event);
  };

  private publish(event: Event): void {
    if (!this.part?.element || !this.part.name || !this.target || this.key === null) return;
    const raw = (this.part.element as any)[this.part.name];
    const value = this.options.fromView
      ? this.options.fromView(raw, this.part.element, event)
      : raw;
    if (!Object.is(this.target[this.key], value)) this.target[this.key] = value;
  }
}

const bindResult = directive<BindDirective, readonly [Record<PropertyKey, any>, PropertyKey, BindOptions?]>(BindDirective);

export function bind<T extends object, K extends keyof T>(
  target: T,
  key: K,
  options?: BindOptions<T[K]>
): DirectiveResult {
  return bindResult(
    target as Record<PropertyKey, any>,
    key,
    options as BindOptions<any> | undefined
  );
}
