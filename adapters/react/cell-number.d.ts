import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellNumber component
 */
export interface CellNumberProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
    decimals?: any;
    thousandsSeparator?: any;
    prefix?: any;
    suffix?: any;
    negativeStyle?: any;
    highlight?: any;
}
/**
 * CellNumber - React adapter for snice-cell-number
 *
 * This is an auto-generated React wrapper for the Snice cell-number component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-number';
 * import { CellNumber } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellNumber />;
 * }
 * ```
 */
export declare const CellNumber: SniceReactComponent<CellNumberProps, SniceComponentRef>;
//# sourceMappingURL=cell-number.d.ts.map