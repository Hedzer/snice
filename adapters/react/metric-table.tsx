// GENERATED FILE — DO NOT EDIT.
// Source: components/metric-table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the MetricTable component
 */
export interface MetricTableProps extends SniceBaseProps {
  columns?: any;
  data?: any;
  sortBy?: any;
  sortDirection?: any;
  onSortChange?: (event: any) => void;
  onRowClick?: (event: any) => void;
}

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
export const MetricTable: SniceReactComponent<MetricTableProps, SniceComponentRef> = createReactAdapter<MetricTableProps, false>({
  tagName: 'snice-metric-table',
  properties: ["columns","data","sortBy","sortDirection"],
  events: {"sort-change":"onSortChange","row-click":"onRowClick"},
  formAssociated: false
});
