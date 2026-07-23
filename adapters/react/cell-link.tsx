// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellLink component
 */
export interface CellLinkProps extends SniceBaseProps {
  value?: any;
  href?: any;
  target?: any;
  external?: any;
  icon?: any;
  text?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellLink - React adapter for snice-cell-link
 *
 * This is an auto-generated React wrapper for the Snice cell-link component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-link';
 * import { CellLink } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellLink />;
 * }
 * ```
 */
export const CellLink: SniceReactComponent<CellLinkProps, SniceComponentRef> = createReactAdapter<CellLinkProps, false>({
  tagName: 'snice-cell-link',
  properties: ["value","href","target","external","icon","text","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
