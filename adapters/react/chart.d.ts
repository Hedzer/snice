import type { SniceBaseProps } from './types';
/**
 * Props for the Chart component
 */
export interface ChartProps extends SniceBaseProps {
    type?: any;
    datasets?: any;
    labels?: any;
    options?: any;
    width?: any;
    height?: any;
    renderTrigger?: any;
    tooltipVisible?: any;
    tooltipContent?: any;
    tooltipX?: any;
    tooltipY?: any;
}
/**
 * Chart - React adapter for snice-chart
 *
 * This is an auto-generated React wrapper for the Snice chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chart';
 * import { Chart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chart />;
 * }
 * ```
 */
export declare const Chart: import("react").ForwardRefExoticComponent<Omit<ChartProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=chart.d.ts.map