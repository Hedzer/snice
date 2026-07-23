import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellPercentage component
 */
export interface CellPercentageProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
    decimals?: any;
    showTrend?: any;
    trendValue?: any;
    colorize?: any;
}
/**
 * CellPercentage - React adapter for snice-cell-percentage
 *
 * This is an auto-generated React wrapper for the Snice cell-percentage component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-percentage';
 * import { CellPercentage } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellPercentage />;
 * }
 * ```
 */
export declare const CellPercentage: SniceReactComponent<CellPercentageProps, SniceComponentRef>;
//# sourceMappingURL=cell-percentage.d.ts.map