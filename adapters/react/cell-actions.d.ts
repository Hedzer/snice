import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellActions component
 */
export interface CellActionsProps extends SniceBaseProps {
    actions?: any;
    column?: any;
    rowData?: any;
    value?: any;
    align?: any;
    type?: any;
    onCellAction?: (event: any) => void;
}
/**
 * CellActions - React adapter for snice-cell-actions
 *
 * This is an auto-generated React wrapper for the Snice cell-actions component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-actions';
 * import { CellActions } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellActions />;
 * }
 * ```
 */
export declare const CellActions: SniceReactComponent<CellActionsProps, SniceComponentRef>;
//# sourceMappingURL=cell-actions.d.ts.map