/**
 * Toolbar for snice-table.
 * Uses snice components. Search left-aligned + short.
 * Filter/Sort as icon buttons. Export/Print as icon buttons.
 */

export interface ToolbarOptions {
  showSearch?: boolean;
  showFilter?: boolean;
  showSort?: boolean;
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
  onSortToggle: (() => void) | null = null;
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

    // Search — left-aligned, short width
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

    // Filter — icon button
    if (this.options.showFilter) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'text';
      btn.icon = 'text://⫧';
      btn.setAttribute('aria-label', 'Filter');
      btn.setAttribute('title', 'Filter');
      btn.addEventListener('button-click', () => this.onFilterToggle?.());
      toolbar.appendChild(btn);
    }

    // Sort — icon button
    if (this.options.showSort) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'text';
      btn.icon = 'text://↕';
      btn.setAttribute('aria-label', 'Sort');
      btn.setAttribute('title', 'Sort');
      btn.addEventListener('button-click', () => this.onSortToggle?.());
      toolbar.appendChild(btn);
    }

    // Column visibility — icon button
    if (this.options.showColumnVisibility) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'text';
      btn.icon = 'text://☰';
      btn.setAttribute('aria-label', 'Columns');
      btn.setAttribute('title', 'Columns');
      btn.addEventListener('button-click', () => this.onColumnVisibilityToggle?.());
      toolbar.appendChild(btn);
    }

    // Density — icon button (cycles through densities)
    if (this.options.showDensity) {
      const btn = document.createElement('snice-button') as any;
      btn.size = 'small';
      btn.variant = 'text';
      btn.icon = 'text://≡';
      btn.setAttribute('aria-label', 'Density');
      btn.setAttribute('title', 'Density');
      const densities = ['compact', 'standard', 'comfortable'];
      let idx = densities.indexOf((this.tableElement as any)?.density || 'standard');
      btn.addEventListener('button-click', () => {
        idx = (idx + 1) % densities.length;
        this.onDensityChange?.(densities[idx]);
        btn.setAttribute('title', `Density: ${densities[idx]}`);
      });
      toolbar.appendChild(btn);
    }

    // Export CSV — icon button
    if (this.options.showExport) {
      const csvBtn = document.createElement('snice-button') as any;
      csvBtn.size = 'small';
      csvBtn.variant = 'text';
      csvBtn.icon = 'text://↓';
      csvBtn.setAttribute('aria-label', 'Export CSV');
      csvBtn.setAttribute('title', 'Export CSV');
      csvBtn.addEventListener('button-click', () => this.onExportCSV?.());
      toolbar.appendChild(csvBtn);

      const printBtn = document.createElement('snice-button') as any;
      printBtn.size = 'small';
      printBtn.variant = 'text';
      printBtn.icon = 'text://⎙';
      printBtn.setAttribute('aria-label', 'Print');
      printBtn.setAttribute('title', 'Print');
      printBtn.addEventListener('button-click', () => this.onExportPrint?.());
      toolbar.appendChild(printBtn);
    }

    this.container.appendChild(toolbar);
  }

  setActiveFilterCount(_count: number) {
    // Future: add badge to filter button
  }

  isAttached(): boolean {
    return this.container !== null;
  }
}
