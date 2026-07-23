// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const CellCurrency: SniceReactComponent<CellCurrencyProps, SniceComponentRef> = createReactAdapter<CellCurrencyProps, false>({
  tagName: 'snice-cell-currency',
  properties: ["align","type","value","column","rowData","decimals","thousandsSeparator","currency","currencyDisplay","locale","negativeStyle","highlight"],
  events: {},
  formAssociated: false
});
