// GENERATED FILE — DO NOT EDIT.
// Source: components/tree/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * TreeItem - React adapter for snice-tree-item
 *
 * This is an auto-generated React wrapper for the Snice tree-item component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tree/snice-tree-item';
 * import { TreeItem } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TreeItem />;
 * }
 * ```
 */
export const TreeItem = createReactAdapter({
    tagName: 'snice-tree-item',
    properties: ["expanded", "selected", "checked", "showCheckbox", "showIcon", "expandOnClick", "loading", "indeterminate"],
    events: { "tree-item-toggle": "onTreeItemToggle", "tree-item-select": "onTreeItemSelect", "tree-item-check": "onTreeItemCheck", "tree-item-lazy-load": "onTreeItemLazyLoad" },
    formAssociated: false
});
//# sourceMappingURL=tree-item.js.map