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
import { X_MARK, PLUS, FUNNEL, ARROW_DOWN_TRAY, ARROWS_POINTING_OUT } from '../icons';

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
    if (presetColumn) {
      const engine = this.ensureEngine();
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

  private renderFilterPanel() {
    if (!this.filterPanel) return;
    const engine = this.ensureEngine();
    const columns = this.tableElement?.columns || [];

    // First open: pull current filter model into local state
    if (this.filters.length === 0) {
      const model = engine.getFilterModel();
      this.filters = [...model.filters];
      this.logic = model.logic || 'and';
      if (this.filters.length === 0) {
        // start with one empty row so the user has something to fill in
        const first = columns[0];
        const ops = engine.getOperatorsForType(first?.type || 'text');
        if (first && ops[0]) {
          this.filters.push({ column: first.key, operator: ops[0].value as FilterOperator, value: '' });
        }
      }
    }

    this.filterPanel.innerHTML = '';
    this.filterPanel.appendChild(this.styleTag());

    const inner = document.createElement('div');
    inner.className = 'tt-filter-inner';

    const head = document.createElement('div');
    head.className = 'tt-filter-head';
    const headIcon = document.createElement('span');
    headIcon.className = 'tt-filter-head-icon';
    headIcon.innerHTML = FUNNEL;
    const headLabel = document.createElement('span');
    headLabel.className = 'tt-filter-head-label';
    headLabel.textContent = 'Filters';
    const headClose = document.createElement('button');
    headClose.type = 'button';
    headClose.className = 'tt-filter-head-close';
    headClose.setAttribute('aria-label', 'Close filter panel');
    headClose.innerHTML = X_MARK;
    headClose.addEventListener('click', () => this.closeFilterPanel());
    head.appendChild(headIcon);
    head.appendChild(headLabel);
    head.appendChild(headClose);
    inner.appendChild(head);

    const rows = document.createElement('div');
    rows.className = 'tt-filter-rows';
    inner.appendChild(rows);

    const apply = () => {
      const valid = this.filters.filter(f => {
        const colDef = columns.find((c: any) => c.key === f.column);
        const colType = colDef?.type || 'text';
        const opDef = engine.getOperatorsForType(colType).find(o => o.value === f.operator);
        return opDef?.requiresValue === false || (f.value !== null && f.value !== '');
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

      // Logic operator pill (only on rows after the first)
      if (idx > 0) {
        const logicBtn = document.createElement('button');
        logicBtn.type = 'button';
        logicBtn.className = 'tt-filter-logic';
        logicBtn.textContent = this.logic.toUpperCase();
        logicBtn.title = 'Toggle AND / OR';
        logicBtn.addEventListener('click', () => {
          this.logic = this.logic === 'and' ? 'or' : 'and';
          this.renderFilterPanel();
          apply();
        });
        row.appendChild(logicBtn);
      } else {
        const where = document.createElement('span');
        where.className = 'tt-filter-leadin';
        where.textContent = 'Where';
        row.appendChild(where);
      }

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

      const refreshOps = () => {
        const colDef = columns.find((c: any) => c.key === colSel.value);
        const colType = colDef?.type || 'text';
        const ops = engine.getOperatorsForType(colType);
        opSel.options = ops.map(o => ({ value: o.value, label: o.label }));
        if (ops.some(o => o.value === f.operator)) opSel.value = f.operator;
        else if (ops[0]) { opSel.value = ops[0].value; f.operator = opSel.value; }
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
          f.value = valInp.value;
          apply();
        }, 250);
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

    this.filters.forEach((f, idx) => rows.appendChild(renderRow(f, idx)));

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
        this.filters = [];
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
    padding: 0.625rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .tt-filter-rows {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .tt-filter-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tt-filter-x {
    border: none;
    background: none;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--snice-border-radius-md, 0.25rem);
    line-height: 0;
    flex: 0 0 auto;
  }
  .tt-filter-x:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
  .tt-filter-leadin {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    flex: 0 0 auto;
    width: 3.5rem;
    text-align: right;
  }
  .tt-filter-logic {
    font-family: inherit;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--snice-color-text-secondary, rgb(82 82 82));
    background: var(--snice-color-surface, rgb(255 255 255));
    border: 1px solid var(--snice-color-border, rgb(226 226 226));
    border-radius: var(--snice-border-radius-md, 0.25rem);
    padding: 0.125rem 0.5rem;
    cursor: pointer;
    flex: 0 0 auto;
    width: 3.5rem;
    transition: border-color 100ms ease, color 100ms ease;
  }
  .tt-filter-logic:hover {
    border-color: var(--snice-color-primary, rgb(37 99 235));
    color: var(--snice-color-primary, rgb(37 99 235));
  }
  .tt-filter-val-wrap { display: inline-flex; }
  .tt-filter-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 4rem;
  }
  .tt-filter-add,
  .tt-filter-clear {
    border: none;
    background: none;
    font-family: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--snice-border-radius-md, 0.25rem);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .tt-filter-add { color: var(--snice-color-primary, rgb(37 99 235)); font-weight: 500; }
  .tt-filter-add:hover { background: var(--snice-color-primary-subtle, rgb(219 234 254 / 0.4)); }
  .tt-filter-clear { color: var(--snice-color-text-tertiary, rgb(115 115 115)); margin-left: auto; }
  .tt-filter-clear:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
`;
