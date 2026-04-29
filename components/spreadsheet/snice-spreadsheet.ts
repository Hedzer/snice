import { element, property, query, ready, render, styles, dispatch, watch, on, dispose, html, css } from 'snice';
import type { SpreadsheetColumn, SpreadsheetColumnFormat, CellType, CellPosition, CellRange, UndoEntry, SniceSpreadsheetElement } from './snice-spreadsheet.types';
import sheetStyles from './snice-spreadsheet.css?inline';

@element('snice-spreadsheet')
export class SniceSpreadsheet extends HTMLElement implements SniceSpreadsheetElement {
  @property({ type: Array, attribute: false }) data: any[][] = [];
  @property({ type: Array, attribute: false }) columns: SpreadsheetColumn[] = [];
  @property({ type: Boolean }) readonly: boolean = false;

  private selectedCell: CellPosition | null = null;
  private editingCell: CellPosition | null = null;
  private editValue: string = '';
  private sortCol: number = -1;
  private sortDir: 'asc' | 'desc' = 'asc';

  private selectionStart: CellPosition | null = null;
  private selectionEnd: CellPosition | null = null;
  private isDragging: boolean = false;

  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private static UNDO_LIMIT = 100;

  private columnWidths: Map<number, number> = new Map();
  private resizingCol: number = -1;
  private resizeStartX: number = 0;
  private resizeStartWidth: number = 0;

  private contextMenuCell: CellPosition | null = null;

  private boundDragMove: ((e: MouseEvent) => void) | null = null;
  private boundDragUp: (() => void) | null = null;
  private boundResizeMove: ((e: MouseEvent) => void) | null = null;
  private boundResizeUp: (() => void) | null = null;
  private boundCloseContext: ((e: MouseEvent) => void) | null = null;
  private boundCloseContextKey: ((e: KeyboardEvent) => void) | null = null;

  private listenersAttached = false;

  @query('.spreadsheet-cell-ref') private cellRefEl?: HTMLElement;
  @query('.spreadsheet-formula-input') private formulaInputEl?: HTMLInputElement;
  @query('.spreadsheet') private wrapperEl?: HTMLElement;
  @query('.spreadsheet-status-bar') private statusBarEl?: HTMLElement;
  @query('.spreadsheet-context-menu') private contextMenuEl?: HTMLElement;
  @query('.spreadsheet-fill-handle') private fillHandleEl?: HTMLElement;
  @query('.spreadsheet-find-bar') private findBarEl?: HTMLElement;
  @query('.spreadsheet-find-input') private findInputEl?: HTMLInputElement;
  @query('.spreadsheet-replace-input') private replaceInputEl?: HTMLInputElement;

  // ── Find & Replace state ──
  private findOpen = false;
  private findShowReplace = false;
  private findText = '';
  private findCaseSensitive = false;
  private findMatches: CellPosition[] = [];
  private findIndex = -1;

  // Fill-handle drag state. While `fillSourceRange` is set, mousemove on
  // document drives `fillTargetEnd` which highlights the prospective fill
  // range; mouseup commits the values from source into the target.
  private fillSourceRange: CellRange | null = null;
  private fillTargetEnd: CellPosition | null = null;
  private boundFillMove: ((e: MouseEvent) => void) | null = null;
  private boundFillUp: ((e: MouseEvent) => void) | null = null;

  @styles()
  componentStyles() {
    return css/*css*/`${sheetStyles}`;
  }

  @ready()
  init() {
    this.rebuild();
  }

  @dispose()
  cleanup() {
    if (this.boundDragMove) { document.removeEventListener('mousemove', this.boundDragMove); this.boundDragMove = null; }
    if (this.boundDragUp) { document.removeEventListener('mouseup', this.boundDragUp); this.boundDragUp = null; }
    if (this.boundResizeMove) { document.removeEventListener('mousemove', this.boundResizeMove); this.boundResizeMove = null; }
    if (this.boundResizeUp) { document.removeEventListener('mouseup', this.boundResizeUp); this.boundResizeUp = null; }
    if (this.boundCloseContext) { document.removeEventListener('mousedown', this.boundCloseContext); this.boundCloseContext = null; }
    if (this.boundCloseContextKey) { document.removeEventListener('keydown', this.boundCloseContextKey); this.boundCloseContextKey = null; }
  }

  @watch('data', 'columns')
  onDataChange() {
    this.rebuild();
  }

  // ── Public API ──

  getCell(row: number, col: number): any {
    if (row >= 0 && row < this.data.length && col >= 0 && col < (this.data[row]?.length || 0)) {
      return this.resolveValue(this.data[row][col]);
    }
    return undefined;
  }

  setCell(row: number, col: number, value: any, trackUndo: boolean = true): void {
    if (row < 0 || col < 0) return;
    while (this.data.length <= row) this.data.push([]);
    while (this.data[row].length <= col) this.data[row].push('');
    const oldValue = this.data[row][col];
    this.data[row][col] = value;
    if (trackUndo && oldValue !== value) {
      this.pushUndo({ row, col, oldValue, newValue: value });
    }
    this.data = [...this.data];
    this.emitCellChange(row, col, value, oldValue);
  }

  getData(): any[][] {
    return this.data.map(row => [...row]);
  }

  setData(data: any[][]): void {
    this.data = data.map(row => [...row]);
  }

  // ── Undo/Redo ──

  private pushUndo(entry: UndoEntry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > SniceSpreadsheet.UNDO_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  private undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    this.redoStack.push(entry);
    this.data[entry.row][entry.col] = entry.oldValue;
    this.selectedCell = { row: entry.row, col: entry.col };
    this.selectionStart = { ...this.selectedCell };
    this.selectionEnd = { ...this.selectedCell };
    this.data = [...this.data];
  }

