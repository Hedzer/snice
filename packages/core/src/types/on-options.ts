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
  /** Debounce the handler by specified milliseconds */
  debounce?: number;
  /** Throttle the handler by specified milliseconds */
  throttle?: number;
  /** CSS selector to target specific elements within shadow root */
  target?: string;
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
