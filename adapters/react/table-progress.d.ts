import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the TableProgress component
 */
export interface TableProgressProps extends SniceBaseProps {
    value?: any;
    max?: any;
    color?: any;
    backgroundColor?: any;
    height?: any;
    showPercentage?: any;
}
/**
 * TableProgress - React adapter for snice-table-progress
 *
 * This is an auto-generated React wrapper for the Snice table-progress component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-progress';
 * import { TableProgress } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TableProgress />;
 * }
 * ```
 */
export declare const TableProgress: SniceReactComponent<TableProgressProps, SniceComponentRef>;
//# sourceMappingURL=table-progress.d.ts.map