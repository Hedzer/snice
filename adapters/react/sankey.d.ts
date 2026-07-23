import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    onSankeyNodeClick?: (event: any) => void;
    onSankeyLinkClick?: (event: any) => void;
    onSankeyHover?: (event: any) => void;
}
/**
 * Sankey - React adapter for snice-sankey
 *
 * This is an auto-generated React wrapper for the Snice sankey component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sankey/snice-sankey';
 * import { Sankey } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sankey />;
 * }
 * ```
 */
export declare const Sankey: SniceReactComponent<SankeyProps, SniceComponentRef>;
//# sourceMappingURL=sankey.d.ts.map