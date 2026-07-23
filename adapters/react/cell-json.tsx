// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellJson component
 */
export interface CellJsonProps extends SniceBaseProps {
  value?: any;
  collapsed?: any;
  maxDepth?: any;
  showToggle?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellJson - React adapter for snice-cell-json
 *
 * This is an auto-generated React wrapper for the Snice cell-json component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-json';
 * import { CellJson } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellJson />;
 * }
 * ```
 */
export const CellJson: SniceReactComponent<CellJsonProps, SniceComponentRef> = createReactAdapter<CellJsonProps, false>({
  tagName: 'snice-cell-json',
  properties: ["value","collapsed","maxDepth","showToggle","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
