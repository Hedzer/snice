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
  /**
   * Total data rows. A getter callback keeps bounds live as the dataset is
   * loaded / filtered / paginated; a plain number is accepted for callers that
   * re-attach on every change.
   */
  totalRows: number | (() => number);
  /** Total columns. Getter callback or plain number — see `totalRows`. */
  totalColumns: number | (() => number);
  /**
   * Total rows exposed to assistive technology. This may exceed the keyboard
   * navigation count when the body also contains non-focusable group and
   * aggregate rows. Defaults to totalRows.
   */
  ariaRows?: number | (() => number);
  /** Zero-based logical offset of the first rendered body row (virtual grids). */
  ariaRowOffset?: number | (() => number);
  /**
   * Resolve a keyboard-navigation row to its rendered <tr>. Grouping/filtering
   * can make navigation order differ from raw data-index order.
   */
  getRowElement?: (rowIndex: number) => HTMLElement | null;
  /**
   * Bring a logical (data-index) row into the rendered window before focus
   * lands on it. Under virtualization only the current window is in the DOM;
   * the host scrolls the row's range into view and renders it synchronously.
   */
  ensureRowVisible?: (rowIndex: number) => void;
  /** Whether editing is active */
  isEditing: () => boolean;
}

export class TableKeyboard {
  private options: KeyboardOptions;
  private focusedRow = -1;   // -1 = header
  /** True after the first real user keydown — no focus paint at rest. */
  private hasUserInteracted = false;
  private focusedCol = 0;
  // EventListener-typed: ShadowRoot's TS event map only knows 'slotchange',
  // so a KeyboardEvent-typed handler fails the addEventListener overloads.
  private keyHandler: EventListener;
  private attached = false;

  constructor() {
    this.options = {} as KeyboardOptions;
    this.keyHandler = (e: Event) => this.handleKeyDown(e as KeyboardEvent);
  }

  attach(options: KeyboardOptions) {
    this.options = options;
    const root = options.shadowRoot;
    if (!root) return;

    // Delegate keydown at the shadow root — a stable ancestor that always
    // exists (even before the first render) and survives every <table> rebuild.
    // Every keydown inside the shadow tree bubbles here, so navigation works no
    // matter when data/columns arrive or how often renderHeader/renderBody
    // replace the table structure. Binding to the inner <table> instead meant a
    // table built after @ready was never listened to, and a rebuilt table
    // silently dropped the listener.
    root.addEventListener('keydown', this.keyHandler);
    this.attached = true;
    this.syncGridRole();
    this.applyARIA();
  }

  detach() {
    this.options.shadowRoot?.removeEventListener('keydown', this.keyHandler);
    this.attached = false;
  }

  /**
   * (Re)apply the grid identity to the current <table>: role=grid, a focusable
   * tabindex, and live row/col counts. Cheap, idempotent, and safe to call
   * before the table exists (no-op). A structural rebuild that swaps the
   * <table> node drops these attributes, so they must be re-applied afterwards.
   */
  private syncGridRole() {
    const table = this.getTable();
    if (!table) return;

    table.setAttribute('role', 'grid');
    table.setAttribute('tabindex', '0');
    table.setAttribute('aria-rowcount', String(this.ariaRowCount + 1)); // +1 header
    table.setAttribute('aria-colcount', String(this.totalColCount));
  }

  /**
   * Host hook: called after renderHeader/renderBody rebuild the table. The
   * delegated keydown listener lives on the shadow root so it survives on its
   * own; this restores the grid role and the roving tabindex on the focused
   * cell, both of which a wiped thead/tbody (or a swapped <table>) would lose.
   */
  refresh() {
    if (!this.attached) return;

    this.syncGridRole();
    this.applyARIA();
  }

  private getTable(): HTMLElement | null {
    return this.options.shadowRoot?.querySelector('table') ?? null;
  }

  /** Resolve a bound that may be a live getter or a static number. */
  private resolveBound(v: number | (() => number) | undefined): number {
    return typeof v === 'function' ? v() : (v ?? 0);
  }

  private get totalRowCount(): number {
    return this.resolveBound(this.options.totalRows);
  }

  private get totalColCount(): number {
    return this.resolveBound(this.options.totalColumns);
  }

  private get ariaRowCount(): number {
    return this.resolveBound(this.options.ariaRows ?? this.options.totalRows);
  }

  private get ariaRowOffset(): number {
    return Math.max(0, this.resolveBound(this.options.ariaRowOffset));
  }

  /** Resolve a body row by its logical data-index (not its DOM position). */
  private getBodyRow(index: number): HTMLElement | null {
    if (this.options.getRowElement) return this.options.getRowElement(index);
    const table = this.getTable();
    if (!table) return null;
    return table.querySelector(`tbody tr[data-index="${index}"]`);
  }

  /** Apply ARIA attributes to the grid */
  applyARIA() {
    const table = this.getTable();
    if (!table) return;

    table.setAttribute('aria-rowcount', String(this.ariaRowCount + 1)); // +1 for header
    table.setAttribute('aria-colcount', String(this.totalColCount));

    // Header row
    const headerRow = table.querySelector('thead tr.column-header-row')
      ?? table.querySelector('thead tr:not(.column-group-row):not(.header-filter-row)');
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
      row.setAttribute('aria-rowindex', String(this.ariaRowOffset + i + 2)); // +2 for 1-based + header

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
    // A grid that was never keyboard-focused must not wear focus styling —
    // refresh() runs after every renderBody, and painting the default header
    // position (focusedRow=-1) put a stuck blue ring on every table at rest.
    if (!this.hasUserInteracted) return;

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
      // Resolve by logical data-index, not DOM position: under virtualization
      // only the current window is in the DOM.
      let row = this.getBodyRow(this.focusedRow);
      if (!row) {
        // Outside the rendered window — ask the host to scroll it into view,
        // then look again.
        this.options.ensureRowVisible?.(this.focusedRow);
        row = this.getBodyRow(this.focusedRow);
      }
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

    // Let controls inside the grid keep their native keyboard contract. This
    // includes group/tree toggle buttons (Enter/Space must click them), row
    // checkboxes, links, and form controls rendered by custom cells. Inspect
    // the composed path so controls nested in another component's shadow root
    // are recognized too.
    const interactiveSelector = 'button, a, input, select, textarea, [contenteditable="true"], snice-button, snice-checkbox, snice-input, snice-select';
    const fromInteractiveControl = e.composedPath().some((node) =>
      node instanceof Element && node.matches(interactiveSelector)
    );
    if (fromInteractiveControl) return;

    this.hasUserInteracted = true;

    const totalRows = this.totalRowCount;
    const totalColumns = this.totalColCount;

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
          this.options.onSelectionToggle?.(this.focusedRow);
        }
        break;

      case 'Enter':
        if (this.focusedRow >= 0 && this.focusedCol >= 0) {
          e.preventDefault();
          const row = this.getBodyRow(this.focusedRow);
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
      // Guard: layout APIs are not implemented in some non-browser DOMs.
      if (typeof focusedEl.scrollIntoView === 'function') {
        focusedEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      if (typeof focusedEl.focus === 'function') {
        focusedEl.focus({ preventScroll: true });
      }
    }
  }

  isAttached(): boolean {
    return this.attached;
  }
}
