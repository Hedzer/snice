// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellPhone component
 */
export interface CellPhoneProps extends SniceBaseProps {
  value?: any;
  phone?: any;
  displayText?: any;
  showIcon?: any;
  format?: any;
  country?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellPhone - React adapter for snice-cell-phone
 *
 * This is an auto-generated React wrapper for the Snice cell-phone component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-phone';
 * import { CellPhone } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellPhone />;
 * }
 * ```
 */
export const CellPhone: SniceReactComponent<CellPhoneProps, SniceComponentRef> = createReactAdapter<CellPhoneProps, false>({
  tagName: 'snice-cell-phone',
  properties: ["value","phone","displayText","showIcon","format","country","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
