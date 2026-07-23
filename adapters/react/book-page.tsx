// GENERATED FILE — DO NOT EDIT.
// Source: components/book/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the BookPage component
 */
export interface BookPageProps extends SniceBaseProps {


}

/**
 * BookPage - React adapter for snice-book-page
 *
 * This is an auto-generated React wrapper for the Snice book-page component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/book/snice-book';
 * import { BookPage } from 'snice/react';
 *
 * function MyComponent() {
 *   return <BookPage />;
 * }
 * ```
 */
export const BookPage: SniceReactComponent<BookPageProps, SniceComponentRef> = createReactAdapter<BookPageProps, false>({
  tagName: 'snice-book-page',
  properties: [],
  events: {},
  formAssociated: false
});
