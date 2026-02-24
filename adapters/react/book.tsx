import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Book component
 */
export interface BookProps extends SniceBaseProps {
  currentPage?: any;
  coverImage?: any;
  title?: any;
  author?: any;

}

/**
 * Book - React adapter for snice-book
 *
 * This is an auto-generated React wrapper for the Snice book component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/book';
 * import { Book } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Book />;
 * }
 * ```
 */
export const Book = createReactAdapter<BookProps>({
  tagName: 'snice-book',
  properties: ["currentPage","coverImage","title","author"],
  events: {},
  formAssociated: false
});
