import type { SniceBaseProps } from './types';
/**
 * Props for the MetricTable component
 */
export interface MetricTableProps extends SniceBaseProps {
    columns?: any;
    data?: any;
    sortBy?: any;
    sortDirection?: any;
}
/**
 * MetricTable - React adapter for snice-metric-table
 *
 * This is an auto-generated React wrapper for the Snice metric-table component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/metric-table';
 * import { MetricTable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MetricTable />;
 * }
 * ```
 */
export declare const MetricTable: import("react").ForwardRefExoticComponent<Omit<MetricTableProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=metric-table.d.ts.map