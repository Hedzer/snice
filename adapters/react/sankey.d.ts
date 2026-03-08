import type { SniceBaseProps } from './types';
/**
 * Props for the Sankey component
 */
export interface SankeyProps extends SniceBaseProps {
    data?: any;
    nodeWidth?: any;
    nodePadding?: any;
    alignment?: any;
    showLabels?: any;
    showValues?: any;
    animation?: any;
}
/**
 * Sankey - React adapter for snice-sankey
 *
 * This is an auto-generated React wrapper for the Snice sankey component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sankey';
 * import { Sankey } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sankey />;
 * }
 * ```
 */
export declare const Sankey: import("react").ForwardRefExoticComponent<Omit<SankeyProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=sankey.d.ts.map