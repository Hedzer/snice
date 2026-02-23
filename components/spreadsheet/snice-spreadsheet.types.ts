export type CellType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface SpreadsheetColumn {
  header: string;
  type?: CellType;
  width?: number;
  options?: string[]; // for select type
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
