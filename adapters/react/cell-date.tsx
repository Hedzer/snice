// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellDate component
 */
export interface CellDateProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;
  dateFormat?: any;
  customFormat?: any;
  locale?: any;
  relativeTime?: any;
  showTime?: any;

}

/**
 * CellDate - React adapter for snice-cell-date
 *
 * This is an auto-generated React wrapper for the Snice cell-date component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-date';
 * import { CellDate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellDate />;
 * }
 * ```
 */
export const CellDate: SniceReactComponent<CellDateProps, SniceComponentRef> = createReactAdapter<CellDateProps, false>({
  tagName: 'snice-cell-date',
  properties: ["align","type","value","column","rowData","dateFormat","customFormat","locale","relativeTime","showTime"],
  events: {},
  formAssociated: false
});
