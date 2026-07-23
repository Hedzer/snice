import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Waterfall component
 */
export interface WaterfallProps extends SniceBaseProps {
    data?: any;
    orientation?: any;
    showValues?: any;
    showConnectors?: any;
    animated?: any;
    onBarClick?: (event: any) => void;
    onBarHover?: (event: any) => void;
}
/**
 * Waterfall - React adapter for snice-waterfall
 *
 * This is an auto-generated React wrapper for the Snice waterfall component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/waterfall/snice-waterfall';
 * import { Waterfall } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Waterfall />;
 * }
 * ```
 */
export declare const Waterfall: SniceReactComponent<WaterfallProps, SniceComponentRef>;
//# sourceMappingURL=waterfall.d.ts.map