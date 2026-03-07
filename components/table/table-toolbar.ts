/**
 * Toolbar for snice-table.
 * Renders: search, filter button, column visibility, density selector, export dropdown.
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

  // Callbacks
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
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      background: var(--snice-color-background, rgb(255 255 255));
    `;

    // Search
    if (this.options.showSearch !== false) {
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.placeholder = this.options.searchPlaceholder || 'Search...';
      searchInput.className = 'toolbar-search';
      searchInput.style.cssText = `
        flex: 1;
        min-width: 10rem;
        padding: 0.375rem 0.625rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-background-input, rgb(248 247 245));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        outline: none;
      `;
      let debounce: number;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          this.onSearch?.(searchInput.value);
        }, 300);
      });
      toolbar.appendChild(searchInput);
    }

    // Spacer
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    toolbar.appendChild(spacer);

    // Filter button
    if (this.options.showFilter) {
      toolbar.appendChild(this.createButton('Filter', '⫧', () => this.onFilterToggle?.()));
    }

    // Column visibility
    if (this.options.showColumnVisibility) {
      toolbar.appendChild(this.createButton('Columns', '☰', () => this.onColumnVisibilityToggle?.()));
    }

    // Density selector
    if (this.options.showDensity) {
      const select = document.createElement('select');
      select.className = 'toolbar-density';
      select.style.cssText = `
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-background, rgb(255 255 255));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        cursor: pointer;
      `;
      ['compact', 'standard', 'comfortable'].forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d.charAt(0).toUpperCase() + d.slice(1);
        select.appendChild(opt);
      });
      select.value = (this.tableElement as any)?.density || 'standard';
      select.addEventListener('change', () => this.onDensityChange?.(select.value));
      toolbar.appendChild(select);
    }

    // Export dropdown
    if (this.options.showExport) {
      const exportBtn = this.createButton('Export', '↓', () => {});
      const menu = document.createElement('div');
      menu.className = 'toolbar-export-menu';
      menu.style.cssText = `
        position: absolute; right: 0; top: 100%; margin-top: 4px;
        background: var(--snice-color-background-element, rgb(252 251 249));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        box-shadow: var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
        z-index: 100; display: none; min-width: 8rem;
      `;

      const csvItem = this.createMenuItem('CSV', () => { this.onExportCSV?.(); menu.style.display = 'none'; });
      const printItem = this.createMenuItem('Print', () => { this.onExportPrint?.(); menu.style.display = 'none'; });
      menu.appendChild(csvItem);
      menu.appendChild(printItem);

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      exportBtn.addEventListener('click', () => {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
      wrapper.appendChild(exportBtn);
      wrapper.appendChild(menu);
      toolbar.appendChild(wrapper);

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target as Node)) menu.style.display = 'none';
      });
    }

    this.container.appendChild(toolbar);
  }

  private createButton(label: string, icon: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toolbar-btn';
    btn.innerHTML = `<span>${icon}</span> ${label}`;
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 0.25rem;
      padding: 0.375rem 0.625rem;
      border: 1px solid var(--snice-color-border, rgb(226 226 226));
      border-radius: var(--snice-border-radius-md, 0.25rem);
      background: var(--snice-color-background, rgb(255 255 255));
      color: var(--snice-color-text, rgb(23 23 23));
      font-size: var(--snice-font-size-sm, 0.875rem);
      font-family: inherit; cursor: pointer;
      transition: background 0.15s ease;
    `;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private createMenuItem(label: string, onClick: () => void): HTMLElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = label;
    item.style.cssText = `
      display: block; width: 100%; text-align: left;
      padding: 0.5rem 0.75rem; border: none;
      background: transparent; color: var(--snice-color-text, rgb(23 23 23));
      font-size: var(--snice-font-size-sm, 0.875rem);
      font-family: inherit; cursor: pointer;
    `;
    item.addEventListener('mouseenter', () => { item.style.background = 'var(--snice-color-background-secondary, rgb(245 245 245))'; });
    item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
    item.addEventListener('click', onClick);
    return item;
  }

  setActiveFilterCount(count: number) {
    const filterBtn = this.container?.querySelector('.toolbar-btn') as HTMLElement;
    if (filterBtn && this.options.showFilter) {
      // Add/remove badge
      const existingBadge = filterBtn.querySelector('.filter-badge');
      if (count > 0 && !existingBadge) {
        const badge = document.createElement('span');
        badge.className = 'filter-badge';
        badge.textContent = String(count);
        badge.style.cssText = `
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 1rem; height: 1rem; padding: 0 0.25rem;
          border-radius: 9999px; font-size: 0.625rem;
          background: var(--snice-color-primary, rgb(37 99 235));
          color: var(--snice-color-text-inverse, rgb(250 250 250));
        `;
        filterBtn.appendChild(badge);
      } else if (count === 0 && existingBadge) {
        existingBadge.remove();
      } else if (existingBadge) {
        existingBadge.textContent = String(count);
      }
    }
  }

  isAttached(): boolean {
    return this.container !== null;
  }
}
