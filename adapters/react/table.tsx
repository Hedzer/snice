// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
import type { ColumnDefinition } from '../../dist/components/table/snice-table.types';


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
  pageSizes?: number[];
  searchDebounce?: any;
  columns?: ColumnDefinition[];
  data?: any[];
  mode?: any;
  currentSort?: Array<{ column: string; direction: 'asc' | 'desc' }>;
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
  columnFit?: any;
  headerFilters?: any;
  quickFilter?: any;
  rowReorder?: any;
  columnReorder?: any;
  columnMenu?: any;
  lazyLoad?: any;
  lazyLoadThreshold?: any;
  selectedRows?: number[];
  selectionMode?: 'none' | 'single' | 'multiple';
  groupBy?: string | string[];
  groupDefaults?: { expanded?: boolean };
  listRenderer?: any;
  onPageChange?: (event: any) => void;
  onTableRowSelectionChanged?: (event: any) => void;
  onRowClicked?: (event: any) => void;
  onTableLoadError?: (event: any) => void;
  onTableSelectAllChanged?: (event: any) => void;
  onSelectionChanged?: (event: CustomEvent<{ selectedRows: number[]; rows: any[] }>) => void;
  onSortChange?: (event: any) => void;
  onFilterChange?: (event: any) => void;
  onColumnVisibilityChange?: (event: any) => void;
  onColumnPinChange?: (event: any) => void;
  onColumnOrderChange?: (event: any) => void;
  onDensityChange?: (event: any) => void;
  onGroupToggle?: (event: CustomEvent<{ key: string; value: any; expanded: boolean }>) => void;
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
 * import 'snice/components/table/snice-table';
 * import { Table } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Table />;
 * }
 * ```
 */
export const Table: SniceReactComponent<TableProps, SniceComponentRef> = createReactAdapter<TableProps, false>({
  tagName: 'snice-table',
  properties: ["striped","searchable","filterable","sortable","selectable","hoverable","clickable","list","pagination","paginationMode","pageSize","currentPage","totalItems","pageSizes","searchDebounce","columns","data","mode","currentSort","selector","selectorOptions","loading","virtualize","rowHeight","virtualBuffer","columnResize","editable","editMode","density","columnFit","headerFilters","quickFilter","rowReorder","columnReorder","columnMenu","lazyLoad","lazyLoadThreshold","selectedRows","selectionMode","groupBy","groupDefaults","listRenderer"],
  events: {"page-change":"onPageChange","table-row-selection-changed":"onTableRowSelectionChanged","row-clicked":"onRowClicked","table-load-error":"onTableLoadError","table-select-all-changed":"onTableSelectAllChanged","selection-changed":"onSelectionChanged","sort-change":"onSortChange","filter-change":"onFilterChange","column-visibility-change":"onColumnVisibilityChange","column-pin-change":"onColumnPinChange","column-order-change":"onColumnOrderChange","density-change":"onDensityChange","group-toggle":"onGroupToggle","lazy-load":"onLazyLoad"},
  formAssociated: false
});
