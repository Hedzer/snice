import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    onCandleClick?: (event: any) => void;
    onCandleHover?: (event: any) => void;
    onCrosshairMove?: (event: any) => void;
}
/**
 * Candlestick - React adapter for snice-candlestick
 *
 * This is an auto-generated React wrapper for the Snice candlestick component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/candlestick/snice-candlestick';
 * import { Candlestick } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Candlestick />;
 * }
 * ```
 */
export declare const Candlestick: SniceReactComponent<CandlestickProps, SniceComponentRef>;
//# sourceMappingURL=candlestick.d.ts.map