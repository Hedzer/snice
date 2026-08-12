import type { OnScope } from './on-options';
import type { EventTiming } from './event-timing';

export interface DispatchOptions extends EventInit {
  /**
   * Whether to dispatch even if the method returns undefined (default: true)
   */
  dispatchOnUndefined?: boolean;
  /** Debounce by milliseconds or resolve milliseconds from this instance */
  debounce?: EventTiming;
  /** Throttle by milliseconds or resolve milliseconds from this instance */
  throttle?: EventTiming;
  /**
   * Where to dispatch the event. Default is the host element.
   * Use `'global'` to dispatch on `document`, a selector for an ancestor
   * (via `closest()`), a direct EventTarget, or a resolver function.
   */
  scope?: OnScope;
  /** Named daemon from the nearest application context. Mutually exclusive with `scope`. */
  daemon?: string;
}
