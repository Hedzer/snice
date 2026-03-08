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
export declare const Tree: import("react").ForwardRefExoticComponent<Omit<TreeProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=tree.d.ts.map