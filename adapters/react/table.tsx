// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Table component
 */
export interface TableProps extends SniceBaseProps {
  striped?: any;
  searchable?: any;
  filterable?: any;
  sortable?: any;
  selectable?: any;
  hoverable?: any;
  clickable?: any;
  list?: any;
  pagination?: any;
  paginationMode?: any;
  pageSize?: any;
  currentPage?: any;
  totalItems?: any;
  pageSizes?: any;
  searchDebounce?: any;
  currentSort?: any;
  selector?: any;
  selectorOptions?: any;
  loading?: any;
  virtualize?: any;
  rowHeight?: any;
  virtualBuffer?: any;
  columnResize?: any;
  editable?: any;
  editMode?: any;
  density?: any;
  headerFilters?: any;
  quickFilter?: any;
  rowReorder?: any;
  columnReorder?: any;
  columnMenu?: any;
  lazyLoad?: any;
  lazyLoadThreshold?: any;
  selectedRows?: any;
  onPageChange?: (event: any) => void;
  onTableRowSelectionChanged?: (event: any) => void;
  onTableSelectAllChanged?: (event: any) => void;
  onSortChange?: (event: any) => void;
  onFilterChange?: (event: any) => void;
  onColumnVisibilityChange?: (event: any) => void;
  onColumnPinChange?: (event: any) => void;
  onColumnOrderChange?: (event: any) => void;
  onDensityChange?: (event: any) => void;
  onRowClicked?: (event: any) => void;
  onLazyLoad?: (event: any) => void;
}

/**
 * Table - React adapter for snice-table
 *
 * This is an auto-generated React wrapper for the Snice table component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table';
 * import { Table } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Table />;
 * }
 * ```
 */
export const Table = createReactAdapter<TableProps>({
  tagName: 'snice-table',
  properties: ["striped","searchable","filterable","sortable","selectable","hoverable","clickable","list","pagination","paginationMode","pageSize","currentPage","totalItems","pageSizes","searchDebounce","currentSort","selector","selectorOptions","loading","virtualize","rowHeight","virtualBuffer","columnResize","editable","editMode","density","headerFilters","quickFilter","rowReorder","columnReorder","columnMenu","lazyLoad","lazyLoadThreshold","selectedRows"],
  events: {"page-change":"onPageChange","table-row-selection-changed":"onTableRowSelectionChanged","table-select-all-changed":"onTableSelectAllChanged","sort-change":"onSortChange","filter-change":"onFilterChange","column-visibility-change":"onColumnVisibilityChange","column-pin-change":"onColumnPinChange","column-order-change":"onColumnOrderChange","density-change":"onDensityChange","row-clicked":"onRowClicked","lazy-load":"onLazyLoad"},
  formAssociated: false
});
