// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const Column = createReactAdapter({
    tagName: 'snice-column',
    properties: ["key", "label", "type", "align", "width", "sortable", "filterable", "wrap", "ellipsis", "tooltip", "decimals", "thousandsSeparator", "numberPrefix", "numberSuffix", "negativeStyle", "dateFormat", "customDateFormat", "dateLocale", "trueValue", "falseValue", "useSymbols", "trueSymbol", "falseSymbol", "ratingMax", "ratingSymbol", "ratingEmptySymbol", "ratingColor", "progressMax", "showPercentage", "progressColor", "progressBgColor", "progressHeight", "sparklineType", "sparklineColor", "sparklineWidth", "sparklineHeight", "cellBgColor", "cellColor", "cellFontWeight", "cellFontStyle", "cellFontSize", "cellTextDecoration"],
    events: { "column-changed": "onColumnChanged" },
    formAssociated: false
});
//# sourceMappingURL=column.js.map