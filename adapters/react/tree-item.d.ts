import { type SniceReactComponent } from './wrapper';
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
    expandOnClick?: any;
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
export declare const TreeItem: SniceReactComponent<TreeItemProps, SniceComponentRef>;
//# sourceMappingURL=tree-item.d.ts.map