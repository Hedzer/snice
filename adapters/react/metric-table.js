// GENERATED FILE — DO NOT EDIT.
// Source: components/metric-table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * MetricTable - React adapter for snice-metric-table
 *
 * This is an auto-generated React wrapper for the Snice metric-table component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/metric-table/snice-metric-table';
 * import { MetricTable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MetricTable />;
 * }
 * ```
 */
export const MetricTable = createReactAdapter({
    tagName: 'snice-metric-table',
    properties: ["columns", "data", "sortBy", "sortDirection"],
    events: { "sort-change": "onSortChange", "row-click": "onRowClick" },
    formAssociated: false
});
//# sourceMappingURL=metric-table.js.map