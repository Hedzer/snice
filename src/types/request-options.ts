export interface RequestOptions extends EventInit {
  /**
   * Timeout for waiting for responses (in ms) - defaults to 5000ms
   */
  timeout?: number;
  /**
   * Timeout for finding a handler (in ms) - defaults to 50ms
   */
  discoveryTimeout?: number;
  /**
   * Debounce the request by specified milliseconds
   */
  debounce?: number;
  /**
   * Throttle the request by specified milliseconds
   */
  throttle?: number;
}