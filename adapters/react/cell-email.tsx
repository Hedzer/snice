// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellEmail component
 */
export interface CellEmailProps extends SniceBaseProps {
  value?: any;
  email?: any;
  displayText?: any;
  showIcon?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellEmail - React adapter for snice-cell-email
 *
 * This is an auto-generated React wrapper for the Snice cell-email component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-email';
 * import { CellEmail } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellEmail />;
 * }
 * ```
 */
export const CellEmail: SniceReactComponent<CellEmailProps, SniceComponentRef> = createReactAdapter<CellEmailProps, false>({
  tagName: 'snice-cell-email',
  properties: ["value","email","displayText","showIcon","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
