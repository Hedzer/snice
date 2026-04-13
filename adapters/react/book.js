import { createReactAdapter } from './wrapper';
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
export const Book = createReactAdapter({
    tagName: 'snice-book',
    properties: ["currentPage", "coverImage", "title", "author"],
    events: { "page-turn": "onPageTurn", "page-flip-start": "onPageFlipStart", "page-flip-end": "onPageFlipEnd" },
    formAssociated: false
});
//# sourceMappingURL=book.js.map