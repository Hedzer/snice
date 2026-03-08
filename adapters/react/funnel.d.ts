import type { SniceBaseProps } from './types';
/**
 * Props for the Funnel component
 */
export interface FunnelProps extends SniceBaseProps {
    data?: any;
    variant?: any;
    orientation?: any;
    showLabels?: any;
    showValues?: any;
    showPercentages?: any;
    animation?: any;
}
/**
 * Funnel - React adapter for snice-funnel
 *
 * This is an auto-generated React wrapper for the Snice funnel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/funnel';
 * import { Funnel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Funnel />;
 * }
 * ```
 */
export declare const Funnel: import("react").ForwardRefExoticComponent<Omit<FunnelProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=funnel.d.ts.map