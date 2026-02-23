import { element, property, render, styles, dispatch, watch, on, html, css } from 'snice';
import type { SpreadsheetColumn, CellPosition, SniceSpreadsheetElement } from './snice-spreadsheet.types';
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

  @styles()
  componentStyles() {
    return css`${sheetStyles}`;
  }

  @watch('data')
  handleDataChange() {
    // Re-render on data change
  }

  // Public API

  getCell(row: number, col: number): any {
    if (row >= 0 && row < this.data.length && col >= 0 && col < (this.data[row]?.length || 0)) {
      return this.resolveValue(this.data[row][col]);
    }
    return undefined;
  }

  setCell(row: number, col: number, value: any): void {
    if (row < 0 || col < 0) return;

    // Expand data if needed
    while (this.data.length <= row) {
      this.data.push([]);
    }
    while (this.data[row].length <= col) {
      this.data[row].push('');
    }

    const oldValue = this.data[row][col];
    this.data[row][col] = value;
    this.data = [...this.data]; // trigger reactivity
    this.emitCellChange(row, col, value, oldValue);
  }

  getData(): any[][] {
    return this.data.map(row => [...row]);
  }

  setData(data: any[][]): void {
    this.data = data.map(row => [...row]);
  }

  // Formula support
  private resolveValue(value: any): any {
    if (typeof value !== 'string' || !value.startsWith('=')) return value;

    const formula = value.substring(1).toUpperCase().trim();
    try {
      return this.evaluateFormula(formula);
    } catch {
      return '#ERROR';
    }
  }

  private evaluateFormula(formula: string): any {
    // Parse function calls: SUM(A1:B3), AVG(A1:A5), etc.
    const fnMatch = formula.match(/^(SUM|AVG|AVERAGE|COUNT|MIN|MAX)\(([^)]+)\)$/);
    if (!fnMatch) return '#ERROR';

    const fn = fnMatch[1];
    const rangeStr = fnMatch[2];
    const values = this.resolveRange(rangeStr);

    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));

    switch (fn) {
      case 'SUM':
        return nums.reduce((a, b) => a + b, 0);
      case 'AVG':
      case 'AVERAGE':
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'COUNT':
        return nums.length;
      case 'MIN':
        return nums.length > 0 ? Math.min(...nums) : 0;
      case 'MAX':
        return nums.length > 0 ? Math.max(...nums) : 0;
      default:
        return '#ERROR';
    }
  }

  private resolveRange(rangeStr: string): any[] {
    // Parse cell references like A1:B3
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

    // Single cell
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
    for (const ch of match[1]) {
      col = col * 26 + (ch.charCodeAt(0) - 64);
    }
    col -= 1; // 0-indexed

    const row = parseInt(match[2], 10) - 1; // 0-indexed
    return { row, col };
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

  // Interaction handlers

  private handleCellClick(row: number, col: number) {
    if (this.editingCell) {
      this.commitEdit();
    }
    this.selectedCell = { row, col };
    this.editingCell = null;
    this.emitCellSelect(row, col);
  }

  private handleCellDblClick(row: number, col: number) {
    if (this.readonly) return;
    this.editingCell = { row, col };
    const raw = this.data[row]?.[col];
    this.editValue = raw !== undefined && raw !== null ? String(raw) : '';
  }

  private handleRowClick(row: number) {
    this.selectedCell = { row, col: 0 };
    this.emitRowSelect(row);
  }

  private handleHeaderClick(col: number) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }

    this.data = [...this.data].sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    this.emitColumnSort(col, this.sortDir);
  }

  private handleEditInput(e: Event) {
    this.editValue = (e.target as HTMLInputElement).value;
  }

  private handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.commitEdit();
      if (this.selectedCell && this.selectedCell.row < this.data.length - 1) {
        this.selectedCell = { row: this.selectedCell.row + 1, col: this.selectedCell.col };
      }
    } else if (e.key === 'Escape') {
      this.editingCell = null;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.commitEdit();
      if (this.selectedCell) {
        const nextCol = e.shiftKey ? this.selectedCell.col - 1 : this.selectedCell.col + 1;
        if (nextCol >= 0) {
          this.selectedCell = { row: this.selectedCell.row, col: nextCol };
        }
      }
    }
  }

  private commitEdit() {
    if (!this.editingCell) return;

    const { row, col } = this.editingCell;
    let value: any = this.editValue;

    // Auto-detect type
    const colDef = this.columns[col];
    const type = colDef?.type || 'text';

    if (type === 'number' && !value.startsWith('=')) {
      const num = parseFloat(value);
      if (!isNaN(num)) value = num;
    } else if (type === 'boolean') {
      value = value === 'true' || value === '1';
    }

    this.setCell(row, col, value);
    this.editingCell = null;
  }

  private handleCheckboxChange(row: number, col: number, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.setCell(row, col, checked);
  }

  private handleSelectChange(row: number, col: number, e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    this.setCell(row, col, value);
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (this.editingCell) return; // Let edit handle keys
    if (!this.selectedCell) return;

    const { row, col } = this.selectedCell;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) this.selectedCell = { row: row - 1, col };
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < this.data.length - 1) this.selectedCell = { row: row + 1, col };
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) this.selectedCell = { row, col: col - 1 };
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.selectedCell = { row, col: col + 1 };
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        if (!this.readonly) this.handleCellDblClick(row, col);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (!this.readonly) this.setCell(row, col, '');
        break;
    }
  }

  // Copy support
  @on('copy')
  handleCopy(e: ClipboardEvent) {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    const value = this.getCell(row, col);
    e.clipboardData?.setData('text/plain', String(value ?? ''));
    e.preventDefault();
  }

  @on('paste')
  handlePaste(e: ClipboardEvent) {
    if (this.readonly || !this.selectedCell) return;
    const text = e.clipboardData?.getData('text/plain') || '';
    e.preventDefault();

    // Support pasting multi-cell data (tab-separated)
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

  // Events

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

  // Render

  private getColumnCount(): number {
    return Math.max(
      this.columns.length,
      ...this.data.map(row => row?.length || 0),
      1
    );
  }

  @render()
  renderSheet() {
    const colCount = this.getColumnCount();
    const isEditing = (r: number, c: number) => this.editingCell?.row === r && this.editingCell?.col === c;
    const isSelected = (r: number, c: number) => this.selectedCell?.row === r && this.selectedCell?.col === c;

    return html`
      <div class="spreadsheet-formula-bar">
        <span class="spreadsheet-cell-ref">${this.getCellRef()}</span>
        <input
          class="spreadsheet-formula-input"
          .value=${this.selectedCell ? String(this.data[this.selectedCell.row]?.[this.selectedCell.col] ?? '') : ''}
          ?readonly=${this.readonly}
          @input=${(e: Event) => {
            if (this.selectedCell) {
              const val = (e.target as HTMLInputElement).value;
              this.setCell(this.selectedCell.row, this.selectedCell.col, val);
            }
          }}
        />
      </div>
      <div class="spreadsheet" tabindex="0">
        <table class="spreadsheet-table">
          <thead>
            <tr>
              <th class="spreadsheet-th spreadsheet-row-num">&nbsp;</th>
              ${Array.from({ length: colCount }, (_, c) => {
                const col = this.columns[c];
                const header = col?.header || this.colToLetter(c);
                const isSorted = this.sortCol === c;
                const arrow = isSorted ? (this.sortDir === 'asc' ? '\u25B2' : '\u25BC') : '';
                return html`
                  <th
                    class="spreadsheet-th"
                    style="${col?.width ? `width: ${col.width}px` : ''}"
                    @click=${() => this.handleHeaderClick(c)}
                  >
                    <span class="spreadsheet-th-sort">
                      ${header}
                      <if ${isSorted}>
                        <span class="spreadsheet-th-sort-icon active">${arrow}</span>
                      </if>
                    </span>
                  </th>
                `;
              })}
            </tr>
          </thead>
          <tbody>
            ${this.data.map((row, r) => html`
              <tr>
                <td
                  class="spreadsheet-row-num ${this.selectedCell?.row === r ? 'selected' : ''}"
                  @click=${() => this.handleRowClick(r)}
                >${r + 1}</td>
                ${Array.from({ length: colCount }, (_, c) => {
                  const colDef = this.columns[c];
                  const cellType = colDef?.type || 'text';
                  const rawValue = row[c];
                  const displayValue = this.resolveValue(rawValue);
                  const editing = isEditing(r, c);
                  const selected = isSelected(r, c);

                  const cellClass = [
                    'spreadsheet-td',
                    selected ? 'selected' : '',
                  ].filter(Boolean).join(' ');

                  if (editing && !this.readonly) {
                    if (cellType === 'boolean') {
                      return html`
                        <td class="${cellClass}">
                          <div class="spreadsheet-checkbox">
                            <input type="checkbox" ?checked=${!!rawValue} @change=${(e: Event) => this.handleCheckboxChange(r, c, e)} />
                          </div>
                        </td>
                      `;
                    }
                    if (cellType === 'select' && colDef?.options) {
                      return html`
                        <td class="${cellClass}">
                          <select class="spreadsheet-select" .value=${String(rawValue || '')} @change=${(e: Event) => this.handleSelectChange(r, c, e)}>
                            ${colDef.options.map(opt => html`<option value="${opt}" ?selected=${rawValue === opt}>${opt}</option>`)}
                          </select>
                        </td>
                      `;
                    }
                    return html`
                      <td class="${cellClass}">
                        <input
                          class="spreadsheet-input"
                          type="${cellType === 'number' ? 'number' : cellType === 'date' ? 'date' : 'text'}"
                          .value=${this.editValue}
                          @input=${(e: Event) => this.handleEditInput(e)}
                          @keydown=${(e: KeyboardEvent) => this.handleEditKeydown(e)}
                          @blur=${() => this.commitEdit()}
                        />
                      </td>
                    `;
                  }

                  const contentClass = [
                    'spreadsheet-cell',
                    cellType === 'number' ? 'spreadsheet-cell-number' : '',
                    cellType === 'boolean' ? 'spreadsheet-cell-boolean' : '',
                  ].filter(Boolean).join(' ');

                  const display = cellType === 'boolean'
                    ? (displayValue ? '\u2713' : '\u2717')
                    : (displayValue !== undefined && displayValue !== null ? String(displayValue) : '');

                  return html`
                    <td
                      class="${cellClass}"
                      @click=${() => this.handleCellClick(r, c)}
                      @dblclick=${() => this.handleCellDblClick(r, c)}
                    >
                      <span class="${contentClass}">${display}</span>
                    </td>
                  `;
                })}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-spreadsheet': SniceSpreadsheet;
  }
}
