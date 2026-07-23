// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellRating component
 */
export interface CellRatingProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;

}

/**
 * CellRating - React adapter for snice-cell-rating
 *
 * This is an auto-generated React wrapper for the Snice cell-rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-rating';
 * import { CellRating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellRating />;
 * }
 * ```
 */
export const CellRating: SniceReactComponent<CellRatingProps, SniceComponentRef> = createReactAdapter<CellRatingProps, false>({
  tagName: 'snice-cell-rating',
  properties: ["align","type","value","column","rowData"],
  events: {},
  formAssociated: false
});
