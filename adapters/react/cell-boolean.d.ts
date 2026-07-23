import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellBoolean component
 */
export interface CellBooleanProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
    trueValue?: any;
    falseValue?: any;
    useSymbols?: any;
    trueSymbol?: any;
    falseSymbol?: any;
}
/**
 * CellBoolean - React adapter for snice-cell-boolean
 *
 * This is an auto-generated React wrapper for the Snice cell-boolean component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-boolean';
 * import { CellBoolean } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellBoolean />;
 * }
 * ```
 */
export declare const CellBoolean: SniceReactComponent<CellBooleanProps, SniceComponentRef>;
//# sourceMappingURL=cell-boolean.d.ts.map