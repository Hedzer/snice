import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellCurrency component
 */
export interface CellCurrencyProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
    decimals?: any;
    thousandsSeparator?: any;
    currency?: any;
    currencyDisplay?: any;
    locale?: any;
    negativeStyle?: any;
    highlight?: any;
}
/**
 * CellCurrency - React adapter for snice-cell-currency
 *
 * This is an auto-generated React wrapper for the Snice cell-currency component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-currency';
 * import { CellCurrency } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellCurrency />;
 * }
 * ```
 */
export declare const CellCurrency: SniceReactComponent<CellCurrencyProps, SniceComponentRef>;
//# sourceMappingURL=cell-currency.d.ts.map