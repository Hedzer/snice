export interface RequestOptions extends EventInit {
  /**
   * Timeout for waiting for responses (in ms) - defaults to 120000ms (2 minutes)
   */
  timeout?: number;
  /**
   * Timeout for finding a handler (in ms) - defaults to 50ms
   */
  discoveryTimeout?: number;
  /**
   * When true, an unhandled request is not an error: the awaited yield
   * resolves undefined instead of throwing. Response timeouts still throw.
   */
  optional?: boolean;
  /**
   * Debounce the request by specified milliseconds
   */
  debounce?: number;
  /**
   * Throttle the request by specified milliseconds
   */
  throttle?: number;
}