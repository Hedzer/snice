import type { OnScope } from './on-options';

export interface DispatchOptions extends EventInit {
  /**
   * Whether to dispatch even if the method returns undefined (default: true)
   */
  dispatchOnUndefined?: boolean;
  /** Debounce the dispatch by specified milliseconds */
  debounce?: number;
  /** Throttle the dispatch by specified milliseconds */
  throttle?: number;
  /**
   * Where to dispatch the event. Default is the host element.
   * Use `'global'` to dispatch on `document`, a selector for an ancestor
   * (via `closest()`), a direct EventTarget, or a resolver function.
   */
  scope?: OnScope;
  /** Named daemon from the nearest application context. Mutually exclusive with `scope`. */
  daemon?: string;
}
