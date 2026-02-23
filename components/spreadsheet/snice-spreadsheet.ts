import { element, property, query, ready, render, styles, dispatch, watch, on, html, css } from 'snice';
import type { SpreadsheetColumn, CellPosition, CellRange, UndoEntry, SniceSpreadsheetElement } from './snice-spreadsheet.types';
import sheetStyles from './snice-spreadsheet.css?inline';

@element('snice-spreadsheet')
export class SniceSpreadsheet extends HTMLElement implements SniceSpreadsheetElement {
  @property({ type: Array }) data: any[][] = [];
  @property({ type: Array }) columns: SpreadsheetColumn[] = [];
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

  @styles()
  componentStyles() {
    return css`${sheetStyles}`;
  }

  @ready()
  init() {
    this.rebuild();
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
            const raw = this.data[r][c];
            const val = typeof raw === 'string' && raw.startsWith('=') ? this.resolveValue(raw) : raw;
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (!isNaN(num)) values.push(num);
          }
        }
      }
      return values;
    }
    const ref = this.parseCellRef(rangeStr.trim());
    if (ref && ref.row < this.data.length && ref.col < (this.data[ref.row]?.length || 0)) {
      const val = this.resolveValue(this.data[ref.row][ref.col]);
      return [typeof val === 'number' ? val : parseFloat(val)].filter(v => !isNaN(v));
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
    const cells = this.wrapperEl.querySelectorAll('.spreadsheet-td');
    let closestRow = -1, closestCol = -1, minDist = Infinity;
    cells.forEach(cell => {
      const r = parseInt(cell.getAttribute('data-row') || '-1');
      const c = parseInt(cell.getAttribute('data-col') || '-1');
      if (r < 0 || c < 0) return;
      const rect = cell.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
      if (dist < minDist) { minDist = dist; closestRow = r; closestCol = c; }
    });
    if (closestRow >= 0 && (closestRow !== this.selectionEnd?.row || closestCol !== this.selectionEnd?.col)) {
      this.selectionEnd = { row: closestRow, col: closestCol };
      this.updateSelection();
    }
  }

  private handleDragEnd() {
    this.isDragging = false;
    if (this.boundDragMove) { document.removeEventListener('mousemove', this.boundDragMove); this.boundDragMove = null; }
    if (this.boundDragUp) { document.removeEventListener('mouseup', this.boundDragUp); this.boundDragUp = null; }
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
    const cellType = colDef?.type || 'text';
    const display = cellType === 'boolean'
      ? (displayValue ? '\u2713' : '\u2717')
      : (displayValue != null ? this.esc(String(displayValue)) : '');
    const contentClass = cellType === 'number' ? 'spreadsheet-cell spreadsheet-cell-number'
      : cellType === 'boolean' ? 'spreadsheet-cell spreadsheet-cell-boolean'
      : 'spreadsheet-cell';
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

  // ── Keyboard ──

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); this.undo(); return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault(); this.redo(); return;
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
    if (!wrapper) {
      requestAnimationFrame(() => this.rebuild());
      return;
    }

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
    let h = '<table class="spreadsheet-table"><thead><tr>';
    h += '<th class="spreadsheet-row-num">&nbsp;</th>';
    for (let c = 0; c < colCount; c++) {
      const header = this.columns[c]?.header || this.colToLetter(c);
      const width = this.getColWidth(c);
      h += `<th class="spreadsheet-th" data-col="${c}" style="width:${width}px;position:relative">`;
      h += `<span class="spreadsheet-th-sort">${this.esc(header)}`;
      if (this.sortCol === c) {
        h += `<span class="spreadsheet-th-sort-icon active">${this.sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>`;
      }
      h += '</span>';
      h += `<div class="spreadsheet-resize-handle" data-resize-col="${c}"></div>`;
      h += '</th>';
    }
    h += '<th class="spreadsheet-add-col-header" data-action="add-col">+</th>';
    h += '</tr></thead><tbody>';

    for (let r = 0; r < this.data.length; r++) {
      h += '<tr>';
      h += `<td class="spreadsheet-row-num" data-row="${r}">${r + 1}</td>`;
      for (let c = 0; c < colCount; c++) {
        const rawValue = this.data[r]?.[c];
        const displayValue = this.resolveValue(rawValue);
        const colDef = this.columns[c];
        const cellType = colDef?.type || 'text';
        const width = this.getColWidth(c);
        const display = cellType === 'boolean'
          ? (displayValue ? '\u2713' : '\u2717')
          : (displayValue != null ? this.esc(String(displayValue)) : '');
        const contentClass = cellType === 'number' ? 'spreadsheet-cell spreadsheet-cell-number'
          : cellType === 'boolean' ? 'spreadsheet-cell spreadsheet-cell-boolean'
          : 'spreadsheet-cell';
        h += `<td class="spreadsheet-td" data-row="${r}" data-col="${c}" style="width:${width}px">`;
        h += `<span class="${contentClass}">${display}</span>`;
        h += '</td>';
      }
      h += '<td class="spreadsheet-add-col-cell"></td>';
      h += '</tr>';
    }

    h += '<tr class="spreadsheet-add-row" data-action="add-row">';
    h += '<td class="spreadsheet-row-num" style="position:sticky;left:0">+</td>';
    for (let c = 0; c <= colCount; c++) h += '<td></td>';
    h += '</tr></tbody></table>';

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
      <div class="spreadsheet-formula-bar">
        <span class="spreadsheet-cell-ref"></span>
        <input class="spreadsheet-formula-input" />
      </div>
      <div class="spreadsheet" tabindex="0"></div>
      <div class="spreadsheet-status-bar"></div>
      <div class="spreadsheet-context-menu" hidden>
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
