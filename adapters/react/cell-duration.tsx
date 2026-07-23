// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellDuration component
 */
export interface CellDurationProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;

}

/**
 * CellDuration - React adapter for snice-cell-duration
 *
 * This is an auto-generated React wrapper for the Snice cell-duration component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-duration';
 * import { CellDuration } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellDuration />;
 * }
 * ```
 */
export const CellDuration: SniceReactComponent<CellDurationProps, SniceComponentRef> = createReactAdapter<CellDurationProps, false>({
  tagName: 'snice-cell-duration',
  properties: ["align","type","value","column","rowData"],
  events: {},
  formAssociated: false
});
