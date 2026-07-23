import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Flow component
 */
export interface FlowProps extends SniceBaseProps {
    nodes?: any;
    edges?: any;
    snapToGrid?: any;
    gridSize?: any;
    zoomEnabled?: any;
    panEnabled?: any;
    minimap?: any;
    editable?: any;
    onNodeDrag?: (event: any) => void;
    onNodeSelect?: (event: any) => void;
    onEdgeConnect?: (event: any) => void;
    onEdgeDisconnect?: (event: any) => void;
    onCanvasClick?: (event: any) => void;
}
/**
 * Flow - React adapter for snice-flow
 *
 * This is an auto-generated React wrapper for the Snice flow component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/flow/snice-flow';
 * import { Flow } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Flow />;
 * }
 * ```
 */
export declare const Flow: SniceReactComponent<FlowProps, SniceComponentRef>;
//# sourceMappingURL=flow.d.ts.map