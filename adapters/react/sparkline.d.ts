import type { SniceBaseProps } from './types';
/**
 * Props for the Sparkline component
 */
export interface SparklineProps extends SniceBaseProps {
    data?: any;
    type?: any;
    color?: any;
    customColor?: any;
    width?: any;
    height?: any;
    strokeWidth?: any;
    showDots?: any;
    showArea?: any;
    smooth?: any;
    min?: any;
    max?: any;
}
/**
 * Sparkline - React adapter for snice-sparkline
 *
 * This is an auto-generated React wrapper for the Snice sparkline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sparkline';
 * import { Sparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sparkline />;
 * }
 * ```
 */
export declare const Sparkline: import("react").ForwardRefExoticComponent<Omit<SparklineProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=sparkline.d.ts.map