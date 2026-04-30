/**
 * Toolbar for snice-table — MUI X DataGrid pattern.
 *
 * Sort: click column header (cycles asc→desc→none); shift+click adds to
 * multi-column sort.
 * Filter: opened from the column header menu (right-click or ⋮). The toolbar
 * itself only carries Search, Export, and Fullscreen — no sort/filter
 * buttons.
 *
 * Filter UI: in-flow panel between toolbar and grid, appears when a column's
 * "Filter" menu item is invoked.
 */
import type { FilterOperator, FilterLogic } from './table-filter-engine';
import { TableFilterEngine } from './table-filter-engine';
import { X_MARK, PLUS, ARROW_DOWN_TRAY, ARROWS_POINTING_OUT } from '../icons';

export interface ToolbarOptions {
  showSearch?: boolean;
  showSort?: boolean;       // ignored — kept for backwards-compat with existing call sites
  showFilter?: boolean;
  showExport?: boolean;
  searchPlaceholder?: string;
}

interface FilterRow {
  column: string;
  operator: FilterOperator;
  value: any;
}

export class TableToolbar {
  private container: HTMLElement | null = null;
  private options: ToolbarOptions = {};
  private tableElement: any = null;
  private filterEngine: TableFilterEngine | null = null;

  private filterPanel: HTMLElement | null = null;
  private filterPanelOpen = false;
  private filters: FilterRow[] = [];
  private logic: FilterLogic = 'and';
  private pendingDebounces: number[] = [];

  onSearch: ((query: string) => void) | null = null;
  onSortColumn: ((columnKey: string, direction: 'asc' | 'desc') => void) | null = null;
  onSetSortModel: ((sortModel: { column: string; direction: 'asc' | 'desc' }[]) => void) | null = null;
  onFilterColumn: ((columnKey: string, operator: FilterOperator, value: any) => void) | null = null;
  onRemoveFilter: ((columnKey: string) => void) | null = null;
  onClearFilters: (() => void) | null = null;
  onSetFilterModel: ((filters: FilterRow[], logic: FilterLogic) => void) | null = null;
  onExportCSV: (() => void) | null = null;
  onFullscreen: (() => void) | null = null;

  attach(tableEl: HTMLElement, container: HTMLElement, options: ToolbarOptions = {}) {
    this.tableElement = tableEl;
    this.container = container;
    this.options = options;
    this.render();
  }

