// GENERATED FILE — DO NOT EDIT.
// Source: components/spreadsheet/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Spreadsheet component
 */
export interface SpreadsheetProps extends SniceBaseProps {
  data?: any;
  columns?: any;
  readonly?: any;
  onCellChange?: (event: any) => void;
  onCellSelect?: (event: any) => void;
  onRowSelect?: (event: any) => void;
  onColumnSort?: (event: any) => void;
}

/**
 * Spreadsheet - React adapter for snice-spreadsheet
 *
 * This is an auto-generated React wrapper for the Snice spreadsheet component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spreadsheet';
 * import { Spreadsheet } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spreadsheet />;
 * }
 * ```
 */
export const Spreadsheet = createReactAdapter<SpreadsheetProps>({
  tagName: 'snice-spreadsheet',
  properties: ["data","columns","readonly"],
  events: {"cell-change":"onCellChange","cell-select":"onCellSelect","row-select":"onRowSelect","column-sort":"onColumnSort"},
  formAssociated: false
});