  private redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    this.undoStack.push(entry);
    this.data[entry.row][entry.col] = entry.newValue;
    this.selectedCell = { row: entry.row, col: entry.col };
    this.selectionStart = { ...this.selectedCell };
    this.selectionEnd = { ...this.selectedCell };
    this.data = [...this.data];
  }

  // ── Selection Helpers ──

  private getSelectionRange(): CellRange | null {
    if (!this.selectionStart || !this.selectionEnd) return null;
    return {
      start: {
        row: Math.min(this.selectionStart.row, this.selectionEnd.row),
        col: Math.min(this.selectionStart.col, this.selectionEnd.col),
      },
      end: {
        row: Math.max(this.selectionStart.row, this.selectionEnd.row),
        col: Math.max(this.selectionStart.col, this.selectionEnd.col),
      },
    };
  }

  private isInRange(row: number, col: number): boolean {
    const range = this.getSelectionRange();
    if (!range) return false;
    return row >= range.start.row && row <= range.end.row &&
           col >= range.start.col && col <= range.end.col;
  }

  private hasMultiSelection(): boolean {
    if (!this.selectionStart || !this.selectionEnd) return false;
    return this.selectionStart.row !== this.selectionEnd.row ||
           this.selectionStart.col !== this.selectionEnd.col;
  }

  private getSelectionStats(): { count: number; sum: number; avg: number } | null {
    const range = this.getSelectionRange();
    if (!range || !this.hasMultiSelection()) return null;
    const nums: number[] = [];
    for (let r = range.start.row; r <= range.end.row; r++) {
      for (let c = range.start.col; c <= range.end.col; c++) {
        const val = this.getCell(r, c);
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (!isNaN(num)) nums.push(num);
      }
    }
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return { count: nums.length, sum, avg: sum / nums.length };
  }

  // ── Formula Support ──

  private resolveValue(value: any): any {
    if (typeof value !== 'string' || !value.startsWith('=')) return value;
    try {
      return this.evaluateFormula(value.substring(1).toUpperCase().trim());
    } catch {
      return '#ERROR';
    }
  }

  private evaluateFormula(formula: string): any {
    const fnMatch = formula.match(/^(SUM|AVG|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)$/);
    if (!fnMatch) return '#ERROR';
    const fn = fnMatch[1];
    const nums = this.resolveRange(fnMatch[2]).filter(v => typeof v === 'number' && !isNaN(v));
    switch (fn) {
      case 'SUM': return nums.reduce((a, b) => a + b, 0);
      case 'AVG':
      case 'AVERAGE': return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'COUNT': return nums.length;
      case 'MIN': return nums.length > 0 ? Math.min(...nums) : 0;
      case 'MAX': return nums.length > 0 ? Math.max(...nums) : 0;
      default: return '#ERROR';
    }
  }

  private resolvingCells: Set<string> = new Set();

  private resolveRange(rangeStr: string): any[] {
    const parts = rangeStr.split(':');
    if (parts.length === 2) {
      const start = this.parseCellRef(parts[0].trim());
      const end = this.parseCellRef(parts[1].trim());
      if (!start || !end) return [];
      const values: any[] = [];
      for (let r = start.row; r <= end.row; r++) {
        for (let c = start.col; c <= end.col; c++) {
          if (r < this.data.length && c < (this.data[r]?.length || 0)) {
            const key = `${r},${c}`;
            if (this.resolvingCells.has(key)) continue;
            const raw = this.data[r][c];
            let val: any;
            if (typeof raw === 'string' && raw.startsWith('=')) {
              this.resolvingCells.add(key);
              try { val = this.resolveValue(raw); }
              finally { this.resolvingCells.delete(key); }
            } else {
              val = raw;
            }
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (!isNaN(num)) values.push(num);
          }
        }
      }
      return values;
    }
    const ref = this.parseCellRef(rangeStr.trim());
    if (ref && ref.row < this.data.length && ref.col < (this.data[ref.row]?.length || 0)) {
      const key = `${ref.row},${ref.col}`;
      if (this.resolvingCells.has(key)) return [];
      this.resolvingCells.add(key);
      try {
        const val = this.resolveValue(this.data[ref.row][ref.col]);
        return [typeof val === 'number' ? val : parseFloat(val)].filter(v => !isNaN(v));
      } finally {
        this.resolvingCells.delete(key);
      }
    }
    return [];
  }

  private parseCellRef(ref: string): CellPosition | null {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    let col = 0;
    for (const ch of match[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
    return { row: parseInt(match[2], 10) - 1, col: col - 1 };
  }

  private colToLetter(col: number): string {
    let result = '';
    let c = col;
    while (c >= 0) {
      result = String.fromCharCode(65 + (c % 26)) + result;
      c = Math.floor(c / 26) - 1;
    }
    return result;
  }

  private getCellRef(): string {
    if (!this.selectedCell) return '';
    return `${this.colToLetter(this.selectedCell.col)}${this.selectedCell.row + 1}`;
  }

  private getColumnCount(): number {
    return Math.max(this.columns.length, ...this.data.map(row => row?.length || 0), 1);
  }

  private getDefaultColWidth(col: number): number {
    return this.columns[col]?.width || 100;
  }

  private getColWidth(col: number): number {
    return this.columnWidths.get(col) || this.getDefaultColWidth(col);
  }

  // ── Cell Interaction ──

  private handleCellMouseDown(row: number, col: number, e: MouseEvent) {
    if (this.editingCell) this.commitEdit();

    if (e.shiftKey && this.selectedCell) {
      this.selectionEnd = { row, col };
    } else {
      this.selectedCell = { row, col };
      this.selectionStart = { row, col };
      this.selectionEnd = { row, col };

      this.isDragging = true;
      this.boundDragMove = (ev) => this.handleDragMove(ev);
      this.boundDragUp = () => this.handleDragEnd();
      document.addEventListener('mousemove', this.boundDragMove);
      document.addEventListener('mouseup', this.boundDragUp);
    }

    this.editingCell = null;
    this.emitCellSelect(row, col);
    this.updateSelection();
  }

  private handleDragMove(e: MouseEvent) {
    if (!this.isDragging || !this.wrapperEl) return;
    // Use the browser's hit-test tree (O(1)) instead of iterating every cell
    // and forcing a layout reflow per cell. Previous implementation called
    // getBoundingClientRect() on every .spreadsheet-td on every mousemove —
    // catastrophic at scale (50×50 = 2500 reflows × ~60Hz).
    const root = this.shadowRoot ?? document;
    const hit = (root as Document | ShadowRoot).elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cell = hit?.closest('.spreadsheet-td') as HTMLElement | null;
    if (!cell) return;
    const r = parseInt(cell.dataset.row || '-1', 10);
    const c = parseInt(cell.dataset.col || '-1', 10);
    if (r < 0 || c < 0) return;
    if (r !== this.selectionEnd?.row || c !== this.selectionEnd?.col) {
      this.selectionEnd = { row: r, col: c };
      this.updateSelection();
    }
  }

  private handleDragEnd() {
    this.isDragging = false;
    if (this.boundDragMove) { document.removeEventListener('mousemove', this.boundDragMove); this.boundDragMove = null; }
    if (this.boundDragUp) { document.removeEventListener('mouseup', this.boundDragUp); this.boundDragUp = null; }
    // Drag is over — re-show / reposition the fill handle on the final selection.
    this.updateFillHandlePosition();
  }

  private handleCellDblClick(row: number, col: number) {
    if (this.readonly) return;
    this.startEditing(row, col);
  }

  private startEditing(row: number, col: number, initialValue?: string) {
    if (this.readonly) return;
    this.editingCell = { row, col };
    const raw = this.data[row]?.[col];
    this.editValue = initialValue !== undefined ? initialValue : (raw != null ? String(raw) : '');
    this.selectedCell = { row, col };
    this.selectionStart = { row, col };
    this.selectionEnd = { row, col };

    const td = this.wrapperEl?.querySelector(`td[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
    if (!td) return;
    td.classList.add('selected');

    const colDef = this.columns[col];
    const cellType = colDef?.type || 'text';

    if (cellType === 'boolean') {
      td.innerHTML = `<div class="spreadsheet-checkbox"><input type="checkbox" ${raw ? 'checked' : ''} /></div>`;
      const cb = td.querySelector('input') as HTMLInputElement;
      cb?.addEventListener('change', (e) => { this.editingCell = null; this.setCell(row, col, (e.target as HTMLInputElement).checked); });
      cb?.focus();
    } else if (cellType === 'select' && colDef?.options) {
      const opts = colDef.options.map(opt => `<option value="${this.escAttr(opt)}" ${raw === opt ? 'selected' : ''}>${this.esc(opt)}</option>`).join('');
      td.innerHTML = `<select class="spreadsheet-select">${opts}</select>`;
      const sel = td.querySelector('select') as HTMLSelectElement;
      sel?.addEventListener('change', (e) => { this.editingCell = null; this.setCell(row, col, (e.target as HTMLSelectElement).value); });
      sel?.focus();
    } else {
      const inputType = cellType === 'number' ? 'number' : cellType === 'date' ? 'date' : 'text';
      td.innerHTML = `<input class="spreadsheet-input" type="${inputType}" value="${this.escAttr(this.editValue)}" />`;
      const input = td.querySelector('input') as HTMLInputElement;
      if (input) {
        input.addEventListener('input', (e) => { this.editValue = (e.target as HTMLInputElement).value; });
        input.addEventListener('keydown', (e) => this.handleEditKeydown(e));
        input.addEventListener('blur', () => this.commitEdit());
        input.focus();
        if (initialValue !== undefined) {
          input.setSelectionRange(input.value.length, input.value.length);
        } else {
          input.select();
        }
      }
    }
    this.updateFormulaBar();
  }

  private handleEditKeydown(e: KeyboardEvent) {
    const row = this.editingCell?.row;
    const col = this.editingCell?.col;
    if (row === undefined || col === undefined) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.commitEdit();
      const nextRow = row + 1;
      if (nextRow >= this.data.length) this.addRow();
      this.selectedCell = { row: nextRow, col };
      this.selectionStart = { ...this.selectedCell };
      this.selectionEnd = { ...this.selectedCell };
      this.updateSelection();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.editingCell = null;
      this.restoreCell(row, col);
      this.updateSelection();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.commitEdit();
      const nextCol = e.shiftKey ? col - 1 : col + 1;
      if (nextCol >= 0) {
        if (nextCol >= this.getColumnCount()) this.addColumn();
        this.selectedCell = { row, col: nextCol };
        this.selectionStart = { ...this.selectedCell };
        this.selectionEnd = { ...this.selectedCell };
        this.updateSelection();
      }
    }
  }

  private commitEdit() {
    if (!this.editingCell) return;
    const { row, col } = this.editingCell;
    let value: any = this.editValue;
    const colDef = this.columns[col];
    const type = colDef?.type || 'text';
    if (type === 'number' && !value.startsWith('=')) {
      const num = parseFloat(value);
      if (!isNaN(num)) value = num;
    } else if (type === 'boolean') {
      value = value === 'true' || value === '1';
    }
    this.editingCell = null;
    this.setCell(row, col, value);
  }

  private restoreCell(row: number, col: number) {
    const td = this.wrapperEl?.querySelector(`td[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
    if (!td) return;
    const rawValue = this.data[row]?.[col];
    const displayValue = this.resolveValue(rawValue);
    const colDef = this.columns[col];
    const cellType: CellType = colDef?.type || 'text';
    const display = this.formatCellDisplay(displayValue, colDef);
    const contentClass = this.cellContentClass(cellType);
    td.innerHTML = `<span class="${contentClass}">${display}</span>`;
  }

  private handleRowClick(row: number) {
    this.selectedCell = { row, col: 0 };
    this.selectionStart = { row, col: 0 };
    this.selectionEnd = { row, col: this.getColumnCount() - 1 };
    this.emitRowSelect(row);
    this.updateSelection();
  }

  private handleHeaderClick(col: number) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.data = [...this.data].sort((a, b) => {
      const aVal = a[col], bVal = b[col];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    this.emitColumnSort(col, this.sortDir);
  }

  // ── Column Resize ──

  private handleResizeStart(col: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.resizingCol = col;
    this.resizeStartX = e.clientX;
    this.resizeStartWidth = this.getColWidth(col);
    this.boundResizeMove = (ev) => this.handleResizeMove(ev);
    this.boundResizeUp = () => this.handleResizeEnd();
    document.addEventListener('mousemove', this.boundResizeMove);
    document.addEventListener('mouseup', this.boundResizeUp);
  }

  private handleResizeMove(e: MouseEvent) {
    if (this.resizingCol < 0 || !this.wrapperEl) return;
    const newWidth = Math.max(40, this.resizeStartWidth + (e.clientX - this.resizeStartX));
    this.columnWidths.set(this.resizingCol, newWidth);
    this.wrapperEl.querySelectorAll(`th[data-col="${this.resizingCol}"], td[data-col="${this.resizingCol}"]`).forEach(el => {
      (el as HTMLElement).style.width = `${newWidth}px`;
    });
  }

  private handleResizeEnd() {
    this.resizingCol = -1;
    if (this.boundResizeMove) { document.removeEventListener('mousemove', this.boundResizeMove); this.boundResizeMove = null; }
    if (this.boundResizeUp) { document.removeEventListener('mouseup', this.boundResizeUp); this.boundResizeUp = null; }
  }

  // ── Context Menu ──

  private handleContextMenu(row: number, col: number, e: MouseEvent) {
    e.preventDefault();
    this.selectedCell = { row, col };
    this.contextMenuCell = { row, col };
    this.showContextMenu(e.clientX, e.clientY);
    this.updateSelection();
    setTimeout(() => {
      this.boundCloseContext = (ev: MouseEvent) => {
        if (this.contextMenuEl && !this.contextMenuEl.contains(ev.target as Node)) this.hideContextMenu();
      };
      this.boundCloseContextKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') this.hideContextMenu();
      };
      document.addEventListener('mousedown', this.boundCloseContext);
      document.addEventListener('keydown', this.boundCloseContextKey);
    }, 0);
  }

  private showContextMenu(x: number, y: number) {
    if (!this.contextMenuEl) return;
    this.contextMenuEl.style.left = `${x}px`;
    this.contextMenuEl.style.top = `${y}px`;
    this.contextMenuEl.hidden = false;
  }

  private hideContextMenu() {
    if (this.contextMenuEl) this.contextMenuEl.hidden = true;
    this.contextMenuCell = null;
    if (this.boundCloseContext) { document.removeEventListener('mousedown', this.boundCloseContext); this.boundCloseContext = null; }
    if (this.boundCloseContextKey) { document.removeEventListener('keydown', this.boundCloseContextKey); this.boundCloseContextKey = null; }
  }

  private contextAction(action: string) {
    const cell = this.contextMenuCell;
    if (!cell) { this.hideContextMenu(); return; }
    const { row, col } = cell;
    switch (action) {
      case 'cut': this.handleCopyCells(); this.clearSelectedCells(); break;
      case 'copy': this.handleCopyCells(); break;
      case 'paste': this.pasteFromClipboard(row, col); break;
      case 'insert-row-above': this.insertRow(row); break;
      case 'insert-row-below': this.insertRow(row + 1); break;
      case 'delete-row': this.deleteRow(row); break;
      case 'insert-col-left': this.insertColumn(col); break;
      case 'insert-col-right': this.insertColumn(col + 1); break;
      case 'delete-col': this.deleteColumn(col); break;
      case 'clear': this.clearSelectedCells(); break;
    }
    this.hideContextMenu();
  }

  // ── Clipboard ──

  private handleCopyCells() {
    const range = this.getSelectionRange();
    if (!range) {
      if (this.selectedCell) {
        navigator.clipboard.writeText(String(this.getCell(this.selectedCell.row, this.selectedCell.col) ?? '')).catch(() => {});
      }
      return;
    }
    const lines: string[] = [];
    for (let r = range.start.row; r <= range.end.row; r++) {
      const cells: string[] = [];
      for (let c = range.start.col; c <= range.end.col; c++) {
        cells.push(String(this.getCell(r, c) ?? ''));
      }
      lines.push(cells.join('\t'));
    }
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
  }

  private clearSelectedCells() {
    const range = this.getSelectionRange();
    if (range && this.hasMultiSelection()) {
      for (let r = range.start.row; r <= range.end.row; r++) {
        for (let c = range.start.col; c <= range.end.col; c++) {
          this.setCell(r, c, '');
        }
      }
    } else if (this.selectedCell) {
      this.setCell(this.selectedCell.row, this.selectedCell.col, '');
    }
  }

  // ── Row/Column Operations ──

  private insertRow(atIndex: number) {
    this.data.splice(atIndex, 0, new Array(this.getColumnCount()).fill(''));
    this.data = [...this.data];
  }

  private deleteRow(index: number) {
    if (this.data.length <= 1) return;
    this.data.splice(index, 1);
    this.data = [...this.data];
  }

  private insertColumn(atIndex: number) {
    for (const row of this.data) row.splice(atIndex, 0, '');
    if (this.columns.length > 0) {
      this.columns.splice(atIndex, 0, { header: this.colToLetter(atIndex) });
      this.columns = [...this.columns];
    }
    this.data = [...this.data];
  }

  private deleteColumn(index: number) {
    if (this.getColumnCount() <= 1) return;
    for (const row of this.data) { if (index < row.length) row.splice(index, 1); }
    if (this.columns.length > index) {
      this.columns.splice(index, 1);
      this.columns = [...this.columns];
    }
    this.data = [...this.data];
  }

  private addRow() {
    this.data.push(new Array(this.getColumnCount()).fill(''));
    this.data = [...this.data];
  }

  private addColumn() {
    for (const row of this.data) row.push('');
    if (this.columns.length > 0) {
      this.columns.push({ header: this.colToLetter(this.columns.length) });
      this.columns = [...this.columns];
    }
    this.data = [...this.data];
  }

  // ── Find & Replace ──

  private openFind(showReplace: boolean) {
    this.findOpen = true;
    this.findShowReplace = showReplace;
    if (this.findBarEl) {
      this.findBarEl.hidden = false;
      const replaceRow = this.findBarEl.querySelector('.spreadsheet-find-replace-row') as HTMLElement | null;
      if (replaceRow) replaceRow.hidden = !showReplace;
    }
    requestAnimationFrame(() => this.findInputEl?.focus());
    if (this.findText) this.runFindScan();
  }

  private closeFind() {
    this.findOpen = false;
    this.findMatches = [];
    this.findIndex = -1;
    if (this.findBarEl) this.findBarEl.hidden = true;
    this.clearFindHighlights();
    (this.shadowRoot?.querySelector('.spreadsheet') as HTMLElement | null)?.focus();
  }

  @on('input', '.spreadsheet-find-input')
  private handleFindInput(e: Event) {
    this.findText = (e.target as HTMLInputElement).value;
    this.runFindScan();
  }

  @on('keydown', '.spreadsheet-find-input')
  private handleFindKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.cycleFind(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closeFind();
    }
  }

  @on('keydown', '.spreadsheet-replace-input')
  private handleReplaceKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeFind();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.replaceCurrent();
    }
  }

  @on('change', '.spreadsheet-find-toggle input')
  private handleFindCaseToggle(e: Event) {
    this.findCaseSensitive = (e.target as HTMLInputElement).checked;
    this.runFindScan();
  }

  @on('click', '.spreadsheet-find-btn')
  private handleFindBtn(e: MouseEvent) {
    const btn = (e.target as HTMLElement).closest('[data-find-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.getAttribute('data-find-action');
    if (action === 'next')        this.cycleFind(1);
    else if (action === 'prev')   this.cycleFind(-1);
    else if (action === 'close')  this.closeFind();
    else if (action === 'replace') this.replaceCurrent();
    else if (action === 'replace-all') this.replaceAll();
  }

  private runFindScan() {
    this.clearFindHighlights();
    const q = this.findText;
    if (!q) {
      this.findMatches = [];
      this.findIndex = -1;
      this.updateFindCount();
      return;
    }
    const cmp = this.findCaseSensitive ? q : q.toLowerCase();
    const matches: CellPosition[] = [];
    for (let r = 0; r < this.data.length; r++) {
      const row = this.data[r] || [];
      for (let c = 0; c < row.length; c++) {
        const v = row[c];
        if (v == null || v === '') continue;
        const s = String(v);
        const hay = this.findCaseSensitive ? s : s.toLowerCase();
        if (hay.includes(cmp)) matches.push({ row: r, col: c });
      }
    }
    this.findMatches = matches;
    this.findIndex = matches.length > 0 ? 0 : -1;
    this.applyFindHighlights();
    this.updateFindCount();
    this.scrollMatchIntoView();
  }

  private cycleFind(direction: 1 | -1) {
    if (this.findMatches.length === 0) return;
    this.findIndex = (this.findIndex + direction + this.findMatches.length) % this.findMatches.length;
    this.applyFindHighlights();
    this.updateFindCount();
    this.scrollMatchIntoView();
  }

  private clearFindHighlights() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.find-match, .find-match-active')
      .forEach(el => el.classList.remove('find-match', 'find-match-active'));
  }

  private applyFindHighlights() {
    if (!this.wrapperEl) return;
    this.clearFindHighlights();
    this.findMatches.forEach((m, i) => {
      const td = this.wrapperEl!.querySelector(`td[data-row="${m.row}"][data-col="${m.col}"]`);
      if (!td) return;
      td.classList.add('find-match');
      if (i === this.findIndex) td.classList.add('find-match-active');
    });
  }

  private scrollMatchIntoView() {
    if (this.findIndex < 0) return;
    const m = this.findMatches[this.findIndex];
    const td = this.wrapperEl?.querySelector(`td[data-row="${m.row}"][data-col="${m.col}"]`) as HTMLElement | null;
    // happy-dom doesn't always implement scrollIntoView; guard so the scan
    // path doesn't fail in tests.
    try { td?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* noop */ }
  }

  private updateFindCount() {
    const count = this.findBarEl?.querySelector('.spreadsheet-find-count') as HTMLElement | null;
    if (!count) return;
    if (!this.findText) count.textContent = '';
    else if (this.findMatches.length === 0) count.textContent = 'No matches';
    else count.textContent = `${this.findIndex + 1} / ${this.findMatches.length}`;
  }

  private replaceCurrent() {
    if (this.readonly || this.findIndex < 0) return;
    const m = this.findMatches[this.findIndex];
    const replaceWith = this.replaceInputEl?.value ?? '';
    const oldVal = this.data[m.row]?.[m.col];
    if (oldVal == null) return;
    const replaced = this.replaceInValue(String(oldVal), this.findText, replaceWith);
    this.setCell(m.row, m.col, replaced);
    this.runFindScan();
  }

  private replaceAll() {
    if (this.readonly || this.findMatches.length === 0) return;
    const replaceWith = this.replaceInputEl?.value ?? '';
    const matchesSnapshot = [...this.findMatches];
    for (const m of matchesSnapshot) {
      const oldVal = this.data[m.row]?.[m.col];
      if (oldVal == null) continue;
      const replaced = this.replaceInValue(String(oldVal), this.findText, replaceWith);
      if (!this.data[m.row]) this.data[m.row] = [];
      this.data[m.row][m.col] = replaced;
      this.pushUndo({ row: m.row, col: m.col, oldValue: oldVal, newValue: replaced });
      this.emitCellChange(m.row, m.col, replaced, oldVal);
    }
    this.redoStack.length = 0;
    this.data = [...this.data];
    this.runFindScan();
  }

  private replaceInValue(haystack: string, needle: string, repl: string): string {
    if (this.findCaseSensitive) return haystack.split(needle).join(repl);
    // Case-insensitive replacement preserving non-matching segments verbatim.
    const lowHay = haystack.toLowerCase();
    const lowNeedle = needle.toLowerCase();
    let out = '';
    let i = 0;
    while (i < haystack.length) {
      const idx = lowHay.indexOf(lowNeedle, i);
      if (idx === -1) { out += haystack.slice(i); break; }
      out += haystack.slice(i, idx) + repl;
      i = idx + needle.length;
    }
    return out;
  }

  // ── Keyboard ──

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); this.undo(); return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault(); this.redo(); return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault(); this.openFind(false); return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault(); this.openFind(true); return;
    }
    if (this.editingCell) return;
    if (!this.selectedCell) return;

    const { row, col } = this.selectedCell;

    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !this.readonly) {
      e.preventDefault();
      this.startEditing(row, col, e.key);
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          const nr = row - 1;
          this.selectedCell = { row: nr, col };
          if (e.shiftKey) { this.selectionEnd = { row: nr, col: this.selectionEnd?.col ?? col }; }
          else { this.selectionStart = { row: nr, col }; this.selectionEnd = { row: nr, col }; }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < this.data.length - 1) {
          const nr = row + 1;
          this.selectedCell = { row: nr, col };
          if (e.shiftKey) { this.selectionEnd = { row: nr, col: this.selectionEnd?.col ?? col }; }
          else { this.selectionStart = { row: nr, col }; this.selectionEnd = { row: nr, col }; }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          const nc = col - 1;
          this.selectedCell = { row, col: nc };
          if (e.shiftKey) { this.selectionEnd = { row: this.selectionEnd?.row ?? row, col: nc }; }
          else { this.selectionStart = { row, col: nc }; this.selectionEnd = { row, col: nc }; }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        {
          const nc = col + 1;
          this.selectedCell = { row, col: nc };
          if (e.shiftKey) { this.selectionEnd = { row: this.selectionEnd?.row ?? row, col: nc }; }
          else { this.selectionStart = { row, col: nc }; this.selectionEnd = { row, col: nc }; }
        }
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        if (!this.readonly) this.startEditing(row, col);
        return;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (!this.readonly) this.clearSelectedCells();
        return;
      default:
        return;
    }
    this.updateSelection();
  }

  @on('copy')
  handleCopy(e: ClipboardEvent) {
    const range = this.getSelectionRange();
    if (range && this.hasMultiSelection()) {
      const lines: string[] = [];
      for (let r = range.start.row; r <= range.end.row; r++) {
        const cells: string[] = [];
        for (let c = range.start.col; c <= range.end.col; c++) {
          cells.push(String(this.getCell(r, c) ?? ''));
        }
        lines.push(cells.join('\t'));
      }
      e.clipboardData?.setData('text/plain', lines.join('\n'));
    } else if (this.selectedCell) {
      e.clipboardData?.setData('text/plain', String(this.getCell(this.selectedCell.row, this.selectedCell.col) ?? ''));
    }
    e.preventDefault();
  }

  private async pasteFromClipboard(row: number, col: number) {
    if (this.readonly) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const rows = text.split('\n').filter(r => r.length > 0);
      for (let r = 0; r < rows.length; r++) {
        const cells = rows[r].split('\t');
        for (let c = 0; c < cells.length; c++) {
          this.setCell(row + r, col + c, cells[c]);
        }
      }
    } catch {
      // Clipboard read not available / permission denied — silently no-op.
    }
  }

  @on('paste')
  handlePaste(e: ClipboardEvent) {
    if (this.readonly || !this.selectedCell) return;
    const text = e.clipboardData?.getData('text/plain') || '';
    e.preventDefault();
    const rows = text.split('\n').filter(r => r.length > 0);
    const startRow = this.selectedCell.row;
    const startCol = this.selectedCell.col;
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].split('\t');
      for (let c = 0; c < cells.length; c++) {
        this.setCell(startRow + r, startCol + c, cells[c]);
      }
    }
  }

  // ── DOM: Rebuild ──

  private rebuild() {
    const wrapper = this.wrapperEl;
    if (!wrapper) return;

    if (!this.listenersAttached) {
      this.attachListeners();
      this.listenersAttached = true;
    }

    if (this.data.length === 0) {
      wrapper.innerHTML = '<div class="spreadsheet-empty">Double-click or start typing to add data</div>';
      this.updateFormulaBar();
      this.updateStatusBar();
      return;
    }

    const colCount = this.getColumnCount();
    const rowCount = this.data.length;
    let h = `<table class="spreadsheet-table" role="grid" aria-rowcount="${rowCount + 1}" aria-colcount="${colCount + 1}"><thead><tr role="row" aria-rowindex="1">`;
    h += '<th class="spreadsheet-row-num" scope="col" aria-colindex="1">&nbsp;</th>';
    for (let c = 0; c < colCount; c++) {
      const header = this.columns[c]?.header || this.colToLetter(c);
      const width = this.getColWidth(c);
      const sortAttr = this.sortCol === c
        ? (this.sortDir === 'asc' ? 'ascending' : 'descending')
        : 'none';
      h += `<th class="spreadsheet-th" scope="col" data-col="${c}" aria-colindex="${c + 2}" aria-sort="${sortAttr}" style="width:${width}px;position:relative">`;
      h += `<span class="spreadsheet-th-sort">${this.esc(header)}`;
      if (this.sortCol === c) {
        h += `<span class="spreadsheet-th-sort-icon active">${this.sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>`;
      }
      h += '</span>';
      h += `<div class="spreadsheet-resize-handle" data-resize-col="${c}"></div>`;
      h += '</th>';
    }
    h += '</tr></thead><tbody>';

    for (let r = 0; r < this.data.length; r++) {
      h += `<tr role="row" aria-rowindex="${r + 2}">`;
      h += `<th class="spreadsheet-row-num" scope="row" data-row="${r}" aria-colindex="1">${r + 1}</th>`;
      for (let c = 0; c < colCount; c++) {
        const rawValue = this.data[r]?.[c];
        const displayValue = this.resolveValue(rawValue);
        const colDef = this.columns[c];
        const cellType: CellType = colDef?.type || 'text';
        const width = this.getColWidth(c);
        const display = this.formatCellDisplay(displayValue, colDef);
        const contentClass = this.cellContentClass(cellType);
        h += `<td class="spreadsheet-td" role="gridcell" data-row="${r}" data-col="${c}" aria-colindex="${c + 2}" style="width:${width}px">`;
        h += `<span class="${contentClass}">${display}</span>`;
        h += '</td>';
      }
      h += '</tr>';
    }

    h += '</tbody></table>';

    wrapper.innerHTML = h;
    this.updateSelection();
  }

  // ── DOM: Event Delegation ──

  private attachListeners() {
    const wrapper = this.wrapperEl;
    if (!wrapper) return;

    wrapper.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      const resizeHandle = target.closest('.spreadsheet-resize-handle') as HTMLElement;
      if (resizeHandle) { this.handleResizeStart(parseInt(resizeHandle.dataset.resizeCol!), e); return; }
      const td = target.closest('td[data-row][data-col]') as HTMLElement;
      if (td && e.button === 0) {
        this.handleCellMouseDown(parseInt(td.dataset.row!), parseInt(td.dataset.col!), e);
      }
    });

    wrapper.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const th = target.closest('th.spreadsheet-th[data-col]') as HTMLElement;
      if (th) { this.handleHeaderClick(parseInt(th.dataset.col!)); return; }
      const rowNum = target.closest('td.spreadsheet-row-num[data-row]') as HTMLElement;
      if (rowNum) { this.handleRowClick(parseInt(rowNum.dataset.row!)); return; }
      if (target.closest('[data-action="add-row"]')) { this.addRow(); return; }
      if (target.closest('[data-action="add-col"]')) { this.addColumn(); return; }
    });

    wrapper.addEventListener('dblclick', (e) => {
      const target = e.target as HTMLElement;
      const td = target.closest('td[data-row][data-col]') as HTMLElement;
      if (td) { this.handleCellDblClick(parseInt(td.dataset.row!), parseInt(td.dataset.col!)); return; }
      if (target.closest('.spreadsheet-empty')) {
        this.data = [['']];
        requestAnimationFrame(() => this.startEditing(0, 0));
      }
    });

    wrapper.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const td = target.closest('td[data-row][data-col]') as HTMLElement;
      if (td) this.handleContextMenu(parseInt(td.dataset.row!), parseInt(td.dataset.col!), e);
    });

    if (this.formulaInputEl) {
      this.formulaInputEl.addEventListener('input', (e) => {
        if (this.selectedCell) {
          this.setCell(this.selectedCell.row, this.selectedCell.col, (e.target as HTMLInputElement).value);
        }
      });
    }

    if (this.contextMenuEl) {
      this.contextMenuEl.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('[data-ctx]') as HTMLElement;
        if (item) this.contextAction(item.dataset.ctx!);
      });
    }
  }

  // ── DOM: Targeted Updates ──

  private updateSelection() {
    const wrapper = this.wrapperEl;
    if (!wrapper) return;

    wrapper.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    wrapper.querySelectorAll('.in-range').forEach(el => el.classList.remove('in-range'));
    wrapper.querySelectorAll('.col-selected').forEach(el => el.classList.remove('col-selected'));
    wrapper.querySelectorAll('.row-selected').forEach(el => el.classList.remove('row-selected'));

    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      const cell = wrapper.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
      if (cell) cell.classList.add('selected');
      const colHeader = wrapper.querySelector(`th[data-col="${col}"]`);
      if (colHeader) colHeader.classList.add('col-selected');
      const rowNum = wrapper.querySelector(`td.spreadsheet-row-num[data-row="${row}"]`);
      if (rowNum) rowNum.classList.add('row-selected');
    }

    const range = this.getSelectionRange();
    if (range && this.hasMultiSelection()) {
      for (let r = range.start.row; r <= range.end.row; r++) {
        for (let c = range.start.col; c <= range.end.col; c++) {
          if (this.selectedCell && r === this.selectedCell.row && c === this.selectedCell.col) continue;
          const cell = wrapper.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
          if (cell) cell.classList.add('in-range');
        }
      }
    }

    this.updateFormulaBar();
    this.updateStatusBar();
    this.updateFillHandlePosition();
  }

  // ── Fill handle ─────────────────────────────────────────────────────────

  private updateFillHandlePosition() {
    const handle = this.fillHandleEl;
    if (!handle) return;
    // Hide while the user is mid-drag (either range select or fill drag).
    // Avoids two getBoundingClientRect calls per mousemove and keeps drag
    // hot-path costs to O(1) elementFromPoint only.
    if (this.readonly || this.editingCell || this.isDragging || this.fillSourceRange ||
        !this.selectionStart || !this.selectionEnd || !this.wrapperEl) {
      handle.hidden = true;
      return;
    }
    const range = this.getSelectionRange();
    if (!range) { handle.hidden = true; return; }
    const cell = this.wrapperEl.querySelector(
      `td.spreadsheet-td[data-row="${range.end.row}"][data-col="${range.end.col}"]`
    ) as HTMLElement | null;
    if (!cell) { handle.hidden = true; return; }
    const cellRect = cell.getBoundingClientRect();
    const hostRect = this.getBoundingClientRect();
    handle.style.left = `${cellRect.right - hostRect.left - 4}px`;
    handle.style.top = `${cellRect.bottom - hostRect.top - 4}px`;
    handle.hidden = false;
  }

  @on('mousedown', '.spreadsheet-fill-handle')
  private handleFillStart(e: MouseEvent) {
    if (this.readonly) return;
    const range = this.getSelectionRange();
    if (!range) return;
    e.preventDefault();
    e.stopPropagation();

    this.fillSourceRange = range;
    this.fillTargetEnd = { ...range.end };
    this.boundFillMove = (ev) => this.handleFillMove(ev);
    this.boundFillUp = () => this.handleFillEnd();
    document.addEventListener('mousemove', this.boundFillMove);
    document.addEventListener('mouseup', this.boundFillUp);
  }

  private handleFillMove(e: MouseEvent) {
    if (!this.fillSourceRange || !this.wrapperEl) return;
    const root = this.shadowRoot ?? document;
    const hit = (root as Document | ShadowRoot)
      .elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cell = hit?.closest('.spreadsheet-td') as HTMLElement | null;
    if (!cell) return;
    const r = parseInt(cell.dataset.row || '-1', 10);
    const c = parseInt(cell.dataset.col || '-1', 10);
    if (r < 0 || c < 0) return;
    if (r === this.fillTargetEnd?.row && c === this.fillTargetEnd?.col) return;
    this.fillTargetEnd = { row: r, col: c };
    this.refreshFillTargetHighlight();
  }

  private refreshFillTargetHighlight() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.fill-target')
      .forEach(el => el.classList.remove('fill-target'));
    const target = this.computeFillTargetRange();
    if (!target) return;
    for (let r = target.start.row; r <= target.end.row; r++) {
      for (let c = target.start.col; c <= target.end.col; c++) {
        // Don't mark the source range — only cells that will receive values.
        if (this.cellInRange(r, c, this.fillSourceRange!)) continue;
        const td = this.wrapperEl.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
        if (td) td.classList.add('fill-target');
      }
    }
  }

  /**
   * Snap the fill drag to either a vertical or horizontal extension of the
   * source range — whichever direction the pointer has moved further. Excel
   * does the same: you can only fill one axis at a time. The returned range
   * INCLUDES the source range; only cells outside the source receive values.
   */
  private computeFillTargetRange(): CellRange | null {
    const src = this.fillSourceRange;
    const end = this.fillTargetEnd;
    if (!src || !end) return null;
    const dRow = Math.max(0, end.row - src.end.row, src.start.row - end.row);
    const dCol = Math.max(0, end.col - src.end.col, src.start.col - end.col);
    if (dRow === 0 && dCol === 0) return src;
    if (dRow >= dCol) {
      return {
        start: { row: Math.min(src.start.row, end.row), col: src.start.col },
        end:   { row: Math.max(src.end.row, end.row),   col: src.end.col   },
      };
    }
    return {
      start: { row: src.start.row, col: Math.min(src.start.col, end.col) },
      end:   { row: src.end.row,   col: Math.max(src.end.col, end.col)   },
    };
  }

  private cellInRange(row: number, col: number, range: CellRange): boolean {
    return row >= range.start.row && row <= range.end.row
        && col >= range.start.col && col <= range.end.col;
  }

  private handleFillEnd() {
    if (this.boundFillMove) document.removeEventListener('mousemove', this.boundFillMove);
    if (this.boundFillUp) document.removeEventListener('mouseup', this.boundFillUp);
    this.boundFillMove = null;
    this.boundFillUp = null;

    const target = this.computeFillTargetRange();
    const source = this.fillSourceRange;
    this.fillSourceRange = null;
    this.fillTargetEnd = null;
    this.wrapperEl?.querySelectorAll('.fill-target').forEach(el => el.classList.remove('fill-target'));

    if (!source || !target) return;
    this.applyFill(source, target);

    // Extend the active selection to match the new range so the user can keep
    // working with the filled cells.
    this.selectionStart = { ...target.start };
    this.selectionEnd   = { ...target.end };
    this.updateSelection();
  }

  /**
   * Copy values from source range into target range. Source values cycle to
   * fill any extra rows or columns (Excel: drag-fill of a single value
   * repeats it; drag-fill of a 2-cell sequence repeats those two values —
   * arithmetic series detection is a future enhancement).
   *
   * Implementation note: mutates this.data in place across the whole fill,
   * then triggers a single re-render at the end. Calling the public setCell()
   * per cell would cause N full re-renders for an N-cell fill — fine for one
   * cell, awful for hundreds.
   */
  private applyFill(source: CellRange, target: CellRange) {
    const sRows = source.end.row - source.start.row + 1;
    const sCols = source.end.col - source.start.col + 1;
    let touched = 0;
    for (let r = target.start.row; r <= target.end.row; r++) {
      for (let c = target.start.col; c <= target.end.col; c++) {
        if (this.cellInRange(r, c, source)) continue;
        const sr = source.start.row + ((r - source.start.row) % sRows + sRows) % sRows;
        const sc = source.start.col + ((c - source.start.col) % sCols + sCols) % sCols;
        const newVal = this.data[sr]?.[sc];
        while (this.data.length <= r) this.data.push([]);
        while (this.data[r].length <= c) this.data[r].push('');
        const oldVal = this.data[r][c];
        if (oldVal === newVal) continue;
        this.data[r][c] = newVal;
        this.pushUndo({ row: r, col: c, oldValue: oldVal, newValue: newVal });
        this.emitCellChange(r, c, newVal, oldVal);
        touched++;
      }
    }
    if (touched > 0) {
      this.redoStack.length = 0;
      // One reassignment to trigger the @property re-render path.
      this.data = [...this.data];
    }
  }

  private updateFormulaBar() {
    if (this.cellRefEl) this.cellRefEl.textContent = this.getCellRef();
    if (this.formulaInputEl) {
      const rawVal = this.selectedCell
        ? String(this.data[this.selectedCell.row]?.[this.selectedCell.col] ?? '')
        : '';
      if (this.formulaInputEl.value !== rawVal) {
        this.formulaInputEl.value = rawVal;
      }
      this.formulaInputEl.readOnly = this.readonly;
    }
  }

  private updateStatusBar() {
    if (!this.statusBarEl) return;
    const stats = this.getSelectionStats();
    if (stats) {
      this.statusBarEl.innerHTML =
        `<span class="spreadsheet-status-item"><span class="spreadsheet-status-label">Count:</span><span class="spreadsheet-status-value">${stats.count}</span></span>` +
        `<span class="spreadsheet-status-item"><span class="spreadsheet-status-label">Sum:</span><span class="spreadsheet-status-value">${stats.sum.toFixed(2)}</span></span>` +
        `<span class="spreadsheet-status-item"><span class="spreadsheet-status-label">Avg:</span><span class="spreadsheet-status-value">${stats.avg.toFixed(2)}</span></span>`;
    } else {
      this.statusBarEl.innerHTML = '';
    }
  }

  // ── HTML Helpers ──

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escAttr(str: string): string {
    return this.esc(str).replace(/"/g, '&quot;');
  }

  // ── Display Formatting ──

  /**
   * Render a raw cell value as the display string for its column type. Returns
   * an HTML-safe string (already escaped). Falls back gracefully when values
   * don't match the declared type — invalid number stays raw, invalid date
   * stays raw — so the user can fix bad data without the cell going blank.
   */
  private formatCellDisplay(value: any, colDef?: SpreadsheetColumn): string {
    if (value == null || value === '') return '';
    const type = colDef?.type || 'text';
    const fmt = colDef?.format;

    if (type === 'boolean') {
      return value ? '✓' : '✗';
    }

    if (type === 'number' || type === 'currency' || type === 'percent') {
      const n = typeof value === 'number' ? value : parseFloat(String(value));
      if (!Number.isFinite(n)) return this.esc(String(value));
      const opts = this.numberFormatOptions(type, fmt);
      try {
        return this.esc(new Intl.NumberFormat(fmt?.locale, opts).format(n));
      } catch {
        return this.esc(String(n));
      }
    }

    if (type === 'date' || type === 'datetime') {
      const d = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(d.getTime())) return this.esc(String(value));
      const opts = this.dateFormatOptions(type, fmt);
      try {
        return this.esc(new Intl.DateTimeFormat(fmt?.locale, opts).format(d));
      } catch {
        return this.esc(String(value));
      }
    }

    return this.esc(String(value));
  }

  private numberFormatOptions(
    type: 'number' | 'currency' | 'percent',
    fmt?: SpreadsheetColumnFormat
  ): Intl.NumberFormatOptions {
    const intl = (fmt?.intlOptions as Intl.NumberFormatOptions | undefined);
    if (intl) return intl;
    if (type === 'currency') {
      return {
        style: 'currency',
        currency: fmt?.currency || 'USD',
        minimumFractionDigits: fmt?.decimals ?? 2,
        maximumFractionDigits: fmt?.decimals ?? 2,
      };
    }
    if (type === 'percent') {
      return {
        style: 'percent',
        minimumFractionDigits: fmt?.decimals ?? 0,
        maximumFractionDigits: fmt?.decimals ?? 0,
      };
    }
    // 'number' — auto-trim trailing zeros up to 6 decimals by default; user
    // can pin a precise count via format.decimals.
    if (fmt?.decimals != null) {
      return {
        minimumFractionDigits: fmt.decimals,
        maximumFractionDigits: fmt.decimals,
      };
    }
    return { maximumFractionDigits: 6 };
  }

  private dateFormatOptions(
    type: 'date' | 'datetime',
    fmt?: SpreadsheetColumnFormat
  ): Intl.DateTimeFormatOptions {
    const intl = (fmt?.intlOptions as Intl.DateTimeFormatOptions | undefined);
    if (intl) return intl;
    if (type === 'datetime') {
      return { dateStyle: fmt?.dateStyle || 'medium', timeStyle: fmt?.timeStyle || 'short' };
    }
    // Date-only strings ('2022-03-15') parse as UTC midnight. Without pinning
    // the format to UTC, a viewer west of GMT would see the previous day.
    // Date-only columns must display the literal date regardless of TZ.
    return { dateStyle: fmt?.dateStyle || 'medium', timeZone: 'UTC' };
  }

  private cellContentClass(type: CellType): string {
    if (type === 'number' || type === 'currency' || type === 'percent') {
      return 'spreadsheet-cell spreadsheet-cell-number';
    }
    if (type === 'boolean') return 'spreadsheet-cell spreadsheet-cell-boolean';
    if (type === 'date' || type === 'datetime') return 'spreadsheet-cell spreadsheet-cell-date';
    return 'spreadsheet-cell';
  }

  // ── Events ──

  @dispatch('cell-change', { bubbles: true, composed: true })
  private emitCellChange(row: number, col: number, value: any, oldValue: any) {
    return { row, col, value, oldValue };
  }

  @dispatch('cell-select', { bubbles: true, composed: true })
  private emitCellSelect(row: number, col: number) {
    return { row, col };
  }

  @dispatch('row-select', { bubbles: true, composed: true })
  private emitRowSelect(row: number) {
    return { row };
  }

  @dispatch('column-sort', { bubbles: true, composed: true })
  private emitColumnSort(col: number, direction: 'asc' | 'desc') {
    return { col, direction };
  }

  // ── Shell Render ──

  @render({ once: true })
  renderSheet() {
    return html`
      <div class="spreadsheet-formula-bar" part="formula-bar">
        <span class="spreadsheet-cell-ref"></span>
        <input class="spreadsheet-formula-input" />
      </div>
      <div class="spreadsheet-find-bar" part="find-bar" hidden>
        <div class="spreadsheet-find-row">
          <input class="spreadsheet-find-input" type="text" placeholder="Find" aria-label="Find" />
          <span class="spreadsheet-find-count" aria-live="polite"></span>
          <button class="spreadsheet-find-btn" data-find-action="prev" title="Previous (Shift+Enter)" aria-label="Previous match">↑</button>
          <button class="spreadsheet-find-btn" data-find-action="next" title="Next (Enter)" aria-label="Next match">↓</button>
          <label class="spreadsheet-find-toggle" title="Match case">
            <input type="checkbox" data-find-action="case" /> Aa
          </label>
          <button class="spreadsheet-find-btn" data-find-action="close" title="Close (Esc)" aria-label="Close find">×</button>
        </div>
        <div class="spreadsheet-find-row spreadsheet-find-replace-row" hidden>
          <input class="spreadsheet-replace-input" type="text" placeholder="Replace" aria-label="Replace" />
          <button class="spreadsheet-find-btn" data-find-action="replace">Replace</button>
          <button class="spreadsheet-find-btn" data-find-action="replace-all">Replace all</button>
        </div>
      </div>
      <div class="spreadsheet" part="base" tabindex="0"></div>
      <div class="spreadsheet-fill-handle" part="fill-handle" hidden aria-hidden="true"></div>
      <div class="spreadsheet-status-bar" part="status-bar"></div>
      <div class="spreadsheet-context-menu" part="context-menu" hidden>
        <div class="spreadsheet-context-item" data-ctx="cut"><span>Cut</span><span class="spreadsheet-context-item-shortcut">Ctrl+X</span></div>
        <div class="spreadsheet-context-item" data-ctx="copy"><span>Copy</span><span class="spreadsheet-context-item-shortcut">Ctrl+C</span></div>
        <div class="spreadsheet-context-item" data-ctx="paste"><span>Paste</span><span class="spreadsheet-context-item-shortcut">Ctrl+V</span></div>
        <div class="spreadsheet-context-separator"></div>
        <div class="spreadsheet-context-item" data-ctx="insert-row-above"><span>Insert Row Above</span></div>
        <div class="spreadsheet-context-item" data-ctx="insert-row-below"><span>Insert Row Below</span></div>
        <div class="spreadsheet-context-item" data-ctx="delete-row"><span>Delete Row</span></div>
        <div class="spreadsheet-context-separator"></div>
        <div class="spreadsheet-context-item" data-ctx="insert-col-left"><span>Insert Column Left</span></div>
        <div class="spreadsheet-context-item" data-ctx="insert-col-right"><span>Insert Column Right</span></div>
        <div class="spreadsheet-context-item" data-ctx="delete-col"><span>Delete Column</span></div>
        <div class="spreadsheet-context-separator"></div>
        <div class="spreadsheet-context-item" data-ctx="clear"><span>Clear Cell(s)</span><span class="spreadsheet-context-item-shortcut">Del</span></div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'snice-spreadsheet': SniceSpreadsheet;
  }
}
