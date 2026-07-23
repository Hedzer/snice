// GENERATED FILE — DO NOT EDIT.
// Source: components/pagination/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Pagination - React adapter for snice-pagination
 *
 * This is an auto-generated React wrapper for the Snice pagination component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pagination/snice-pagination';
 * import { Pagination } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Pagination />;
 * }
 * ```
 */
export const Pagination = createReactAdapter({
    tagName: 'snice-pagination',
    properties: ["current", "total", "siblings", "showFirst", "showLast", "showPrev", "showNext", "size", "variant"],
    events: { "pagination-change": "onPaginationChange" },
    formAssociated: false
});
//# sourceMappingURL=pagination.js.map