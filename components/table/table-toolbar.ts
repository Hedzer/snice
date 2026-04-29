/**
 * Toolbar for snice-table.
 *
 * Sort and Filter render as inline editable query expressions in a popover.
 * No form rows, no nested selects — each column / operator / value is a
 * clickable token that opens a small inline picker.
 */
import type { FilterOperator, FilterLogic } from './table-filter-engine';
import { TableFilterEngine } from './table-filter-engine';
import '../popover/snice-popover';

export interface ToolbarOptions {
  showSearch?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
  showExport?: boolean;
  searchPlaceholder?: string;
}

interface SortRow {
  column: string;
  direction: 'asc' | 'desc';
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
  private sortPopover: any = null;
  private filterPopover: any = null;

  onSearch: ((query: string) => void) | null = null;
  onSortColumn: ((columnKey: string, direction: 'asc' | 'desc') => void) | null = null;
  onSetSortModel: ((sortModel: SortRow[]) => void) | null = null;
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
    this.sortPopover = null;
    this.filterPopover = null;

    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.setAttribute('part', 'toolbar');

    if (this.options.showSearch !== false) {
      const searchInput = document.createElement('snice-input') as any;
      searchInput.type = 'search';
      searchInput.placeholder = this.options.searchPlaceholder || 'Search...';
      searchInput.size = 'small';
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

    if (this.options.showSort !== false) {
      this.sortPopover = this.buildSortPopover();
      actions.appendChild(this.sortPopover);
    }

    if (this.options.showFilter !== false) {
      this.filterPopover = this.buildFilterPopover();
      actions.appendChild(this.filterPopover);
    }

    if (this.options.showExport) {
      const exportBtn = this.mkBtn('Export CSV', this.exportIcon());
      exportBtn.addEventListener('click', () => this.onExportCSV?.());
      actions.appendChild(exportBtn);
    }

    const fsBtn = this.mkBtn('Fullscreen', this.fullscreenIcon());
    fsBtn.addEventListener('click', () => this.onFullscreen?.());
    actions.appendChild(fsBtn);

    toolbar.appendChild(actions);
    this.container.appendChild(toolbar);
  }

  private mkBtn(label: string, svg: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.innerHTML = svg;
    return btn;
  }

  /** Public name kept for backwards-compat with snice-table.ts column-menu Filter action. */
  openFilterModal(presetColumn?: string) {
    if (!this.filterPopover) return;
    if (presetColumn) (this.filterPopover as any)._presetColumn = presetColumn;
    (this.filterPopover as any).open = true;
  }

  // ── Sort popover (inline expression) ───────────────────────────────

