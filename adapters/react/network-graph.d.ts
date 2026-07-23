import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the NetworkGraph component
 */
export interface NetworkGraphProps extends SniceBaseProps {
    data?: any;
    layout?: any;
    chargeStrength?: any;
    linkDistance?: any;
    zoomEnabled?: any;
    dragEnabled?: any;
    showLabels?: any;
    animation?: any;
    onNodeClick?: (event: any) => void;
    onEdgeClick?: (event: any) => void;
    onNodeDrag?: (event: any) => void;
    onGraphZoom?: (event: any) => void;
}
/**
 * NetworkGraph - React adapter for snice-network-graph
 *
 * This is an auto-generated React wrapper for the Snice network-graph component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/network-graph/snice-network-graph';
 * import { NetworkGraph } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NetworkGraph />;
 * }
 * ```
 */
export declare const NetworkGraph: SniceReactComponent<NetworkGraphProps, SniceComponentRef>;
//# sourceMappingURL=network-graph.d.ts.map