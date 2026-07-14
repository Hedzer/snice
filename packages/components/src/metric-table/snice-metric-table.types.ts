export type SortDirection = 'asc' | 'desc';
export type ColumnType = 'text' | 'number' | 'percent' | 'currency';

export interface MetricColumn {
  key: string;
  label: string;
  type?: ColumnType;
  format?: string;
  sparkline?: boolean;
}

export interface SniceMetricTableElement extends HTMLElement {
  columns: MetricColumn[];
  data: Record<string, any>[];
  sortBy: string;
  sortDirection: SortDirection;
}

export interface SortChangeDetail {
  sortBy: string;
  sortDirection: SortDirection;
}

export interface RowClickDetail {
  row: Record<string, any>;
  index: number;
}

export interface SniceMetricTableEventMap {
  'sort-change': CustomEvent<SortChangeDetail>;
  'row-click': CustomEvent<RowClickDetail>;
}
