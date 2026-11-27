import { nothing } from './template';
import { findRenderHost } from './render-root';
import type { KeyboardFilter } from './keyboard-filter';
import { Part, noChange } from './part-base';

export interface KeyboardFilterTools {
  parse(spec: string): KeyboardFilter;
  match(event: KeyboardEvent, filter: KeyboardFilter): boolean;
  warn(eventSpec: string): void;
}

/**
 * EventPart handles event listener bindings, with optional keyboard shortcut support.
 * Keyboard filter tools are injected only when keyboard shortcuts are used so
 * precompiled apps without keyboard bindings tree-shake `keyboard-filter.ts` out.
 */
export class EventPart extends Part {
  readonly type = 'event' as const;
  element: Element;
  readonly eventName: string;
  private listener: EventListener | null = null;
  private listenerOptions: AddEventListenerOptions | undefined = undefined;
  private value: any = undefined;
  private keyFilter: KeyboardFilter | null = null;
  private keyMatcher: ((event: KeyboardEvent, filter: KeyboardFilter) => boolean) | null = null;
  private host: Element | null = null;
  private modifiers = new Set<string>();
  private once = false;
  private onceConsumed = false;

  constructor(element: Element, eventName: string, keyTools?: KeyboardFilterTools) {
    super();
    this.element = element;

    const [eventSpec, ...modifierSpecs] = eventName.split('|');
    const aliases: Record<string, string> = {
      preventdefault: 'prevent',
      stoppropagation: 'stop',
      stopimmediatepropagation: 'immediate'
    };
    const allowed = new Set(['prevent', 'stop', 'immediate', 'once', 'capture', 'passive', 'self']);
    for (const raw of modifierSpecs) {
      const normalized = aliases[raw.toLowerCase()] || raw.toLowerCase();
      if (!allowed.has(normalized)) {
        throw new Error(
          `snice: unknown event modifier "${raw}" in @${eventName}. ` +
          'Supported modifiers: prevent, stop, immediate, once, capture, passive, self.'
        );
      }
      this.modifiers.add(normalized);
    }
    if (this.modifiers.has('passive') && this.modifiers.has('prevent')) {
      throw new Error(`snice: @${eventName} cannot combine passive and prevent.`);
    }

    const isKeyboardEvent = ['keydown', 'keyup', 'keypress'].includes(eventSpec.split('.')[0].split(':')[0]);
    const dotIndex = isKeyboardEvent ? eventSpec.indexOf('.') : -1;
    const colonIndex = isKeyboardEvent ? eventSpec.indexOf(':') : -1;
    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    if (delimiterIndex > 0 && keyTools) {
      const baseEvent = eventSpec.substring(0, delimiterIndex);
      const keySpec = eventSpec.substring(delimiterIndex + 1);
      this.eventName = baseEvent;
      this.keyFilter = keyTools.parse(keySpec);
      this.keyMatcher = keyTools.match;
    } else {
      this.eventName = eventSpec;
      if (keyTools && (typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
        keyTools.warn(eventSpec);
      }
    }
  }

  commit(value: any): void {
    if (value === noChange) return;

    if (value === nothing) {
      value = null;
    }

    const isListenerObject = !!value &&
      typeof value === 'object' &&
      typeof (value as EventListenerObject).handleEvent === 'function';
    if (
      value !== null && value !== undefined && value !== false &&
      typeof value !== 'function' && !isListenerObject
    ) {
      throw new TypeError(`snice: @${this.eventName} expects a function, EventListenerObject, or null.`);
    }
    if (isListenerObject && this.modifiers.has('prevent') && !!(value as AddEventListenerOptions).passive) {
      throw new Error(`snice: @${this.eventName} cannot combine a passive listener object with prevent.`);
    }

    if (value === this.value && value !== null && value !== undefined) return;

    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener, this.listenerOptions);
      this.listener = null;
      this.listenerOptions = undefined;
    }

    if (value === null || value === undefined || value === false) {
      this.value = value;
      this.onceConsumed = false;
      return;
    }

    this.onceConsumed = false;
    try {
      this.attachListener(value, isListenerObject);
      this.value = value;
    } catch (error) {
      this.value = undefined;
      throw error;
    }
  }

  private attachListener(value: EventListener | (EventListenerObject & AddEventListenerOptions), isListenerObject: boolean): void {
    const keyFilter = this.keyFilter;
    const keyMatcher = this.keyMatcher;
    const listener = ((event: Event) => {
      if (this.modifiers.has('self') && event.target !== this.element) return;
      if (keyFilter && keyMatcher && !keyMatcher(event as KeyboardEvent, keyFilter)) return;
      if (this.once) {
        this.onceConsumed = true;
        this.element.removeEventListener(this.eventName, listener, listenerOptions);
        this.listener = null;
        this.listenerOptions = undefined;
      }
      if (this.modifiers.has('prevent')) event.preventDefault();
      if (this.modifiers.has('immediate')) event.stopImmediatePropagation();
      else if (this.modifiers.has('stop')) event.stopPropagation();
      if (isListenerObject) {
        (value as EventListenerObject).handleEvent(event);
        return;
      }
      if (!this.host) {
        this.host = findRenderHost(this.element);
      }
      (value as EventListener).call(this.host || this.element, event);
    }) as EventListener;

    const valueOptions = isListenerObject ? value as AddEventListenerOptions : {};
    this.once = this.modifiers.has('once') || !!valueOptions.once;
    const listenerOptions: AddEventListenerOptions = {
      capture: this.modifiers.has('capture') || valueOptions.capture,
      passive: this.modifiers.has('passive') || valueOptions.passive,
      signal: valueOptions.signal
    };
    this.element.addEventListener(this.eventName, listener, listenerOptions);
    this.listener = listener;
    this.listenerOptions = listenerOptions;
  }

  clear(): void {
    this.detachListener();
    this.value = undefined;
    this.host = null;
    this.onceConsumed = false;
  }

  private detachListener(): void {
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener, this.listenerOptions);
      this.listener = null;
      this.listenerOptions = undefined;
    }
  }

  disconnected(preserveEventListeners = false): void {
    if (!preserveEventListeners) this.detachListener();
    this.host = null;
  }

  reconnected(): void {
    if (!this.listener && !this.onceConsumed && this.value != null && this.value !== false) {
      const isListenerObject = typeof this.value === 'object';
      this.attachListener(this.value, isListenerObject);
    }
  }
}

/** @internal Tree-shakeable compiled-template factory for EventPart without keyboard-filter */
export function __pEvent(node: Node, eventName: string): EventPart {
  return new EventPart(node as Element, eventName);
}
