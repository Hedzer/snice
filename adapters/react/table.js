// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const Table = createReactAdapter({
    tagName: 'snice-table',
    properties: ["striped", "searchable", "filterable", "sortable", "selectable", "hoverable", "clickable", "list", "pagination", "paginationMode", "pageSize", "currentPage", "totalItems", "pageSizes", "searchDebounce", "mode", "currentSort", "selector", "selectorOptions", "loading", "virtualize", "rowHeight", "virtualBuffer", "columnResize", "editable", "editMode", "density", "headerFilters", "quickFilter", "rowReorder", "columnReorder", "columnMenu", "lazyLoad", "lazyLoadThreshold", "selectedRows"],
    events: { "page-change": "onPageChange", "table-row-selection-changed": "onTableRowSelectionChanged", "table-select-all-changed": "onTableSelectAllChanged", "sort-change": "onSortChange", "filter-change": "onFilterChange", "column-visibility-change": "onColumnVisibilityChange", "column-pin-change": "onColumnPinChange", "column-order-change": "onColumnOrderChange", "density-change": "onDensityChange", "row-clicked": "onRowClicked", "lazy-load": "onLazyLoad" },
    formAssociated: false
});
//# sourceMappingURL=table.js.map