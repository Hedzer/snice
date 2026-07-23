// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellPercentage component
 */
export interface CellPercentageProps extends SniceBaseProps {
  align?: any;
  type?: any;
  value?: any;
  column?: any;
  rowData?: any;
  decimals?: any;
  showTrend?: any;
  trendValue?: any;
  colorize?: any;

}

/**
 * CellPercentage - React adapter for snice-cell-percentage
 *
 * This is an auto-generated React wrapper for the Snice cell-percentage component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-percentage';
 * import { CellPercentage } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellPercentage />;
 * }
 * ```
 */
export const CellPercentage: SniceReactComponent<CellPercentageProps, SniceComponentRef> = createReactAdapter<CellPercentageProps, false>({
  tagName: 'snice-cell-percentage',
  properties: ["align","type","value","column","rowData","decimals","showTrend","trendValue","colorize"],
  events: {},
  formAssociated: false
});
