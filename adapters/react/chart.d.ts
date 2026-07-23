import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
}
/**
 * Chart - React adapter for snice-chart
 *
 * This is an auto-generated React wrapper for the Snice chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chart/snice-chart';
 * import { Chart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chart />;
 * }
 * ```
 */
export declare const Chart: SniceReactComponent<ChartProps, SniceComponentRef>;
//# sourceMappingURL=chart.d.ts.map