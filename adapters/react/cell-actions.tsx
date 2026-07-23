// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellActions component
 */
export interface CellActionsProps extends SniceBaseProps {
  actions?: any;
  column?: any;
  rowData?: any;
  value?: any;
  align?: any;
  type?: any;
  onCellAction?: (event: any) => void;
}

/**
 * CellActions - React adapter for snice-cell-actions
 *
 * This is an auto-generated React wrapper for the Snice cell-actions component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-actions';
 * import { CellActions } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellActions />;
 * }
 * ```
 */
export const CellActions: SniceReactComponent<CellActionsProps, SniceComponentRef> = createReactAdapter<CellActionsProps, false>({
  tagName: 'snice-cell-actions',
  properties: ["actions","column","rowData","value","align","type"],
  events: {"cell-action":"onCellAction"},
  formAssociated: false
});
