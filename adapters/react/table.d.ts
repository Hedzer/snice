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
export declare const Table: import("react").ForwardRefExoticComponent<Omit<TableProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=table.d.ts.map