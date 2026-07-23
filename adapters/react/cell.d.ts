import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Cell component
 */
export interface CellProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
}
/**
 * Cell - React adapter for snice-cell
 *
 * This is an auto-generated React wrapper for the Snice cell component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell';
 * import { Cell } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Cell />;
 * }
 * ```
 */
export declare const Cell: SniceReactComponent<CellProps, SniceComponentRef>;
//# sourceMappingURL=cell.d.ts.map