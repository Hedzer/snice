/**
 * Toolbar for snice-table.
 * Search left-aligned, fixed width. Sort/Filter open column-menu-style panels
 * with full operator parity to the right-click column menu.
 */
import type { FilterOperator } from './table-filter-engine';
import { TableFilterEngine } from './table-filter-engine';

export interface ToolbarOptions {
  showSearch?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
  showExport?: boolean;
  searchPlaceholder?: string;
}

export class TableToolbar {
  private container: HTMLElement | null = null;
  private options: ToolbarOptions = {};
  private tableElement: any = null;
  private activePanel: HTMLElement | null = null;
  private filterEngine: TableFilterEngine | null = null;

  onSearch: ((query: string) => void) | null = null;
  onSortColumn: ((columnKey: string, direction: 'asc' | 'desc') => void) | null = null;
  onFilterColumn: ((columnKey: string, operator: FilterOperator, value: any) => void) | null = null;
  onRemoveFilter: ((columnKey: string) => void) | null = null;
  onClearFilters: (() => void) | null = null;
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

    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.setAttribute('part', 'toolbar');

    // Search — left-aligned, fixed width
    if (this.options.showSearch !== false) {
      const searchInput = document.createElement('snice-input') as any;
      searchInput.type = 'search';
      searchInput.placeholder = this.options.searchPlaceholder || 'Search...';
      searchInput.size = 'small';
      searchInput.className = 'toolbar-search';
      let debounce: number;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          this.onSearch?.(searchInput.value);
        }, 300);
      });
      toolbar.appendChild(searchInput);
    }

    // Right-side button group
    const actions = document.createElement('div');
    actions.className = 'toolbar-actions';

    if (this.options.showSort !== false) {
      const sortBtn = this.mkBtn('Sort', this.sortIcon());
      sortBtn.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); this.showSortPanel(sortBtn); });
      actions.appendChild(sortBtn);
    }

    if (this.options.showFilter !== false) {
      const filterBtn = this.mkBtn('Filter', this.filterIcon());
      filterBtn.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); this.showFilterPanel(filterBtn); });
      actions.appendChild(filterBtn);
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

  // ── Sort Panel ──

  private showSortPanel(anchor: HTMLElement) {
    if (this.activePanel) { this.closePanel(); return; }

    const columns = this.tableElement?.columns || [];
    if (!columns.length) return;

    const menu = this.mkPanel();
    const currentSort = this.tableElement?.currentSort || [];

    for (const col of columns) {
      if (col.sortable === false) continue;
      const active = currentSort.find((s: any) => s.column === col.key);

      this.addMenuItem(menu, `↑`, `Sort ${col.label || col.key} Ascending`, active?.direction === 'asc', () => {
        this.onSortColumn?.(col.key, 'asc');
        this.closePanel();
      });
      this.addMenuItem(menu, `↓`, `Sort ${col.label || col.key} Descending`, active?.direction === 'desc', () => {
        this.onSortColumn?.(col.key, 'desc');
        this.closePanel();
      });
      this.addSep(menu);
    }

    // Remove trailing separator
    if (menu.lastElementChild?.classList.contains('column-menu-separator')) menu.lastElementChild.remove();

    this.positionPanel(menu, anchor);
  }

  // ── Filter Panel — full operator parity with column menu ──

  private showFilterPanel(anchor: HTMLElement) {
    if (this.activePanel) { this.closePanel(); return; }

    const columns = this.tableElement?.columns || [];
    if (!columns.length) return;

    const engine = this.filterEngine || new TableFilterEngine();
    const menu = this.mkPanel();
    menu.style.minWidth = '20rem';

    for (const col of columns) {
      const colType = col.type || 'text';
      const operators = engine.getOperatorsForType(colType);

      // Column header
      const header = document.createElement('div');
      header.className = 'column-menu-item';
      header.style.cssText = 'font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.03em;color:var(--snice-color-text-tertiary,rgb(115 115 115));pointer-events:none;padding:0.375rem 0.625rem;';
      header.textContent = col.label || col.key;
      menu.appendChild(header);

      // Operator + value row
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:0.25rem;padding:0.125rem 0.625rem 0.375rem;align-items:center;';

      const opSelect = document.createElement('select');
      opSelect.style.cssText = 'flex:0 0 auto;padding:0.25rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:0.25rem;font-size:0.8rem;font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background,rgb(255 255 255));outline:none;';
      for (const op of operators) {
        const opt = document.createElement('option');
        opt.value = op.value;
        opt.textContent = op.label;
        opSelect.appendChild(opt);
      }
      row.appendChild(opSelect);

      const valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.placeholder = 'Value...';
      valInput.style.cssText = 'flex:1;min-width:0;padding:0.25rem 0.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:0.25rem;font-size:0.8rem;font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background,rgb(255 255 255));outline:none;';

      // Hide value input for operators that don't need it
      const updateValueVis = () => {
        const opDef = operators.find(o => o.value === opSelect.value);
        valInput.style.display = opDef?.requiresValue === false ? 'none' : '';
      };
      opSelect.addEventListener('change', updateValueVis);
      updateValueVis();

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.textContent = '✓';
      applyBtn.style.cssText = 'flex:0 0 auto;width:1.5rem;height:1.5rem;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:0.25rem;background:var(--snice-color-background,rgb(255 255 255));color:var(--snice-color-success,rgb(22 163 74));cursor:pointer;font-size:0.75rem;padding:0;';
      applyBtn.addEventListener('click', () => {
        const op = opSelect.value as FilterOperator;
        const opDef = operators.find(o => o.value === op);
        const val = opDef?.requiresValue === false ? null : valInput.value;
        if (opDef?.requiresValue && !val) return;
        this.onFilterColumn?.(col.key, op, val);
      });
      row.appendChild(valInput);
      row.appendChild(applyBtn);
      menu.appendChild(row);

      this.addSep(menu);
    }

    // Remove trailing sep
    if (menu.lastElementChild?.classList.contains('column-menu-separator')) menu.lastElementChild.remove();

    // Clear all
    this.addSep(menu);
    this.addMenuItem(menu, '✕', 'Clear all filters', false, () => {
      this.onClearFilters?.();
      this.closePanel();
    });

    this.positionPanel(menu, anchor);
  }

  // ── Helpers ──

  private mkPanel(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'table-column-menu';
    el.style.position = 'fixed';
    el.style.maxHeight = '24rem';
    el.style.overflowY = 'auto';
    return el;
  }

  private addMenuItem(parent: HTMLElement, icon: string, label: string, active: boolean, onClick: () => void) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'column-menu-item' + (active ? ' column-menu-item--active' : '');
    item.innerHTML = `<span class="column-menu-icon">${icon}</span><span>${label}</span>`;
    item.addEventListener('click', onClick);
    parent.appendChild(item);
  }

  private addSep(parent: HTMLElement) {
    const sep = document.createElement('div');
    sep.className = 'column-menu-separator';
    parent.appendChild(sep);
  }

  private positionPanel(menu: HTMLElement, anchor: HTMLElement) {
    const root = this.tableElement?.shadowRoot;
    if (!root) return;

    root.appendChild(menu);
    this.activePanel = menu;

    requestAnimationFrame(() => {
      const rect = anchor.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.left = `${Math.max(4, rect.right - menu.offsetWidth)}px`;
    });

    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          this.closePanel();
          document.removeEventListener('click', handler, true);
        }
      };
      document.addEventListener('click', handler, true);
    }, 0);

    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { this.closePanel(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  private closePanel() {
    if (this.activePanel) { this.activePanel.remove(); this.activePanel = null; }
  }

  setActiveFilterCount(_count: number) {}
  isAttached(): boolean { return this.container !== null; }

  // ── Icons ──
  private sortIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6l4-4 4 4"/><path d="M4 10l4 4 4-4"/></svg>`; }
  private filterIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M2 3h12M4 7h8M6 11h4"/></svg>`; }
  private exportIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 12h10"/></svg>`; }
  private fullscreenIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><polyline points="2,6 2,2 6,2"/><polyline points="14,10 14,14 10,14"/></svg>`; }
}
