// GENERATED FILE — DO NOT EDIT.
// Source: components/book/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Book component
 */
export interface BookProps extends SniceBaseProps {
  currentPage?: any;
  coverImage?: any;
  title?: any;
  author?: any;
  onPageTurn?: (event: any) => void;
  onPageFlipStart?: (event: any) => void;
  onPageFlipEnd?: (event: any) => void;
}

/**
 * Book - React adapter for snice-book
 *
 * This is an auto-generated React wrapper for the Snice book component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/book/snice-book';
 * import { Book } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Book />;
 * }
 * ```
 */
export const Book: SniceReactComponent<BookProps, SniceComponentRef> = createReactAdapter<BookProps, false>({
  tagName: 'snice-book',
  properties: ["currentPage","coverImage","title","author"],
  events: {"page-turn":"onPageTurn","page-flip-start":"onPageFlipStart","page-flip-end":"onPageFlipEnd"},
  formAssociated: false
});
