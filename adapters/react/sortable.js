import { createReactAdapter } from './wrapper';
/**
 * Sortable - React adapter for snice-sortable
 *
 * This is an auto-generated React wrapper for the Snice sortable component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sortable';
 * import { Sortable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sortable />;
 * }
 * ```
 */
export const Sortable = createReactAdapter({
    tagName: 'snice-sortable',
    properties: ["direction", "handle", "disabled", "group"],
    events: { "sort-start": "onSortStart", "sort-end": "onSortEnd", "sort-change": "onSortChange" },
    formAssociated: false
});
//# sourceMappingURL=sortable.js.map