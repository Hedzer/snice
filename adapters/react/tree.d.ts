import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
 * import 'snice/components/tree/snice-tree';
 * import { Tree } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tree />;
 * }
 * ```
 */
export declare const Tree: SniceReactComponent<TreeProps, SniceComponentRef>;
//# sourceMappingURL=tree.d.ts.map