  setFilterEngine(engine: TableFilterEngine) {
    this.filterEngine = engine;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'tt-wrap';
    wrap.appendChild(this.styleTag());

    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.setAttribute('part', 'toolbar');

    if (this.options.showSearch !== false) {
      const searchInput = document.createElement('snice-input') as any;
      searchInput.type = 'search';
      searchInput.placeholder = this.options.searchPlaceholder || 'Search...';
      searchInput.size = 'small';
      searchInput.prefixIcon = 'search';
      searchInput.clearable = true;
      searchInput.className = 'toolbar-search';
      let debounce: number;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = window.setTimeout(() => this.onSearch?.(searchInput.value), 300);
      });
      toolbar.appendChild(searchInput);
    }

    const actions = document.createElement('div');
    actions.className = 'toolbar-actions';

    if (this.options.showExport) {
      const exportBtn = this.mkBtn('Export CSV', ARROW_DOWN_TRAY);
      exportBtn.addEventListener('click', () => this.onExportCSV?.());
      actions.appendChild(exportBtn);
    }

    const fsBtn = this.mkBtn('Fullscreen', ARROWS_POINTING_OUT);
    fsBtn.addEventListener('click', () => this.onFullscreen?.());
    actions.appendChild(fsBtn);

    toolbar.appendChild(actions);
    wrap.appendChild(toolbar);

    this.filterPanel = document.createElement('div');
    this.filterPanel.className = 'tt-filter-panel';
    this.filterPanel.hidden = !this.filterPanelOpen;
    wrap.appendChild(this.filterPanel);

    this.container.appendChild(wrap);
  }

  /** Public name kept for backwards-compat with snice-table.ts column-menu Filter action. */
  openFilterModal(presetColumn?: string) {
    const engine = this.ensureEngine();
    // When the panel is opening (was closed), resync local filter state from
    // the engine so the panel always reflects the actually-applied filters,
    // not stale local edits from a previous open session.
    if (!this.filterPanelOpen) {
      const model = engine.getFilterModel();
      this.filters = model.filters.map(f => ({ ...f }));
      this.logic = model.logic || 'and';
    }
    if (presetColumn) {
      const columns = this.tableElement?.columns || [];
      const col = columns.find((c: any) => c.key === presetColumn);
      const ops = engine.getOperatorsForType(col?.type || 'text');
      if (col && ops[0] && !this.filters.some(f => f.column === presetColumn)) {
        this.filters.push({ column: presetColumn, operator: ops[0].value as FilterOperator, value: '' });
      }
    }
    if (!this.filterPanelOpen) {
      this.filterPanelOpen = true;
      if (this.filterPanel) this.filterPanel.hidden = false;
    }
    this.renderFilterPanel();
  }

  closeFilterPanel() {
    this.cancelPendingDebounces();
    this.filterPanelOpen = false;
    if (this.filterPanel) this.filterPanel.hidden = true;
  }

  // ── Filter panel ─────────────────────────────────────────────────

  private ensureEngine(): TableFilterEngine {
    if (!this.filterEngine) this.filterEngine = new TableFilterEngine();
    return this.filterEngine;
  }

  // (filter panel toggling is driven by openFilterModal / closeFilterPanel —
  // the toolbar no longer has a Filter button.)

  private cancelPendingDebounces() {
    for (const t of this.pendingDebounces) clearTimeout(t);
    this.pendingDebounces = [];
  }

  private renderFilterPanel() {
    if (!this.filterPanel) return;
    // Stale debounces from a previous render hold refs to old DOM nodes — kill them.
    this.cancelPendingDebounces();
    const engine = this.ensureEngine();
    const columns = this.tableElement?.columns || [];

    // First open: pull current filter model into local state
    if (this.filters.length === 0) {
      const model = engine.getFilterModel();
      this.filters = [...model.filters];
      this.logic = model.logic || 'and';
    }

    this.filterPanel.innerHTML = '';
    this.filterPanel.appendChild(this.styleTag());

    const inner = document.createElement('div');
    inner.className = 'tt-filter-inner';

    // Top-right corner close — universal "exit panel" affordance
    const cornerClose = document.createElement('button');
    cornerClose.type = 'button';
    cornerClose.className = 'tt-filter-corner-close';
    cornerClose.setAttribute('aria-label', 'Close filter panel');
    cornerClose.setAttribute('title', 'Close');
    cornerClose.innerHTML = X_MARK;
    cornerClose.addEventListener('click', () => this.closeFilterPanel());
    inner.appendChild(cornerClose);

    const rows = document.createElement('div');
    rows.className = 'tt-filter-rows';
    inner.appendChild(rows);

    const apply = () => {
      const valid = this.filters.filter(f => {
        const colDef = columns.find((c: any) => c.key === f.column);
        const colType = colDef?.type || 'text';
        const opDef = engine.getOperatorsForType(colType).find(o => o.value === f.operator);
        // Operator must be valid for the column type. If user changed columns
        // and the previous operator no longer applies, skip the filter rather
        // than ship a malformed filter to the engine (which would 0-out all rows).
        if (!opDef) return false;
        return opDef.requiresValue === false || (f.value !== null && f.value !== '');
      });
      this.onSetFilterModel?.(valid, this.logic);
    };

    const renderRow = (f: FilterRow, idx: number): HTMLElement => {
      const row = document.createElement('div');
      row.className = 'tt-filter-row';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'tt-filter-x';
      removeBtn.setAttribute('aria-label', 'Remove filter');
      removeBtn.innerHTML = X_MARK;
      removeBtn.addEventListener('click', () => {
        this.filters.splice(idx, 1);
        if (this.filters.length === 0) this.onClearFilters?.();
        else apply();
        this.renderFilterPanel();
      });
      row.appendChild(removeBtn);

      const colSel = document.createElement('snice-select') as any;
      colSel.size = 'small';
      colSel.searchable = columns.length > 8;
      colSel.maxHeight = '200px';
      colSel.options = columns.map((c: any) => ({ value: c.key, label: c.label || c.key }));
      colSel.value = f.column;
      colSel.style.width = '11rem';
      row.appendChild(colSel);

      const opSel = document.createElement('snice-select') as any;
      opSel.size = 'small';
      opSel.maxHeight = '200px';
      opSel.style.width = '8rem';
      row.appendChild(opSel);

      const valWrap = document.createElement('span');
      valWrap.className = 'tt-filter-val-wrap';
      const valInp = document.createElement('snice-input') as any;
      valInp.size = 'small';
      valInp.placeholder = 'Value';
      valInp.style.width = '11rem';
      if (f.value != null) valInp.value = String(f.value);
      valWrap.appendChild(valInp);
      row.appendChild(valWrap);

      // Map column type → snice-input HTML5 type so number/date columns get
      // the right keyboard, validation and (for date) native picker.
      const inputTypeForColType = (t: string): string => {
        switch (t) {
          case 'number':
          case 'currency':
          case 'rating':
          case 'progress':
          case 'filesize':
          case 'duration':
          case 'percent':
          case 'percentage':
            return 'number';
          case 'date':
            return 'date';
          default:
            return 'text';
        }
      };

      const refreshOps = () => {
        const colDef = columns.find((c: any) => c.key === colSel.value);
        const colType = colDef?.type || 'text';
        const ops = engine.getOperatorsForType(colType);
        opSel.options = ops.map(o => ({ value: o.value, label: o.label }));
        // Preserve the user's chosen operator. If it isn't valid for the new
        // column type, leave the select unselected (placeholder); the user
        // picks a new op. Never rewrite f.operator behind their back.
        if (ops.some(o => o.value === f.operator)) {
          opSel.value = f.operator;
        } else {
          opSel.value = '';
        }
        valInp.type = inputTypeForColType(colType);
        updateValueVis();
      };
      const updateValueVis = () => {
        const colDef = columns.find((c: any) => c.key === colSel.value);
        const colType = colDef?.type || 'text';
        const opDef = engine.getOperatorsForType(colType).find(o => o.value === opSel.value);
        valWrap.style.display = opDef?.requiresValue === false ? 'none' : '';
      };

      colSel.addEventListener('change', () => {
        f.column = colSel.value;
        refreshOps();
        apply();
      });
      opSel.addEventListener('change', () => {
        f.operator = opSel.value;
        updateValueVis();
        apply();
      });
      let valDebounce: number;
      valInp.addEventListener('input', () => {
        clearTimeout(valDebounce);
        valDebounce = window.setTimeout(() => {
          this.pendingDebounces = this.pendingDebounces.filter(t => t !== valDebounce);
          f.value = valInp.value;
          apply();
        }, 250);
        this.pendingDebounces.push(valDebounce);
      });
      valInp.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          f.value = valInp.value;
          apply();
        }
      });

      refreshOps();
      return row;
    };

    // Panel-level logic toggle (AND / OR) — appears when 2+ filters
    if (this.filters.length > 1) {
      const logicBar = document.createElement('div');
      logicBar.className = 'tt-filter-logicbar';
      const logicLabel = document.createElement('span');
      logicLabel.className = 'tt-filter-logicbar-label';
      logicLabel.textContent = 'Match';
      const logicSel = document.createElement('snice-select') as any;
      logicSel.size = 'small';
      logicSel.options = [
        { value: 'and', label: 'All filters (AND)' },
        { value: 'or', label: 'Any filter (OR)' },
      ];
      logicSel.value = this.logic;
      logicSel.style.width = '11rem';
      logicSel.addEventListener('change', () => {
        this.logic = logicSel.value;
        apply();
      });
      logicBar.appendChild(logicLabel);
      logicBar.appendChild(logicSel);
      inner.insertBefore(logicBar, rows);
    }

    if (this.filters.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'tt-filter-empty';
      empty.textContent = 'No filters applied';
      rows.appendChild(empty);
    } else {
      this.filters.forEach((f, idx) => rows.appendChild(renderRow(f, idx)));
    }

    const footer = document.createElement('div');
    footer.className = 'tt-filter-footer';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'tt-filter-add';
    addBtn.innerHTML = `${PLUS}<span>Add filter</span>`;
    addBtn.addEventListener('click', () => {
      const next = columns[0];
      if (!next) return;
      const ops = engine.getOperatorsForType(next.type || 'text');
      if (!ops[0]) return;
      this.filters.push({ column: next.key, operator: ops[0].value as FilterOperator, value: '' });
      this.renderFilterPanel();
    });
    footer.appendChild(addBtn);

    if (this.filters.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'tt-filter-clear';
      clearBtn.textContent = 'Clear all';
      clearBtn.addEventListener('click', () => {
        this.cancelPendingDebounces();
        this.filters = [];
        this.logic = 'and';
        this.onClearFilters?.();
        this.renderFilterPanel();
      });
      footer.appendChild(clearBtn);
    }

    inner.appendChild(footer);
    this.filterPanel.appendChild(inner);
  }

  private mkBtn(label: string, svg: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.innerHTML = svg;
    return btn;
  }

  private styleTag(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = TT_STYLES;
    return style;
  }

  setActiveFilterCount(_count: number) {}
  isAttached(): boolean { return this.container !== null; }
}

