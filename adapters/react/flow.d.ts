import type { SniceBaseProps } from './types';
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
}
/**
 * Flow - React adapter for snice-flow
 *
 * This is an auto-generated React wrapper for the Snice flow component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/flow';
 * import { Flow } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Flow />;
 * }
 * ```
 */
export declare const Flow: import("react").ForwardRefExoticComponent<Omit<FlowProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=flow.d.ts.map