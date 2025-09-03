export type TableSize = 'small' | 'medium' | 'large';
export type TableVariant = 'default' | 'striped' | 'bordered';
export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent' | 
  'rating' | 'progress' | 'sparkline' | 'accounting' | 'scientific' | 'fraction' | 
  'duration' | 'filesize' | 'custom';
export type SortDirection = 'asc' | 'desc' | null;

export interface NumberFormat {
  decimals?: number;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  negativeStyle?: 'parentheses' | 'red' | 'minus';
}

export interface DateFormat {
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  customFormat?: string;
  locale?: string;
}

export interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  fontStyle?: 'normal' | 'italic';
  fontSize?: string;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface ConditionalFormat {
  condition: (value: any, row?: any) => boolean;
  style?: CellStyle;
  className?: string;
}

export interface BooleanFormat {
  trueValue?: string;
  falseValue?: string;
  useSymbols?: boolean;
  trueSymbol?: string;
  falseSymbol?: string;
}

export interface RatingFormat {
  max?: number;
  symbol?: string;
  emptySymbol?: string;
  color?: string;
}

export interface ProgressFormat {
  max?: number;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: string;
}

export interface SparklineFormat {
  type?: 'line' | 'bar' | 'area';
  color?: string;
  width?: number;
  height?: number;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: ColumnAlign;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any, row?: any) => string;
  
  // Excel-like formatting
  numberFormat?: NumberFormat;
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: RatingFormat;
  progressFormat?: ProgressFormat;
  sparklineFormat?: SparklineFormat;
  style?: CellStyle;
  conditionalFormats?: ConditionalFormat[];
  
  // Display options
  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value: any, row?: any) => string);
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface SniceTableElement extends HTMLElement {
  size: TableSize;
  variant: TableVariant;
  striped: boolean;
  hoverable: boolean;
  bordered: boolean;
  stickyHeader: boolean;
  sortable: boolean;
  selectable: boolean;
  clickable: boolean;
  loading: boolean;
  data: any[];
  columns: ColumnDefinition[];
  showSearch: boolean;
  showPagination: boolean;
  pageSize: number;
  currentPage: number;
  totalItems: number;
  setData(data: any[]): void;
  sort(column: string): void;
  getSelectedRows(): any[];
  search(query: string): void;
  goToPage(page: number): void;
}

export interface SniceHeaderElement extends HTMLElement {
  sticky: boolean;
  columns: ColumnDefinition[];
  selectable: boolean;
  sortable: boolean;
  currentSort: TableSort;
}

export interface SniceColumnElement extends HTMLElement {
  key: string;
  label: string;
  type: ColumnType;
  align: ColumnAlign;
  width: string;
  sortable: boolean;
  filterable: boolean;
}

export interface SniceRowElement extends HTMLElement {
  selected: boolean;
  hoverable: boolean;
  clickable: boolean;
  data: any;
  index: number;
  columns: ColumnDefinition[];
  selectable: boolean;
  updateCells(): void;
}

export interface SniceCellElement extends HTMLElement {
  align: ColumnAlign;
  type: ColumnType;
  value: any;
  column: ColumnDefinition;
}