const TT_STYLES = `
  .tt-wrap { display: flex; flex-direction: column; }

  .tt-filter-panel {
    border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
    background: var(--snice-color-surface-container-low, rgb(250 250 250));
  }
  .tt-filter-inner {
    padding: 0.75rem 0.875rem;
    padding-right: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
  }
  .tt-filter-corner-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    border-radius: var(--snice-border-radius-md, 0.25rem);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 0;
    z-index: 1;
  }
  .tt-filter-corner-close:hover {
    background: var(--snice-color-surface-hover, rgb(245 245 245));
    color: var(--snice-color-text, rgb(23 23 23));
  }
  .tt-filter-corner-close svg {
    width: 1rem;
    height: 1rem;
  }
  .tt-filter-logicbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .tt-filter-logicbar-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--snice-color-text-secondary, rgb(82 82 82));
    flex: 0 0 auto;
  }
  .tt-filter-rows {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .tt-filter-empty {
    padding: 0.625rem 0.5rem;
    font-size: 0.8125rem;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    font-style: italic;
  }
  .tt-filter-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }
  .tt-filter-x {
    border: none;
    background: none;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    cursor: pointer;
    border-radius: var(--snice-border-radius-md, 0.25rem);
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    line-height: 0;
  }
  .tt-filter-x svg {
    width: 1rem;
    height: 1rem;
  }
  .tt-filter-x:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
  .tt-filter-val-wrap { display: inline-flex; flex: 1 1 auto; min-width: 0; }
  .tt-filter-val-wrap snice-input { width: 100%; }
  .tt-filter-footer {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.125rem;
  }
  .tt-filter-add,
  .tt-filter-clear {
    border: none;
    background: none;
    font-family: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
    padding: 0.375rem 0.625rem;
    border-radius: var(--snice-border-radius-md, 0.25rem);
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    line-height: 1;
  }
  .tt-filter-add svg,
  .tt-filter-clear svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  .tt-filter-add { color: var(--snice-color-primary, rgb(37 99 235)); font-weight: 500; }
  .tt-filter-add:hover { background: var(--snice-color-primary-subtle, rgb(219 234 254 / 0.4)); }
  .tt-filter-clear { color: var(--snice-color-text-tertiary, rgb(115 115 115)); margin-left: auto; }
  .tt-filter-clear:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
`;
