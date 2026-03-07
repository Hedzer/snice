/**
 * Toolbar for snice-table.
 * Uses snice components: snice-input, snice-button, snice-select.
 */

export interface ToolbarOptions {
  showSearch?: boolean;
  showFilter?: boolean;
  showColumnVisibility?: boolean;
  showDensity?: boolean;
  showExport?: boolean;
  searchPlaceholder?: string;
}

export class TableToolbar {
  private container: HTMLElement | null = null;
  private options: ToolbarOptions = {};
  private tableElement: HTMLElement | null = null;

  onSearch: ((query: string) => void) | null = null;
  onFilterToggle: (() => void) | null = null;
  onColumnVisibilityToggle: (() => void) | null = null;
  onDensityChange: ((density: string) => void) | null = null;
  onExportCSV: (() => void) | null = null;
  onExportPrint: (() => void) | null = null;

  attach(tableEl: HTMLElement, container: HTMLElement, options: ToolbarOptions = {}) {
    this.tableElement = tableEl;
    this.container = container;
    this.options = options;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.setAttribute('part', 'toolbar');

    // Search — use snice-input
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

    const spacer = document.createElement('div');
    spacer.className = 'toolbar-spacer';
    toolbar.appendChild(spacer);

    // Filter button — use snice-button
    if (this.options.showFilter) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'default';
      btn.textContent = 'Filter';
      btn.addEventListener('button-click', () => this.onFilterToggle?.());
      toolbar.appendChild(btn);
    }

    // Column visibility — use snice-button
    if (this.options.showColumnVisibility) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'default';
      btn.textContent = 'Columns';
      btn.addEventListener('button-click', () => this.onColumnVisibilityToggle?.());
      toolbar.appendChild(btn);
    }

    // Density selector — use snice-select
    if (this.options.showDensity) {
      const select = document.createElement('snice-select') as any;
      select.size = 'small';
      select.placeholder = 'Density';
      select.className = 'toolbar-density';
      select.options = [
        { value: 'compact', label: 'Compact' },
        { value: 'standard', label: 'Standard' },
        { value: 'comfortable', label: 'Comfortable' },
      ];
      select.value = (this.tableElement as any)?.density || 'standard';
      select.addEventListener('select-change', (e: CustomEvent) => {
        this.onDensityChange?.(e.detail.value);
      });
      toolbar.appendChild(select);
    }

    // Export — use snice-split-button or snice-button
    if (this.options.showExport) {
      const csvBtn = document.createElement('snice-button') as any;
      csvBtn.size = 'small';
      csvBtn.variant = 'default';
      csvBtn.textContent = 'CSV';
      csvBtn.addEventListener('button-click', () => this.onExportCSV?.());
      toolbar.appendChild(csvBtn);

      const printBtn = document.createElement('snice-button') as any;
      printBtn.size = 'small';
      printBtn.variant = 'default';
      printBtn.textContent = 'Print';
      printBtn.addEventListener('button-click', () => this.onExportPrint?.());
      toolbar.appendChild(printBtn);
    }

    this.container.appendChild(toolbar);
  }

  setActiveFilterCount(count: number) {
    // Could add a badge to the filter button
  }

  isAttached(): boolean {
    return this.container !== null;
  }
}
