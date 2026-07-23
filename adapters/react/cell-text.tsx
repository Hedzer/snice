// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellText component
 */
export interface CellTextProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;
  multiline?: any;
  maxLines?: any;

}

/**
 * CellText - React adapter for snice-cell-text
 *
 * This is an auto-generated React wrapper for the Snice cell-text component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-text';
 * import { CellText } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellText />;
 * }
 * ```
 */
export const CellText: SniceReactComponent<CellTextProps, SniceComponentRef> = createReactAdapter<CellTextProps, false>({
  tagName: 'snice-cell-text',
  properties: ["align","type","value","column","rowData","multiline","maxLines"],
  events: {},
  formAssociated: false
});
