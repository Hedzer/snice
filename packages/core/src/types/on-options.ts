import type { EventTiming } from './event-timing';

/**
 * Resolver for the EventTarget where the listener is attached.
 * - `'global'`: attach to `document` (cross-cutting events)
 * - string: treated as a CSS selector for `host.closest(selector)` (nearest ancestor)
 * - `Element` / `EventTarget`: attached directly to that node
 * - `() => Element | EventTarget | null`: called at connect time; null skips
 */
export type OnScope =
  | 'global'
  | string
  | EventTarget
  | ((this: HTMLElement) => EventTarget | null);

export interface OnOptions {
  /** Use capture phase instead of bubble phase */
  capture?: boolean;
  /** Remove listener after first trigger */
  once?: boolean;
  /** Passive listener (can't preventDefault) */
  passive?: boolean;
  /** Automatically call preventDefault on the event */
  preventDefault?: boolean;
  /** Automatically call stopPropagation on the event */
  stopPropagation?: boolean;
  /** Debounce by milliseconds or resolve milliseconds from this instance */
  debounce?: EventTiming;
  /** Throttle by milliseconds or resolve milliseconds from this instance */
  throttle?: EventTiming;
  /** CSS selector for event delegation; equivalent to the positional selector argument */
  target?: string;
  /**
   * Listen in the light DOM (the host element and its light-DOM children).
   * Same tree toggle as @query. Defaults to true; combine with `shadow` to
   * pick light, shadow, or both. Ignored when `scope`/`daemon` is set.
   */
  light?: boolean;
  /**
   * Listen in the shadow tree (the component's shadow root).
   * Same tree toggle as @query. Defaults to true; combine with `light` to
   * pick light, shadow, or both. Ignored when `scope`/`daemon` is set.
   */
  shadow?: boolean;
  /**
   * Where to attach the listener. Default is the host element.
   * Use `'global'` for document-wide events, a selector for an ancestor
   * (via `closest()`), a direct EventTarget, or a resolver function.
   */
  scope?: OnScope;
  /**
   * Named daemon from the nearest application context. Mutually exclusive
   * with `scope`; daemon listeners do not support DOM selector delegation.
   */
  daemon?: string;
}