  private buildSortPopover(): HTMLElement {
    const popover = document.createElement('snice-popover') as any;
    popover.placement = 'bottom-end';
    popover.distance = 6;

    const trigger = this.mkBtn('Sort', this.sortIcon());
    trigger.slot = 'trigger';
    popover.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'qpop qpop--sort';
    panel.appendChild(this.styleTag());

    let sorts: SortRow[] = [];
    let columns: any[] = [];
    let sortableColumns: any[] = [];

    const apply = () => this.onSetSortModel?.(sorts);

    const renderExpression = (expr: HTMLElement) => {
      expr.innerHTML = '';

      if (sorts.length === 0) {
        const ph = document.createElement('span');
        ph.className = 'qpop-placeholder';
        ph.textContent = 'no sort';
        expr.appendChild(ph);
        return;
      }

      const verb = document.createElement('span');
      verb.className = 'qpop-verb';
      verb.textContent = 'by';
      expr.appendChild(verb);

      sorts.forEach((s, idx) => {
        if (idx > 0) {
          const sep = document.createElement('span');
          sep.className = 'qpop-conj';
          sep.textContent = 'then';
          expr.appendChild(sep);
        }

        const colDef = sortableColumns.find((c: any) => c.key === s.column);
        const colLabel = colDef?.label || s.column;

        const colTok = this.makePickerToken(
          'qpop-token qpop-token--col',
          colLabel,
          () => sortableColumns.map((c: any) => ({ value: c.key, label: c.label || c.key, active: c.key === s.column })),
          (val) => { s.column = val; renderExpression(expr); apply(); },
        );
        expr.appendChild(colTok);

        const dirTok = document.createElement('button');
        dirTok.type = 'button';
        dirTok.className = 'qpop-token qpop-token--dir';
        dirTok.setAttribute('aria-label', s.direction === 'asc' ? 'ascending — click to flip' : 'descending — click to flip');
        dirTok.innerHTML = s.direction === 'asc' ? ASC_ARROW : DESC_ARROW;
        dirTok.addEventListener('click', (e) => {
          e.stopPropagation();
          s.direction = s.direction === 'asc' ? 'desc' : 'asc';
          dirTok.innerHTML = s.direction === 'asc' ? ASC_ARROW : DESC_ARROW;
          dirTok.setAttribute('aria-label', s.direction === 'asc' ? 'ascending — click to flip' : 'descending — click to flip');
          apply();
        });
        expr.appendChild(dirTok);

        const removeTok = document.createElement('button');
        removeTok.type = 'button';
        removeTok.className = 'qpop-x';
        removeTok.title = 'Remove';
        removeTok.innerHTML = X_DOT;
        removeTok.addEventListener('click', (e) => {
          e.stopPropagation();
          sorts.splice(idx, 1);
          renderExpression(expr);
          apply();
        });
        expr.appendChild(removeTok);
      });
    };

    const renderAll = () => {
      panel.querySelectorAll('.qpop-section').forEach(n => n.remove());

      const section = document.createElement('div');
      section.className = 'qpop-section';

      const expr = document.createElement('div');
      expr.className = 'qpop-expr';
      section.appendChild(expr);

      const footer = document.createElement('div');
      footer.className = 'qpop-footer';

      const usedKeys = () => new Set(sorts.map(s => s.column));
      const availableLabel = () => {
        const used = usedKeys();
        const remaining = sortableColumns.filter((c: any) => !used.has(c.key));
        return remaining.length ? '+ add column' : 'all columns sorted';
      };

      const addBtn = this.makePickerToken(
        'qpop-add',
        availableLabel(),
        () => {
          const used = usedKeys();
          return sortableColumns
            .filter((c: any) => !used.has(c.key))
            .map((c: any) => ({ value: c.key, label: c.label || c.key, active: false }));
        },
        (val) => {
          sorts.push({ column: val, direction: 'asc' });
          renderExpression(expr);
          addBtn.textContent = availableLabel();
          apply();
        },
      );
      footer.appendChild(addBtn);

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'qpop-link qpop-link--muted';
      resetBtn.textContent = 'reset';
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sorts = [];
        renderExpression(expr);
        addBtn.textContent = availableLabel();
        apply();
      });
      footer.appendChild(resetBtn);

      section.appendChild(footer);
      panel.appendChild(section);

