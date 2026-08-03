export interface RespondOptions {
  /** Named daemon from the nearest application context. */
  daemon?: string;
  /**
   * Debounce the response by specified milliseconds
   */
  debounce?: number;
  /**
   * Throttle the response by specified milliseconds
   */
  throttle?: number;
}
