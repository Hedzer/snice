import type { SniceBaseProps } from './types';
/**
 * Props for the Waterfall component
 */
export interface WaterfallProps extends SniceBaseProps {
    data?: any;
    orientation?: any;
    showValues?: any;
    showConnectors?: any;
    animated?: any;
}
/**
 * Waterfall - React adapter for snice-waterfall
 *
 * This is an auto-generated React wrapper for the Snice waterfall component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/waterfall';
 * import { Waterfall } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Waterfall />;
 * }
 * ```
 */
export declare const Waterfall: import("react").ForwardRefExoticComponent<Omit<WaterfallProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=waterfall.d.ts.map