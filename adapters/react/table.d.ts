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
    pageSizes?: number[];
    searchDebounce?: any;
    columns?: any[];
    data?: any[];
    mode?: any;
    currentSort?: Array<{
        column: string;
        direction: 'asc' | 'desc';
    }>;
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
    selectedRows?: number[];
    selectionMode?: 'none' | 'single' | 'multiple';
    groupBy?: string | string[];
    groupDefaults?: {
        expanded?: boolean;
    };
    onPageChange?: (event: any) => void;
    onTableRowSelectionChanged?: (event: any) => void;
    onRowClicked?: (event: any) => void;
    onTableLoadError?: (event: any) => void;
    onTableSelectAllChanged?: (event: any) => void;
    onSelectionChanged?: (event: CustomEvent<{
        selectedRows: number[];
        rows: any[];
    }>) => void;
    onSortChange?: (event: any) => void;
    onFilterChange?: (event: any) => void;
    onColumnVisibilityChange?: (event: any) => void;
    onColumnPinChange?: (event: any) => void;
    onColumnOrderChange?: (event: any) => void;
    onDensityChange?: (event: any) => void;
    onGroupToggle?: (event: CustomEvent<{
        key: string;
        value: any;
        expanded: boolean;
    }>) => void;
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
export declare const Table: import("react").ForwardRefExoticComponent<Omit<TableProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=table.d.ts.map