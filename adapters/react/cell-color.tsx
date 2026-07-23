// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellColor component
 */
export interface CellColorProps extends SniceBaseProps {
  value?: any;
  color?: any;
  showSwatch?: any;
  showHex?: any;
  showRgb?: any;
  swatchSize?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellColor - React adapter for snice-cell-color
 *
 * This is an auto-generated React wrapper for the Snice cell-color component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-color';
 * import { CellColor } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellColor />;
 * }
 * ```
 */
export const CellColor: SniceReactComponent<CellColorProps, SniceComponentRef> = createReactAdapter<CellColorProps, false>({
  tagName: 'snice-cell-color',
  properties: ["value","color","showSwatch","showHex","showRgb","swatchSize","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
