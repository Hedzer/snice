export interface ObserveOptions {
  /** For IntersectionObserver: threshold of visibility */
  threshold?: number | number[];
  /** For IntersectionObserver: margin around root */
  rootMargin?: string;
  /** For IntersectionObserver: root element (defaults to viewport) */
  root?: Element | null;
  /** For ResizeObserver: which box model to observe */
  box?: 'content-box' | 'border-box';
  /** Throttle the callback by specified milliseconds */
  throttle?: number;
  /** For MutationObserver: observe subtree (use with caution) */
  subtree?: boolean;
  /** Maximum depth for subtree observation (safety limit) */
  maxDepth?: number;
}