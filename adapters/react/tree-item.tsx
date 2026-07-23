// GENERATED FILE — DO NOT EDIT.
// Source: components/tree/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the TreeItem component
 */
export interface TreeItemProps extends SniceBaseProps {
  expanded?: any;
  selected?: any;
  checked?: any;
  showCheckbox?: any;
  showIcon?: any;
  loading?: any;
  indeterminate?: any;
  onTreeItemToggle?: (event: any) => void;
  onTreeItemSelect?: (event: any) => void;
  onTreeItemCheck?: (event: any) => void;
  onTreeItemLazyLoad?: (event: any) => void;
}

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
export const TreeItem: SniceReactComponent<TreeItemProps, SniceComponentRef> = createReactAdapter<TreeItemProps, false>({
  tagName: 'snice-tree-item',
  properties: ["expanded","selected","checked","showCheckbox","showIcon","loading","indeterminate"],
  events: {"tree-item-toggle":"onTreeItemToggle","tree-item-select":"onTreeItemSelect","tree-item-check":"onTreeItemCheck","tree-item-lazy-load":"onTreeItemLazyLoad"},
  formAssociated: false
});
