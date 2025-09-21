export interface DispatchOptions extends EventInit {
  /**
   * Whether to dispatch even if the method returns undefined (default: true)
   */
  dispatchOnUndefined?: boolean;
  /** Debounce the dispatch by specified milliseconds */
  debounce?: number;
  /** Throttle the dispatch by specified milliseconds */
  throttle?: number;
}