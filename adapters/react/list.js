import { createReactAdapter } from './wrapper';
/**
 * List - React adapter for snice-list
 *
 * This is an auto-generated React wrapper for the Snice list component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/list';
 * import { List } from 'snice/react';
 *
 * function MyComponent() {
 *   return <List />;
 * }
 * ```
 */
export const List = createReactAdapter({
    tagName: 'snice-list',
    properties: ["dividers", "searchable", "search", "infinite", "loading", "noResults", "threshold", "skeletonCount"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=list.js.map