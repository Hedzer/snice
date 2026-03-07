/**
 * Keyboard navigation and ARIA for snice-table.
 * Full WAI-ARIA grid pattern with arrow key navigation.
 */

export interface KeyboardOptions {
  /** The shadow root containing the table */
  shadowRoot: ShadowRoot;
  /** Callback when a cell is activated (Enter) */
  onCellActivate?: (rowIndex: number, columnKey: string) => void;
  /** Callback when selection changes via keyboard */
  onSelectionToggle?: (rowIndex: number) => void;
  /** Callback for select-all (Ctrl+A) */
  onSelectAll?: () => void;
  /** Tab navigation mode */
  tabMode: 'none' | 'content' | 'header' | 'all';
  /** Total data rows (for virtualized tables) */
  totalRows: number;
  /** Total columns */
  totalColumns: number;
  /** Whether editing is active */
  isEditing: () => boolean;
}

export class TableKeyboard {
  private options: KeyboardOptions;
  private focusedRow = -1;   // -1 = header
  private focusedCol = 0;
  private keyHandler: (e: KeyboardEvent) => void;
  private attached = false;

  constructor() {
    this.options = {} as KeyboardOptions;
    this.keyHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
  }

  attach(options: KeyboardOptions) {
    this.options = options;
    const table = this.getTable();
    if (table) {
      table.setAttribute('role', 'grid');
      table.setAttribute('tabindex', '0');
      table.addEventListener('keydown', this.keyHandler);
      this.attached = true;
      this.applyARIA();
    }
  }

  detach() {
    const table = this.getTable();
    if (table) {
      table.removeEventListener('keydown', this.keyHandler);
    }
    this.attached = false;
  }

  private getTable(): HTMLElement | null {
    return this.options.shadowRoot?.querySelector('table') ?? null;
  }

  /** Apply ARIA attributes to the grid */
  applyARIA() {
    const table = this.getTable();
    if (!table) return;

    table.setAttribute('aria-rowcount', String(this.options.totalRows + 1)); // +1 for header
    table.setAttribute('aria-colcount', String(this.options.totalColumns));

    // Header row
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      headerRow.setAttribute('role', 'row');
      headerRow.setAttribute('aria-rowindex', '1');
      const ths = headerRow.querySelectorAll('th');
      ths.forEach((th, i) => {
        th.setAttribute('role', 'columnheader');
        th.setAttribute('aria-colindex', String(i + 1));

        // Sort state
        if (th.classList.contains('sortable')) {
          const sortIndicator = th.querySelector('.sort-indicator.active');
          if (sortIndicator) {
            const text = sortIndicator.textContent?.trim() || '';
            if (text.includes('▲')) th.setAttribute('aria-sort', 'ascending');
            else if (text.includes('▼')) th.setAttribute('aria-sort', 'descending');
          } else {
            th.setAttribute('aria-sort', 'none');
          }
        }
      });
    }

    // Body rows
    const bodyRows = table.querySelectorAll('tbody tr:not(.virtual-spacer)');
    bodyRows.forEach((row, i) => {
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', String(i + 2)); // +2 for 1-based + header

      const isSelected = row.getAttribute('data-selected') === 'true';
      if (isSelected) row.setAttribute('aria-selected', 'true');
      else row.removeAttribute('aria-selected');

      const cells = row.querySelectorAll('td');
      cells.forEach((cell, j) => {
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-colindex', String(j + 1));
      });
    });

    // Set roving tabindex on focused cell
    this.updateFocusIndicator();
  }

  /** Set focus position */
  setFocus(row: number, col: number) {
    this.focusedRow = row;
    this.focusedCol = col;
    this.updateFocusIndicator();
  }

  /** Get current focus position */
  getFocus(): { row: number; col: number } {
    return { row: this.focusedRow, col: this.focusedCol };
  }

  private updateFocusIndicator() {
    const table = this.getTable();
    if (!table) return;

    // Remove previous focus
    table.querySelectorAll('[data-grid-focus]').forEach(el => {
      el.removeAttribute('data-grid-focus');
      el.removeAttribute('tabindex');
    });

    // Find target cell
    let targetCell: HTMLElement | null = null;
    if (this.focusedRow === -1) {
      // Header
      const ths = table.querySelectorAll('thead th');
      targetCell = ths[this.focusedCol] as HTMLElement;
    } else {
      const rows = table.querySelectorAll('tbody tr:not(.virtual-spacer)');
      const row = rows[this.focusedRow] as HTMLElement;
      if (row) {
        const cells = row.querySelectorAll('td');
        targetCell = cells[this.focusedCol] as HTMLElement;
      }
    }

    if (targetCell) {
      targetCell.setAttribute('data-grid-focus', 'true');
      targetCell.setAttribute('tabindex', '0');
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Don't handle when editing
    if (this.options.isEditing()) return;

    const { totalRows, totalColumns } = this.options;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusedRow = Math.min(totalRows - 1, this.focusedRow + 1);
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.focusedRow = Math.max(-1, this.focusedRow - 1);
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.focusedCol = Math.min(totalColumns - 1, this.focusedCol + 1);
        this.updateFocusIndicator();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.focusedCol = Math.max(0, this.focusedCol - 1);
        this.updateFocusIndicator();
        break;

      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          this.focusedRow = -1;
          this.focusedCol = 0;
        } else {
          this.focusedCol = 0;
        }
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          this.focusedRow = totalRows - 1;
          this.focusedCol = totalColumns - 1;
        } else {
          this.focusedCol = totalColumns - 1;
        }
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case 'PageDown':
        e.preventDefault();
        this.focusedRow = Math.min(totalRows - 1, this.focusedRow + 10);
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case 'PageUp':
        e.preventDefault();
        this.focusedRow = Math.max(0, this.focusedRow - 10);
        this.updateFocusIndicator();
        this.scrollIntoView();
        break;

      case ' ':
        if (this.focusedRow >= 0) {
          e.preventDefault();
          if (e.shiftKey) {
            this.options.onSelectionToggle?.(this.focusedRow);
          }
        }
        break;

      case 'Enter':
        if (this.focusedRow >= 0 && this.focusedCol >= 0) {
          e.preventDefault();
          const table = this.getTable();
          const rows = table?.querySelectorAll('tbody tr:not(.virtual-spacer)');
          const row = rows?.[this.focusedRow];
          const cells = row?.querySelectorAll('td');
          const cell = cells?.[this.focusedCol];
          const columnKey = cell?.getAttribute('data-key') || '';
          this.options.onCellActivate?.(this.focusedRow, columnKey);
        }
        break;

      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.options.onSelectAll?.();
        }
        break;

      case 'Escape':
        // Let this bubble up to cancel editing
        break;
    }
  }

  private scrollIntoView() {
    const table = this.getTable();
    if (!table) return;

    const focusedEl = table.querySelector('[data-grid-focus]') as HTMLElement;
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      focusedEl.focus({ preventScroll: true });
    }
  }

  isAttached(): boolean {
    return this.attached;
  }
}
