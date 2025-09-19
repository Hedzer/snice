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
}