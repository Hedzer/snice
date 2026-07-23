// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const CellBoolean: SniceReactComponent<CellBooleanProps, SniceComponentRef> = createReactAdapter<CellBooleanProps, false>({
  tagName: 'snice-cell-boolean',
  properties: ["align","type","value","column","rowData","trueValue","falseValue","useSymbols","trueSymbol","falseSymbol"],
  events: {},
  formAssociated: false
});
