// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellProgress component
 */
export interface CellProgressProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;

}

/**
 * CellProgress - React adapter for snice-cell-progress
 *
 * This is an auto-generated React wrapper for the Snice cell-progress component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-progress';
 * import { CellProgress } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellProgress />;
 * }
 * ```
 */
export const CellProgress: SniceReactComponent<CellProgressProps, SniceComponentRef> = createReactAdapter<CellProgressProps, false>({
  tagName: 'snice-cell-progress',
  properties: ["align","type","value","column","rowData"],
  events: {},
  formAssociated: false
});
