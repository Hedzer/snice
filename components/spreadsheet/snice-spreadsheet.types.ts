export type CellType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'currency' | 'percent';

export interface SpreadsheetColumnFormat {
  /** Decimals for number/currency/percent. Default: number=auto-trim, currency=2, percent=0. */
  decimals?: number;
  /** ISO 4217 currency code (e.g. 'USD', 'EUR'). Required for type='currency'. */
  currency?: string;
  /** Locale (BCP 47). Default: undefined (browser locale). */
  locale?: string;
  /** Date display style. Default: 'short' for date, 'medium' for datetime. */
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  /** Time display style for datetime. Default: 'short'. */
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  /** Override with a custom Intl.NumberFormatOptions / DateTimeFormatOptions. */
  intlOptions?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
}

export interface SpreadsheetColumn {
  header: string;
  type?: CellType;
  width?: number;
  options?: string[]; // for select type
  format?: SpreadsheetColumnFormat;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface UndoEntry {
  row: number;
  col: number;
  oldValue: any;
  newValue: any;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
}

export interface SniceSpreadsheetElement extends HTMLElement {
  data: any[][];
  columns: SpreadsheetColumn[];
  readonly: boolean;

  getCell(row: number, col: number): any;
  setCell(row: number, col: number, value: any): void;
  getData(): any[][];
  setData(data: any[][]): void;
}

export interface SniceSpreadsheetEventMap {
  'cell-change': CustomEvent<{ row: number; col: number; value: any; oldValue: any }>;
  'cell-select': CustomEvent<{ row: number; col: number }>;
  'row-select': CustomEvent<{ row: number }>;
  'column-sort': CustomEvent<{ col: number; direction: 'asc' | 'desc' }>;
}
