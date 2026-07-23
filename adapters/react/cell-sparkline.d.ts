import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellSparkline component
 */
export interface CellSparklineProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
    chartType?: any;
    color?: any;
    width?: any;
    height?: any;
    showDots?: any;
    showBaseline?: any;
    strokeWidth?: any;
    minValue?: any;
    maxValue?: any;
    data?: any;
}
/**
 * CellSparkline - React adapter for snice-cell-sparkline
 *
 * This is an auto-generated React wrapper for the Snice cell-sparkline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-sparkline';
 * import { CellSparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellSparkline />;
 * }
 * ```
 */
export declare const CellSparkline: SniceReactComponent<CellSparklineProps, SniceComponentRef>;
//# sourceMappingURL=cell-sparkline.d.ts.map