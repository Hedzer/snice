import type { SniceBaseProps } from './types';
/**
 * Props for the RangeSlider component
 */
export interface RangeSliderProps extends SniceBaseProps {
    min?: any;
    max?: any;
    step?: any;
    valueLow?: any;
    valueHigh?: any;
    disabled?: any;
    showTooltip?: any;
    showLabels?: any;
    orientation?: any;
}
/**
 * RangeSlider - React adapter for snice-range-slider
 *
 * This is an auto-generated React wrapper for the Snice range-slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/range-slider';
 * import { RangeSlider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <RangeSlider />;
 * }
 * ```
 */
export declare const RangeSlider: import("react").ForwardRefExoticComponent<Omit<RangeSliderProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=range-slider.d.ts.map