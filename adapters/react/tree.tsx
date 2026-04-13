import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Tree component
 */
export interface TreeProps extends SniceBaseProps {
  selectable?: any;
  selectionMode?: any;
  showCheckboxes?: any;
  showIcons?: any;
  expandOnClick?: any;
  nodes?: any;
  selectedNodes?: any;
  checkedNodes?: any;
  onTreeNodeExpand?: (event: any) => void;
  onTreeNodeCollapse?: (event: any) => void;
  onTreeNodeSelect?: (event: any) => void;
  onTreeNodeCheck?: (event: any) => void;
  onTreeNodeLazyLoad?: (event: any) => void;
}

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
export const Tree = createReactAdapter<TreeProps>({
  tagName: 'snice-tree',
  properties: ["selectable","selectionMode","showCheckboxes","showIcons","expandOnClick","nodes","selectedNodes","checkedNodes"],
  events: {"tree-node-expand":"onTreeNodeExpand","tree-node-collapse":"onTreeNodeCollapse","tree-node-select":"onTreeNodeSelect","tree-node-check":"onTreeNodeCheck","tree-node-lazy-load":"onTreeNodeLazyLoad"},
  formAssociated: false
});
