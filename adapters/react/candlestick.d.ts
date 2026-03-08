import type { SniceBaseProps } from './types';
/**
 * Props for the Candlestick component
 */
export interface CandlestickProps extends SniceBaseProps {
    data?: any;
    showVolume?: any;
    showGrid?: any;
    showCrosshair?: any;
    bullishColor?: any;
    bearishColor?: any;
    timeFormat?: any;
    yAxisFormat?: any;
    zoomEnabled?: any;
    animation?: any;
}
/**
 * Candlestick - React adapter for snice-candlestick
 *
 * This is an auto-generated React wrapper for the Snice candlestick component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/candlestick';
 * import { Candlestick } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Candlestick />;
 * }
 * ```
 */
export declare const Candlestick: import("react").ForwardRefExoticComponent<Omit<CandlestickProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=candlestick.d.ts.map