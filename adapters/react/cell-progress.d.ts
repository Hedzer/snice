import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellProgress component
 */
export interface CellProgressProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
}
/**
 * CellProgress - React adapter for snice-cell-progress
 *
 * This is an auto-generated React wrapper for the Snice cell-progress component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-progress';
 * import { CellProgress } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellProgress />;
 * }
 * ```
 */
export declare const CellProgress: SniceReactComponent<CellProgressProps, SniceComponentRef>;
//# sourceMappingURL=cell-progress.d.ts.map