      renderExpression(expr);
    };

    popover.addEventListener('popover-open', () => {
      columns = this.tableElement?.columns || [];
      sortableColumns = columns.filter((c: any) => c.sortable !== false);
      sorts = [...(this.tableElement?.currentSort || [])];
      renderAll();
    });

    popover.appendChild(panel);
    return popover;
  }

  // ── Filter popover (inline sentences) ──────────────────────────────

  private buildFilterPopover(): HTMLElement {
    const popover = document.createElement('snice-popover') as any;
    popover.placement = 'bottom-end';
    popover.distance = 6;

    const trigger = this.mkBtn('Filter', this.filterIcon());
    trigger.slot = 'trigger';
    popover.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'qpop qpop--filter';
    panel.appendChild(this.styleTag());

    let filters: FilterRow[] = [];
    let logic: FilterLogic = 'and';
    let columns: any[] = [];
    let engine: TableFilterEngine;

    const validFilters = () => filters.filter(f => {
      const colDef = columns.find((c: any) => c.key === f.column);
      const colType = colDef?.type || 'text';
      const opDef = engine.getOperatorsForType(colType).find(o => o.value === f.operator);
      return opDef?.requiresValue === false || (f.value !== null && f.value !== '');
    });
    const apply = () => this.onSetFilterModel?.(validFilters(), logic);

    const renderRow = (f: FilterRow, idx: number, list: HTMLElement) => {
      const row = document.createElement('div');
      row.className = 'qpop-row';

      const colDef = columns.find((c: any) => c.key === f.column);
      const colLabel = colDef?.label || f.column;
      const colType = colDef?.type || 'text';
      const ops = engine.getOperatorsForType(colType);
      const opDef = ops.find(o => o.value === f.operator);

      const colTok = this.makePickerToken(
        'qpop-token qpop-token--col',
        colLabel,
        () => columns.map((c: any) => ({ value: c.key, label: c.label || c.key, active: c.key === f.column })),
        (val) => { f.column = val; renderList(list); apply(); },
      );
      row.appendChild(colTok);

      const opTok = this.makePickerToken(
        'qpop-token qpop-token--op',
        opDef?.label || f.operator,
        () => engine.getOperatorsForType(colType).map(o => ({ value: o.value, label: o.label, active: o.value === f.operator })),
        (val) => { f.operator = val as FilterOperator; renderList(list); apply(); },
      );
      row.appendChild(opTok);

      if (opDef?.requiresValue !== false) {
        const valInp = document.createElement('input');
        valInp.type = colType === 'number' || colType === 'currency' || colType === 'percent' ? 'number' :
                      colType === 'date' ? 'date' : 'text';
        valInp.className = 'qpop-token qpop-token--val';
        valInp.placeholder = 'value';
        valInp.value = f.value != null ? String(f.value) : '';
        let dbc: number;
        valInp.addEventListener('input', () => {
          clearTimeout(dbc);
          dbc = window.setTimeout(() => {
            f.value = valInp.value;
            apply();
          }, 200);
        });
        valInp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            f.value = valInp.value;
            apply();
          }
        });
        row.appendChild(valInp);
      }

      const removeTok = document.createElement('button');
      removeTok.type = 'button';
      removeTok.className = 'qpop-x';
      removeTok.title = 'Remove';
      removeTok.innerHTML = X_DOT;
      removeTok.addEventListener('click', (e) => {
        e.stopPropagation();
        filters.splice(idx, 1);
        renderList(list);
        apply();
      });
      row.appendChild(removeTok);

      return row;
    };

    const renderList = (list: HTMLElement) => {
      list.innerHTML = '';
      if (filters.length === 0) {
        const verb = document.createElement('span');
        verb.className = 'qpop-verb qpop-verb--lead';
        verb.textContent = 'no filters';
        list.appendChild(verb);
        return;
      }

      const verb = document.createElement('span');
      verb.className = 'qpop-verb qpop-verb--lead';
      verb.textContent = 'where';
      list.appendChild(verb);

      filters.forEach((f, idx) => {
        if (idx > 0) {
          const conj = document.createElement('button');
          conj.type = 'button';
          conj.className = 'qpop-conj qpop-conj--toggle';
          conj.title = 'Click to toggle AND/OR';
          conj.textContent = logic;
          conj.addEventListener('click', (e) => {
            e.stopPropagation();
            logic = logic === 'and' ? 'or' : 'and';
            renderList(list);
            apply();
          });
          list.appendChild(conj);
        }
        list.appendChild(renderRow(f, idx, list));
      });
    };

    const renderAll = () => {
      panel.querySelectorAll('.qpop-section').forEach(n => n.remove());

      const section = document.createElement('div');
      section.className = 'qpop-section';

      const expr = document.createElement('div');
      expr.className = 'qpop-expr qpop-expr--filter';
      section.appendChild(expr);

      const footer = document.createElement('div');
      footer.className = 'qpop-footer';

      const addBtn = this.makePickerToken(
        'qpop-add',
        '+ add condition',
        () => columns.map((c: any) => ({ value: c.key, label: c.label || c.key, active: false })),
        (val) => {
          const colDef = columns.find((c: any) => c.key === val);
          const ops = engine.getOperatorsForType(colDef?.type || 'text');
          if (!ops[0]) return;
          filters.push({ column: val, operator: ops[0].value as FilterOperator, value: '' });
          renderList(expr);
          apply();
        },
      );
      footer.appendChild(addBtn);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'qpop-link qpop-link--muted';
      clearBtn.textContent = 'clear all';
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filters = [];
        renderList(expr);
        this.onClearFilters?.();
      });
      footer.appendChild(clearBtn);

      section.appendChild(footer);
      panel.appendChild(section);

      renderList(expr);
    };

    popover.addEventListener('popover-open', () => {
      engine = this.filterEngine || new TableFilterEngine();
      const model = engine.getFilterModel();
      columns = this.tableElement?.columns || [];
      filters = [...model.filters];
      logic = model.logic || 'and';

      const preset = (popover as any)._presetColumn;
      if (preset && !filters.some(f => f.column === preset)) {
        filters.push({ column: preset, operator: 'contains' as FilterOperator, value: '' });
        (popover as any)._presetColumn = null;
      }
      renderAll();
    });

    popover.appendChild(panel);
    return popover;
  }

  // ── Picker token (custom, no snice-select) ────────────────────────

  private makePickerToken(
    cls: string,
    label: string,
    getOptions: () => { value: string; label: string; active: boolean }[],
    onPick: (value: string) => void,
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.textContent = label;

    let openMenu: HTMLElement | null = null;
    const closeMenu = () => {
      if (openMenu) {
        openMenu.remove();
        openMenu = null;
        document.removeEventListener('mousedown', outsideClickClose, true);
      }
    };
    const outsideClickClose = (e: MouseEvent) => {
      const path = e.composedPath();
      if (path.includes(btn)) return;
      if (openMenu && path.includes(openMenu)) return;
      closeMenu();
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openMenu) { closeMenu(); return; }
      const options = getOptions();
      if (!options.length) return;

      const menu = document.createElement('div');
      menu.className = 'qpop-menu';
      menu.setAttribute('data-snice-popover-owned', '');
      // Ship the inline styles inside the menu so it works at body level.
      menu.appendChild(this.styleTag());

      // Optional inline filter for many options
      let filterText = '';
      const filterInp = document.createElement('input');
      filterInp.type = 'text';
      filterInp.className = 'qpop-menu-filter';
      filterInp.placeholder = 'filter...';
      const list = document.createElement('div');
      list.className = 'qpop-menu-list';

      const renderOptions = () => {
        list.innerHTML = '';
        const ft = filterText.toLowerCase();
        const filtered = ft ? options.filter(o => o.label.toLowerCase().includes(ft)) : options;
        for (const o of filtered) {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'qpop-menu-item' + (o.active ? ' is-active' : '');
          item.textContent = o.label;
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMenu();
            onPick(o.value);
          });
          list.appendChild(item);
        }
        if (!filtered.length) {
          const empty = document.createElement('div');
          empty.className = 'qpop-menu-empty';
          empty.textContent = 'no matches';
          list.appendChild(empty);
        }
      };

      filterInp.addEventListener('input', () => { filterText = filterInp.value; renderOptions(); });
      filterInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const first = list.querySelector('.qpop-menu-item') as HTMLButtonElement | null;
          first?.click();
        } else if (e.key === 'Escape') {
          closeMenu();
        }
      });

      if (options.length > 6) menu.appendChild(filterInp);
      menu.appendChild(list);
      renderOptions();

      // Append to document.body so position:fixed uses the viewport (and not
      // the popover's top-layer containing block). The data-snice-popover-owned
      // attribute keeps the popover open when the menu is clicked.
      document.body.appendChild(menu);
      const r = btn.getBoundingClientRect();
      menu.style.top = `${r.bottom + 4}px`;
      menu.style.left = `${r.left}px`;
      // Clamp
      requestAnimationFrame(() => {
        const m = menu.getBoundingClientRect();
        if (m.right > window.innerWidth - 6) menu.style.left = `${window.innerWidth - m.width - 6}px`;
        if (m.bottom > window.innerHeight - 6) menu.style.top = `${r.top - m.height - 4}px`;
        // Focus the filter for searchable lists
        if (options.length > 6) filterInp.focus();
      });

      openMenu = menu;
      setTimeout(() => document.addEventListener('mousedown', outsideClickClose, true), 0);
    });

    return btn;
  }

  private styleTag(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = QPOP_STYLES;
    return style;
  }

  setActiveFilterCount(_count: number) {}
  isAttached(): boolean { return this.container !== null; }

  private sortIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6l4-4 4 4"/><path d="M4 10l4 4 4-4"/></svg>`; }
  private filterIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M2 3h12M4 7h8M6 11h4"/></svg>`; }
  private exportIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 12h10"/></svg>`; }
  private fullscreenIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><polyline points="2,6 2,2 6,2"/><polyline points="14,10 14,14 10,14"/></svg>`; }
}

// ── SVG glyphs ──
const ASC_ARROW = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M5.5 9.5V1.5M2.5 4.5l3-3 3 3"/></svg>`;
const DESC_ARROW = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M5.5 1.5v8M2.5 6.5l3 3 3-3"/></svg>`;
const X_DOT = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><path d="M2 2l5 5M7 2l-5 5"/></svg>`;

// ── Editorial-technical query expression styles ──
const QPOP_STYLES = `
  .qpop {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    min-width: 22rem;
    max-width: 32rem;
    font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    color: var(--snice-color-text, rgb(23 23 23));
  }
  .qpop-section { display: flex; flex-direction: column; gap: 0.625rem; }

  .qpop-expr {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
    line-height: 1.6;
    font-size: 0.875rem;
    padding: 0.125rem;
  }
  .qpop-expr--filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .qpop-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
  }

  .qpop-placeholder {
    font-style: italic;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
  }
  .qpop-verb {
    font-style: italic;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    letter-spacing: 0.01em;
  }
  .qpop-verb--lead {
    font-weight: 500;
  }
  .qpop-conj {
    font-style: italic;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    text-transform: lowercase;
    padding: 0 0.125rem;
  }
  .qpop-conj--toggle {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    font-style: italic;
    border-radius: 3px;
    padding: 0 0.25rem;
    transition: color 100ms ease, background 100ms ease;
  }
  .qpop-conj--toggle:hover {
    background: var(--snice-color-surface-hover, rgb(245 245 245));
    color: var(--snice-color-primary, rgb(37 99 235));
  }

  .qpop-token {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border: none;
    background: none;
    font-family: inherit;
    cursor: pointer;
    border-radius: 3px;
    padding: 0.0625rem 0.25rem;
    transition: background 100ms ease, box-shadow 100ms ease;
  }
  .qpop-token:hover {
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
  .qpop-token:focus-visible {
    outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
    outline-offset: 1px;
  }

  .qpop-token--col {
    color: var(--snice-color-primary, rgb(37 99 235));
    font-weight: 600;
    font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
  }
  .qpop-token--col::before {
    content: '';
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    margin-right: 0.125rem;
    opacity: 0.5;
  }

  .qpop-token--op {
    color: var(--snice-color-text-secondary, rgb(82 82 82));
    font-style: italic;
    font-size: 0.8125rem;
  }

  .qpop-token--dir {
    color: var(--snice-color-text, rgb(23 23 23));
    padding: 0.125rem 0.25rem;
  }
  .qpop-token--dir:hover {
    color: var(--snice-color-primary, rgb(37 99 235));
  }

  .qpop-token--val {
    border: 1px solid var(--snice-color-border, rgb(226 226 226));
    background: var(--snice-color-surface, rgb(255 255 255));
    color: var(--snice-color-text, rgb(23 23 23));
    font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    width: 8rem;
    outline: none;
    transition: border-color 100ms ease;
  }
  .qpop-token--val:focus {
    border-color: var(--snice-color-primary, rgb(37 99 235));
  }
  .qpop-token--val::-webkit-inner-spin-button,
  .qpop-token--val::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .qpop-x {
    border: none;
    background: none;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    cursor: pointer;
    padding: 0.0625rem;
    border-radius: 3px;
    line-height: 0;
    margin-left: 0.125rem;
  }
  .qpop-x:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }

  .qpop-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--snice-color-border, rgb(226 226 226));
  }

  .qpop-add {
    border: none;
    background: none;
    color: var(--snice-color-primary, rgb(37 99 235));
    font-family: inherit;
    font-size: 0.75rem;
    font-style: italic;
    cursor: pointer;
    padding: 0.25rem 0.375rem;
    border-radius: 3px;
  }
  .qpop-add:hover {
    background: var(--snice-color-primary-subtle, rgb(219 234 254 / 0.4));
  }
  .qpop-link {
    border: none;
    background: none;
    font-family: inherit;
    font-size: 0.75rem;
    font-style: italic;
    cursor: pointer;
    padding: 0.25rem 0.375rem;
    border-radius: 3px;
  }
  .qpop-link--muted {
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
  }
  .qpop-link--muted:hover {
    color: var(--snice-color-danger, rgb(220 38 38));
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }

  /* Picker menu (replaces snice-select inside the popover) */
  .qpop-menu {
    position: fixed;
    z-index: 10000;
    min-width: 9rem;
    max-width: 14rem;
    max-height: 16rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--snice-color-surface, rgb(255 255 255));
    border: 1px solid var(--snice-color-border, rgb(226 226 226));
    border-radius: var(--snice-border-radius-md, 0.25rem);
    box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1));
    font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: 0.8125rem;
    color: var(--snice-color-text, rgb(23 23 23));
    animation: qpop-menu-in 100ms ease-out;
  }
  @keyframes qpop-menu-in {
    from { opacity: 0; transform: translateY(-2px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .qpop-menu-filter {
    border: none;
    border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
    background: transparent;
    padding: 0.375rem 0.5rem;
    font-family: inherit;
    font-size: 0.75rem;
    color: inherit;
    outline: none;
  }
  .qpop-menu-filter::placeholder { color: var(--snice-color-text-tertiary, rgb(115 115 115)); }
  .qpop-menu-list {
    overflow-y: auto;
    padding: 0.125rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .qpop-menu-item {
    border: none;
    background: none;
    font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    color: var(--snice-color-text, rgb(23 23 23));
    text-align: left;
    padding: 0.3125rem 0.5rem;
    cursor: pointer;
    border-radius: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .qpop-menu-item:hover {
    background: var(--snice-color-surface-hover, rgb(245 245 245));
  }
  .qpop-menu-item.is-active {
    color: var(--snice-color-primary, rgb(37 99 235));
    font-weight: 600;
  }
  .qpop-menu-item.is-active::before {
    content: '·';
    margin-right: 0.25rem;
    opacity: 0.6;
  }
  .qpop-menu-empty {
    padding: 0.5rem;
    color: var(--snice-color-text-tertiary, rgb(115 115 115));
    font-style: italic;
    font-size: 0.75rem;
    text-align: center;
  }
`;
