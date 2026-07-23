// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellStatus component
 */
export interface CellStatusProps extends SniceBaseProps {
  value?: any;
  status?: any;
  label?: any;
  showDot?: any;
  variant?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellStatus - React adapter for snice-cell-status
 *
 * This is an auto-generated React wrapper for the Snice cell-status component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-status';
 * import { CellStatus } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellStatus />;
 * }
 * ```
 */
export const CellStatus: SniceReactComponent<CellStatusProps, SniceComponentRef> = createReactAdapter<CellStatusProps, false>({
  tagName: 'snice-cell-status',
  properties: ["value","status","label","showDot","variant","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
