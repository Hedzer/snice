/**
 * Toolbar for snice-table.
 * Search left-aligned, fixed width. Sort/Filter open snice-modal dialogs
 * with full operator parity to the right-click column menu.
 * Uses existing snice-modal, snice-select, snice-button, snice-input components.
 */
import type { FilterOperator, FilterLogic } from './table-filter-engine';
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
  private filterEngine: TableFilterEngine | null = null;
  private activeModal: HTMLElement | null = null;

  onSearch: ((query: string) => void) | null = null;
  onSortColumn: ((columnKey: string, direction: 'asc' | 'desc') => void) | null = null;
  onFilterColumn: ((columnKey: string, operator: FilterOperator, value: any) => void) | null = null;
  onRemoveFilter: ((columnKey: string) => void) | null = null;
  onClearFilters: (() => void) | null = null;
  onSetFilterModel: ((filters: { column: string; operator: FilterOperator; value: any }[], logic: FilterLogic) => void) | null = null;
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
      sortBtn.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); this.openSortModal(); });
      actions.appendChild(sortBtn);
    }

    if (this.options.showFilter !== false) {
      const filterBtn = this.mkBtn('Filter', this.filterIcon());
      filterBtn.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); this.openFilterModal(); });
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

  // ── Sort Modal ──

  private openSortModal() {
    this.closeModal();

    const columns = this.tableElement?.columns || [];
    if (!columns.length) return;

    const currentSort = this.tableElement?.currentSort || [];
    const modal = this.createModal('Sort');

    const body = modal.querySelector('[slot="default"]') || modal;
    const content = document.createElement('div');
    content.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';

    for (const col of columns) {
      if (col.sortable === false) continue;
      const active = currentSort.find((s: any) => s.column === col.key);

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0;';

      const label = document.createElement('span');
      label.style.cssText = 'flex:1;font-size:0.875rem;';
      label.textContent = col.label || col.key;
      row.appendChild(label);

      const ascBtn = document.createElement('snice-button') as any;
      ascBtn.size = 'small';
      ascBtn.variant = active?.direction === 'asc' ? 'primary' : 'ghost';
      ascBtn.textContent = '↑ Asc';
      ascBtn.addEventListener('click', () => {
        this.onSortColumn?.(col.key, 'asc');
        this.closeModal();
      });
      row.appendChild(ascBtn);

      const descBtn = document.createElement('snice-button') as any;
      descBtn.size = 'small';
      descBtn.variant = active?.direction === 'desc' ? 'primary' : 'ghost';
      descBtn.textContent = '↓ Desc';
      descBtn.addEventListener('click', () => {
        this.onSortColumn?.(col.key, 'desc');
        this.closeModal();
      });
      row.appendChild(descBtn);

      content.appendChild(row);
    }

    body.appendChild(content);
    this.showModal(modal);
  }

  // ── Filter Modal — MUI X Pro style: multiple filter rows ──

  private openFilterModal() {
    this.closeModal();

    const columns = this.tableElement?.columns || [];
    if (!columns.length) return;

    const engine = this.filterEngine || new TableFilterEngine();
    const currentModel = engine.getFilterModel();
    const modal = this.createModal('Filters');

    const body = modal.querySelector('[slot="default"]') || modal;
    const content = document.createElement('div');
    content.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

    // Logic operator toggle (AND / OR)
    const logicRow = document.createElement('div');
    logicRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;';
    const logicLabel = document.createElement('span');
    logicLabel.style.cssText = 'font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;color:var(--snice-color-text-tertiary,rgb(115 115 115));';
    logicLabel.textContent = 'Logic:';
    logicRow.appendChild(logicLabel);

    let currentLogic: FilterLogic = currentModel.logic || 'and';

    const andBtn = document.createElement('snice-button') as any;
    andBtn.size = 'small';
    andBtn.variant = currentLogic === 'and' ? 'primary' : 'ghost';
    andBtn.textContent = 'AND';

    const orBtn = document.createElement('snice-button') as any;
    orBtn.size = 'small';
    orBtn.variant = currentLogic === 'or' ? 'primary' : 'ghost';
    orBtn.textContent = 'OR';

    andBtn.addEventListener('click', () => {
      currentLogic = 'and';
      andBtn.variant = 'primary';
      orBtn.variant = 'ghost';
    });
    orBtn.addEventListener('click', () => {
      currentLogic = 'or';
      orBtn.variant = 'primary';
      andBtn.variant = 'ghost';
    });

    logicRow.appendChild(andBtn);
    logicRow.appendChild(orBtn);
    content.appendChild(logicRow);

    // Filter rows container
    const rowsContainer = document.createElement('div');
    rowsContainer.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    content.appendChild(rowsContainer);

    // Track filter rows for apply
    const filterRows: { getFilter: () => { column: string; operator: FilterOperator; value: any } | null }[] = [];

    const addFilterRow = (preset?: { column: string; operator: FilterOperator; value: any }) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.375rem;';

      // Column select
      const colSelect = document.createElement('select');
      colSelect.style.cssText = 'flex:0 0 auto;min-width:7rem;padding:0.375rem 0.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-md,0.25rem);font-size:0.8rem;font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background,rgb(255 255 255));outline:none;';
      for (const col of columns) {
        const opt = document.createElement('option');
        opt.value = col.key;
        opt.textContent = col.label || col.key;
        colSelect.appendChild(opt);
      }
      if (preset) colSelect.value = preset.column;
      row.appendChild(colSelect);

      // Operator select
      const opSelect = document.createElement('select');
      opSelect.style.cssText = 'flex:0 0 auto;min-width:7rem;padding:0.375rem 0.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-md,0.25rem);font-size:0.8rem;font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background,rgb(255 255 255));outline:none;';

      // Value input
      const valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.placeholder = 'Value...';
      valInput.style.cssText = 'flex:1;min-width:0;padding:0.375rem 0.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-md,0.25rem);font-size:0.8rem;font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background,rgb(255 255 255));outline:none;';
      if (preset?.value != null) valInput.value = String(preset.value);

      const populateOperators = () => {
        const colKey = colSelect.value;
        const colDef = columns.find((c: any) => c.key === colKey);
        const colType = colDef?.type || 'text';
        const operators = engine.getOperatorsForType(colType);
        opSelect.innerHTML = '';
        for (const op of operators) {
          const opt = document.createElement('option');
          opt.value = op.value;
          opt.textContent = op.label;
          opSelect.appendChild(opt);
        }
        if (preset && colKey === preset.column) {
          opSelect.value = preset.operator;
        }
        updateValueVis();
      };

      const updateValueVis = () => {
        const colKey = colSelect.value;
        const colDef = columns.find((c: any) => c.key === colKey);
        const colType = colDef?.type || 'text';
        const operators = engine.getOperatorsForType(colType);
        const opDef = operators.find(o => o.value === opSelect.value);
        valInput.style.display = opDef?.requiresValue === false ? 'none' : '';
      };

      colSelect.addEventListener('change', populateOperators);
      opSelect.addEventListener('change', updateValueVis);
      populateOperators();

      row.appendChild(opSelect);
      row.appendChild(valInput);

      // Remove row button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '✕';
      removeBtn.style.cssText = 'flex:0 0 auto;width:1.75rem;height:1.75rem;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-md,0.25rem);background:var(--snice-color-background,rgb(255 255 255));color:var(--snice-color-text-secondary,rgb(82 82 82));cursor:pointer;font-size:0.75rem;padding:0;';
      removeBtn.addEventListener('click', () => {
        row.remove();
        const idx = filterRows.findIndex(r => r.getFilter === getFilter);
        if (idx >= 0) filterRows.splice(idx, 1);
      });
      row.appendChild(removeBtn);

      const getFilter = (): { column: string; operator: FilterOperator; value: any } | null => {
        const colKey = colSelect.value;
        const colDef = columns.find((c: any) => c.key === colKey);
        const colType = colDef?.type || 'text';
        const operators = engine.getOperatorsForType(colType);
        const op = opSelect.value as FilterOperator;
        const opDef = operators.find(o => o.value === op);
        const val = opDef?.requiresValue === false ? null : valInput.value;
        if (opDef?.requiresValue && !val) return null;
        return { column: colKey, operator: op, value: val };
      };

      filterRows.push({ getFilter });
      rowsContainer.appendChild(row);
    };

    // Pre-populate from current filter model
    if (currentModel.filters.length > 0) {
      for (const f of currentModel.filters) {
        addFilterRow(f);
      }
    } else {
      addFilterRow(); // Start with one empty row
    }

    // Add Filter button
    const addBtn = document.createElement('snice-button') as any;
    addBtn.size = 'small';
    addBtn.variant = 'ghost';
    addBtn.textContent = '+ Add filter';
    addBtn.addEventListener('click', () => addFilterRow());
    content.appendChild(addBtn);

    // Footer: Apply + Clear
    const footer = document.createElement('div');
    footer.setAttribute('slot', 'footer');
    footer.style.cssText = 'display:flex;gap:0.5rem;justify-content:flex-end;';

    const clearBtn = document.createElement('snice-button') as any;
    clearBtn.size = 'small';
    clearBtn.variant = 'ghost';
    clearBtn.textContent = 'Clear all';
    clearBtn.addEventListener('click', () => {
      this.onClearFilters?.();
      this.closeModal();
    });
    footer.appendChild(clearBtn);

    const applyBtn = document.createElement('snice-button') as any;
    applyBtn.size = 'small';
    applyBtn.variant = 'primary';
    applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
      const filters = filterRows.map(r => r.getFilter()).filter(Boolean) as { column: string; operator: FilterOperator; value: any }[];
      this.onSetFilterModel?.(filters, currentLogic);
      this.closeModal();
    });
    footer.appendChild(applyBtn);

    body.appendChild(content);
    modal.appendChild(footer);
    this.showModal(modal);
  }

  // ── Modal Helpers — uses snice-modal ──

  private createModal(title: string): HTMLElement {
    const modal = document.createElement('snice-modal') as any;
    modal.size = 'small';
    modal.label = title;

    const header = document.createElement('span');
    header.setAttribute('slot', 'header');
    header.textContent = title;
    modal.appendChild(header);

    return modal;
  }

  private showModal(modal: HTMLElement) {
    // Append to document body so it's not clipped by shadow DOM
    document.body.appendChild(modal);
    this.activeModal = modal;

    // Listen for close
    modal.addEventListener('modal-close', () => {
      this.closeModal();
    });

    requestAnimationFrame(() => {
      (modal as any).open = true;
    });
  }

  private closeModal() {
    if (this.activeModal) {
      (this.activeModal as any).open = false;
      // Remove after transition
      setTimeout(() => {
        this.activeModal?.remove();
        this.activeModal = null;
      }, 300);
    }
  }

  setActiveFilterCount(_count: number) {}
  isAttached(): boolean { return this.container !== null; }

  // ── Icons ──
  private sortIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6l4-4 4 4"/><path d="M4 10l4 4 4-4"/></svg>`; }
  private filterIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M2 3h12M4 7h8M6 11h4"/></svg>`; }
  private exportIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 12h10"/></svg>`; }
  private fullscreenIcon() { return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><polyline points="2,6 2,2 6,2"/><polyline points="14,10 14,14 10,14"/></svg>`; }
}
