import { nothing } from './template';
import { findRenderHost } from './render-root';
import {
  Part,
  noChange,
  commitPropertyValue,
  flushPreUpgradePropertyBindings,
  type PropertyBindingRegistry,
  type CompiledPartContext,
} from './part-base';

type SpreadListener = {
  value: unknown;
  listener: EventListener;
  options?: AddEventListenerOptions;
};

function validateSpreadEvents(next: Record<string, unknown>, label: string): void {
  const names = new Set<string>();
  for (const [rawName, value] of Object.entries(next)) {
    const name = rawName.startsWith('@') ? rawName.slice(1) : rawName;
    if (!name) throw new TypeError(`snice: ${label} contains an empty event name.`);
    if (names.has(name)) {
      throw new TypeError(`snice: ${label} contains duplicate event name "${name}".`);
    }
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

/** Named spreads: ...props, ...attrs, and ...events. */
export class SpreadPart extends Part {
  readonly type = 'spread' as const;
  element: Element;
  readonly name: string;
  private committed: Record<string, unknown> = {};
  private listeners = new Map<string, SpreadListener>();
  private consumedOnce = new Map<string, unknown>();
  readonly #customElementRegistry: PropertyBindingRegistry | null;

  constructor(
    element: Element,
    name: string,
    customElementRegistry: PropertyBindingRegistry | null = null
  ) {
    super();
    this.element = element;
    this.name = name;
    this.#customElementRegistry = customElementRegistry;
  }

  commit(value: unknown): void {
    if (value === noChange) return;
    if (value === nothing || value == null) value = {};
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`snice: ...${this.name} expects an object.`);
    }
    const next = value as Record<string, unknown>;
    if (this.name === 'events') this.commitEvents(next);
    else if (this.name === 'props' || this.name === 'properties') this.commitProperties(next);
    else this.commitAttributes(next);
    this.committed = { ...next };
  }

  private commitProperties(next: Record<string, unknown>): void {
    for (const key of Object.keys(this.committed)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) {
        commitPropertyValue(this.element, key, undefined, this.#customElementRegistry);
      }
    }
    for (const [key, value] of Object.entries(next)) {
      if (Object.is(this.committed[key], value)) continue;
      commitPropertyValue(
        this.element,
        key,
        value === nothing ? undefined : value,
        this.#customElementRegistry
      );
    }
  }

  private commitAttributes(next: Record<string, unknown>): void {
    for (const key of Object.keys(this.committed)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) this.element.removeAttribute(key);
    }
    for (const [key, value] of Object.entries(next)) {
      if (Object.is(this.committed[key], value)) continue;
      if (value === nothing || value == null || value === false) this.element.removeAttribute(key);
      else this.element.setAttribute(key, value === true ? '' : String(value));
    }
  }

  private commitEvents(next: Record<string, unknown>): void {
    validateSpreadEvents(next, `...${this.name}`);
    for (const [name, value] of this.consumedOnce) {
      const rawName = Object.keys(next).find(key => this.eventName(key) === name);
      if (!rawName || !Object.is(next[rawName], value)) this.consumedOnce.delete(name);
    }
    for (const [name, entry] of this.listeners) {
      const rawName = Object.keys(next).find(key => this.eventName(key) === name);
      if (rawName && Object.is(next[rawName], entry.value)) continue;
      this.element.removeEventListener(name, entry.listener, entry.options);
      this.listeners.delete(name);
    }

    for (const [rawName, value] of Object.entries(next)) {
      const name = this.eventName(rawName);
      if (this.listeners.has(name)) continue;
      const listenerObject = !!value && typeof value === 'object' &&
        typeof (value as EventListenerObject).handleEvent === 'function';
      if (value === nothing || value == null || value === false) continue;
      if (this.consumedOnce.has(name) && Object.is(this.consumedOnce.get(name), value)) continue;
      this.consumedOnce.delete(name);
      const options = listenerObject ? value as AddEventListenerOptions : undefined;
      const listener = ((event: Event) => {
        if (options?.once) this.consumedOnce.set(name, value);
        if (listenerObject) (value as EventListenerObject).handleEvent(event);
        else (value as EventListener).call(this.resolveHost(), event);
      }) as EventListener;
      this.element.addEventListener(name, listener, options);
      this.listeners.set(name, { value, listener, options });
    }
  }

  private eventName(name: string): string {
    return name.startsWith('@') ? name.slice(1) : name;
  }

  private resolveHost(): Element | null {
    return findRenderHost(this.element) || this.element;
  }

  clear(): void {
    if (this.name === 'events') {
      for (const [name, entry] of this.listeners) {
        this.element.removeEventListener(name, entry.listener, entry.options);
      }
      this.listeners.clear();
      this.consumedOnce.clear();
    } else if (this.name !== 'props' && this.name !== 'properties') {
      for (const key of Object.keys(this.committed)) this.element.removeAttribute(key);
    }
    this.committed = {};
  }

  disconnected(preserveEventListeners = false): void {
    if (this.name === 'events' && !preserveEventListeners) this.detachListeners();
  }

  reconnected(): void {
    if (this.name === 'props' || this.name === 'properties') {
      flushPreUpgradePropertyBindings(this.element, this.#customElementRegistry);
    }
    if (this.name === 'events' && this.listeners.size === 0) this.commitEvents(this.committed);
  }

  private detachListeners(): void {
    for (const [name, entry] of this.listeners) {
      this.element.removeEventListener(name, entry.listener, entry.options);
    }
    this.listeners.clear();
  }
}

/** @internal Tree-shakeable compiled-template factory for SpreadPart */
export function __pSpread(
  node: Node,
  name: string,
  _b: unknown,
  ctx: CompiledPartContext
): SpreadPart {
  return new SpreadPart(node as Element, name, ctx.customElementRegistry);
}
