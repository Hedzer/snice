// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Column component
 */
export interface ColumnProps extends SniceBaseProps {
  key?: any;
  label?: any;
  type?: any;
  align?: any;
  width?: any;
  sortable?: any;
  filterable?: any;
  wrap?: any;
  ellipsis?: any;
  tooltip?: any;
  decimals?: any;
  thousandsSeparator?: any;
  numberPrefix?: any;
  numberSuffix?: any;
  negativeStyle?: any;
  dateFormat?: any;
  customDateFormat?: any;
  dateLocale?: any;
  trueValue?: any;
  falseValue?: any;
  useSymbols?: any;
  trueSymbol?: any;
  falseSymbol?: any;
  ratingMax?: any;
  ratingSymbol?: any;
  ratingEmptySymbol?: any;
  ratingColor?: any;
  progressMax?: any;
  showPercentage?: any;
  progressColor?: any;
  progressBgColor?: any;
  progressHeight?: any;
  sparklineType?: any;
  sparklineColor?: any;
  sparklineWidth?: any;
  sparklineHeight?: any;
  cellBgColor?: any;
  cellColor?: any;
  cellFontWeight?: any;
  cellFontStyle?: any;
  cellFontSize?: any;
  cellTextDecoration?: any;
  onColumnChanged?: (event: any) => void;
}

/**
 * Column - React adapter for snice-column
 *
 * This is an auto-generated React wrapper for the Snice column component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-column';
 * import { Column } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Column />;
 * }
 * ```
 */
export const Column: SniceReactComponent<ColumnProps, SniceComponentRef> = createReactAdapter<ColumnProps, false>({
  tagName: 'snice-column',
  properties: ["key","label","type","align","width","sortable","filterable","wrap","ellipsis","tooltip","decimals","thousandsSeparator","numberPrefix","numberSuffix","negativeStyle","dateFormat","customDateFormat","dateLocale","trueValue","falseValue","useSymbols","trueSymbol","falseSymbol","ratingMax","ratingSymbol","ratingEmptySymbol","ratingColor","progressMax","showPercentage","progressColor","progressBgColor","progressHeight","sparklineType","sparklineColor","sparklineWidth","sparklineHeight","cellBgColor","cellColor","cellFontWeight","cellFontStyle","cellFontSize","cellTextDecoration"],
  events: {"column-changed":"onColumnChanged"},
  formAssociated: false
});
