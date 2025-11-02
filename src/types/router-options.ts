import { Transition } from './transition';
import type { Fetcher } from '../fetcher';

export interface RouterOptions {
  /**
   * The target element selector where the page element will be instantiated.
   * The router will use this selector to find the target element, clear it, and append the page element to it.
   */
  target: string;

  /**
   * Whether to use hash routing or push state routing.
   */
  type: 'hash' | 'pushstate';

  /**
   * Override for the window object to use for routing, defaults to global.
   */
  window?: Window;

  /**
   * Override for the document object to use for routing, defaults to global.
   */
  document?: Document;

  /**
   * Global transition configuration for all pages
   */
  transition?: Transition;

  /**
   * Optional context object passed to guard functions
   */
  context?: any;

  /**
   * Default layout element tag name for all pages
   */
  layout?: string;

  /**
   * Optional fetcher for context-aware HTTP requests with middleware support
   * If not provided, Context.fetch will default to native fetch
   */
  fetcher?: Fetcher;
}