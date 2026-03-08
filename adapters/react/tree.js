import { createReactAdapter } from './wrapper';
/**
 * Tree - React adapter for snice-tree
 *
 * This is an auto-generated React wrapper for the Snice tree component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tree';
 * import { Tree } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tree />;
 * }
 * ```
 */
export const Tree = createReactAdapter({
    tagName: 'snice-tree',
    properties: ["selectable", "selectionMode", "showCheckboxes", "showIcons", "expandOnClick", "nodes", "selectedNodes", "checkedNodes"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=tree.js.map