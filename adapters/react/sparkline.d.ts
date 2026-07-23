import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
 * import 'snice/components/sparkline/snice-sparkline';
 * import { Sparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sparkline />;
 * }
 * ```
 */
export declare const Sparkline: SniceReactComponent<SparklineProps, SniceComponentRef>;
//# sourceMappingURL=sparkline.d.ts.map