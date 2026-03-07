import { element, property, query, request, dispatch, watch, render, styles, html, css, ready, dispose } from 'snice';
import '../input/snice-input';
import '../select/snice-select';
import './snice-cell.ts';
import './snice-cell-text.ts';
import './snice-cell-number.ts';
import './snice-cell-date.ts';
import './snice-cell-boolean.ts';
import './snice-cell-rating.ts';
import './snice-cell-progress.ts';
import './snice-cell-duration.ts';
import './snice-cell-filesize.ts';
import './snice-cell-sparkline.ts';
import './snice-column.ts';
import './snice-row.ts';
import { TableVirtualizer } from './table-virtualizer';
import { TableColumnManager } from './table-column-manager';
import { TableFilterEngine } from './table-filter-engine';
import { TableEditor } from './table-editor';
import { TableKeyboard } from './table-keyboard';
import { TableExport } from './table-export';
import type { ColumnFilter, FilterLogic, FilterModel } from './table-filter-engine';
import type { ValuePipeline } from './table-editor';

@element('snice-table')
export class SniceTable extends HTMLElement {

  @property({ type: Boolean,  attribute: 'striped' })
  striped = false;

  @property({ type: Boolean,  attribute: 'searchable' })
  searchable = false;

  @property({ type: Boolean,  attribute: 'filterable' })
  filterable = false;

  @property({ type: Boolean,  attribute: 'sortable' })
  sortable = false;

  @property({ type: Boolean,  attribute: 'selectable' })
  selectable = false;

  @property({ type: Boolean,  attribute: 'hoverable' })
  hoverable = true;

  @property({ type: Boolean,  attribute: 'clickable' })
  clickable = false;

  @property({ type: Boolean,  attribute: 'list' })
  list = false;

  @property({ type: Boolean, attribute: 'pagination' })
  pagination = false;

  @property({ attribute: 'pagination-mode' })
  paginationMode: 'client' | 'server' = 'client';

  @property({ type: Number, attribute: 'page-size' })
  pageSize = 10;

  @property({ type: Number, attribute: 'current-page' })
  currentPage = 1;

  @property({ type: Number, attribute: 'total-items' })
  totalItems = 0;

  @property({ type: Array, attribute: false })
  pageSizes: number[] = [10, 25, 50, 100];

  @property({ type: Number,  attribute: 'search-debounce' })
  searchDebounce = 500;

  // Plain properties - no reflection to attributes
  columns: any[] = [];
  data: any[] = [];

  setData(data: any[]) {
    this._unsortedData = [...data];
    this.data = data;
    this.render();
  }

  setColumns(columns: any[]) {
    this.columns = columns;
    this.render();
  }

  @property({ type: Array, attribute: false })
  currentSort: Array<{ column: string, direction: 'asc' | 'desc' }> = [];

  // Don't use @property decorator to avoid auto-rendering on searchText change
  // This would cause the input to lose focus while typing
  searchText: string = '';

  @property({ type: String, attribute: 'selector' })
  selector: string = '';

  @property({ type: Array, attribute: false })
  selectorOptions: Array<{value: string, label: string}> = [];

  @property({ type: Boolean,  attribute: 'loading' })
  loading: boolean = false;

  @property({ type: Boolean, attribute: 'virtualize' })
  virtualize = false;

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 48;

  @property({ type: Number, attribute: 'virtual-buffer' })
  virtualBuffer = 200;

  @property({ type: Boolean, attribute: 'column-resize' })
  columnResize = false;

  @property({ type: Boolean, attribute: 'editable' })
  editable = false;

  @property({ attribute: 'edit-mode' })
  editMode: 'cell' | 'row' = 'cell';

  @property({ attribute: 'density' })
  density: 'compact' | 'standard' | 'comfortable' = 'standard';

  @property({ type: Boolean, attribute: 'header-filters' })
  headerFilters = false;

  @property({ type: Boolean, attribute: 'quick-filter' })
  quickFilter = false;

  @property({ type: Array, attribute: false })
  selectedRows: number[] = [];

  // Module instances
  private virtualizer = new TableVirtualizer();
  private columnManager = new TableColumnManager();
  private filterEngine = new TableFilterEngine();
  private editor = new TableEditor();
  private keyboard = new TableKeyboard();
  private exporter = new TableExport();

  @query('table')
  table!: HTMLTableElement;

  @query('thead')
  thead!: HTMLTableSectionElement;

  @query('tbody')
  tbody!: HTMLTableSectionElement;


  @request('table/config')
  async *getTableConfig(): any {
    const config = await (yield {});
    this.columns = config.columns || [];
    this.selectorOptions = config.selectorOptions || [];
    // Wait for next frame to ensure DOM is updated
    await new Promise(resolve => requestAnimationFrame(resolve));
    this.renderHeader();
    this.renderControls();
    return config;
  }

  @request('table/data')
  async *getTableData(): any {
    this.loading = true;
    this.selectedRows = []; // Clear selections when loading new data

    try {
      const params: any = {
        search: this.searchText,
        sort: this.currentSort,
        selector: this.selector
      };

      if (this.pagination) {
        params.page = this.currentPage;
        params.pageSize = this.pageSize;
      }
      const response = await (yield params);
      this.data = response.data || [];
      if (response.totalItems !== undefined) {
        this.totalItems = response.totalItems;
      }
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.renderBody();
      return response;
    } catch (error) {
      console.error('Error loading table data:', error);
      this.data = [];
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.renderBody();
    }
  }

  private _hasController = false;
  private _unsortedData: any[] = [];
  private dataRequestTimeout: any = null;
  
  private debouncedDataRequest() {
    // Set loading immediately for instant feedback
    if (!this.loading) {
      this.loading = true;
    }
    
    if (this.dataRequestTimeout) {
      clearTimeout(this.dataRequestTimeout);
    }
    
    this.dataRequestTimeout = setTimeout(() => {
      this.getTableData();
      this.dataRequestTimeout = null;
    }, 150);
  }

  @styles()
  styles() {
    return css/*css*/`
      :host {
        display: block;
      }

      .snice-table {
        width: 100%;
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: var(--snice-border-radius-lg);
        border: 1px solid var(--snice-color-border);
      }

      th, td {
        padding: var(--snice-spacing-xsm) var(--snice-spacing-xsm);
        border: 1px solid var(--snice-color-border);
        text-align: left;
        color: var(--snice-color-text);
        max-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      th {
        padding: var(--snice-spacing-sm) var(--snice-spacing-sm);
      }

      th.select-column,
      td.select-column {
        width: 2.5rem;
        max-width: 2.5rem;
        text-align: center;
        padding: var(--snice-spacing-xs);
      }

      th {
        background-color: var(--snice-color-background-secondary);
        color: var(--snice-color-text);
        font-weight: var(--snice-font-weight-semibold);
        border-bottom: 2px solid var(--snice-color-border);
      }

      th.sortable {
        cursor: pointer;
        user-select: none;
      }

      th.sortable:hover {
        background-color: var(--snice-color-background-tertiary);
      }

      /* Row styling */
      :host([striped]) tbody tr:nth-child(even) {
        background-color: var(--snice-color-background-secondary);
      }

      :host([hoverable]) tbody tr:hover {
        background-color: var(--snice-color-background-tertiary);
      }

      :host([clickable]) tbody tr {
        cursor: pointer;
      }

      :host([selectable]) tbody tr {
        cursor: pointer;
      }

      tbody tr[data-selected="true"] {
        background-color: var(--snice-color-background-tertiary);
        border-left: 3px solid var(--snice-color-primary);
      }

      tbody tr[data-selected="true"]:hover {
        background-color: var(--snice-color-background-tertiary);
      }

      /* List mode - hide vertical borders */
      :host([list]) th,
      :host([list]) td {
        border-left: none;
        border-right: none;
      }

      :host([list]) th:first-child,
      :host([list]) td:first-child {
        border-left: none;
      }

      :host([list]) th:last-child,
      :host([list]) td:last-child {
        border-right: none;
      }

      :host([list]) table {
        border-left: none;
        border-right: none;
      }

      [part="header"] {
        background-color: var(--snice-color-background);
      }

      [part="body"] {
        background-color: var(--snice-table-body-bg, --snice-color-background);
        display: block;
      }

      .table-controls {
        display: flex;
        gap: var(--snice-spacing-md);
        align-items: center;
        flex-wrap: wrap;
      }

      :host(:not([searchable])) .search-input {
        display: none;
      }

      :host(.selector-options-empty) .selector-input {
        display: none;
      }

      .search-input,
      .selector-input {
        height: 2.5rem;
      }

      .search-input {
        min-width: 12.5rem;
        flex: 1;
      }

      .selector-input {
        min-width: 9.375rem;
        --snice-select-min-height: 2rem;
      }

      /* Sort indicators */
      .sort-header {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs);
        justify-content: space-between;
      }


      .sort-indicator {
        display: flex;
        flex-direction: column;
        font-size: 0.7em;
        line-height: 1;
        opacity: 0.3;
        transition: opacity var(--snice-transition-fast);
      }

      .sort-indicator.active {
        opacity: 1;
      }

      .sort-order {
        font-size: 0.6em;
        background: var(--snice-color-primary);
        color: var(--snice-color-text-inverse);
        border-radius: var(--snice-border-radius-sm);
        padding: 1px 3px;
        min-width: 12px;
        text-align: center;
      }

      /* Loading fade */
      tbody {
        transition: opacity var(--snice-transition-normal);
      }

      :host([loading]) tbody {
        opacity: 0.5;
      }

      .no-data {
        text-align: center;
        padding: var(--snice-spacing-lg);
        color: var(--snice-color-text-secondary);
      }

      /* Pagination */
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--snice-spacing-md, 1rem);
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        background: var(--snice-color-background, rgb(255 255 255));
        font-size: var(--snice-font-size-sm, 0.875rem);
        flex-wrap: wrap;
      }

      .pagination__info {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        white-space: nowrap;
      }

      .pagination__controls {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .pagination__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 var(--snice-spacing-2xs, 0.25rem);
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-background, rgb(255 255 255));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        cursor: pointer;
        transition: all var(--snice-transition-fast, 150ms) ease;
        font-family: inherit;
        line-height: 1;
      }

      .pagination__btn:hover:not(:disabled) {
        background: var(--snice-color-background-secondary, rgb(245 245 245));
      }

      .pagination__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .pagination__btn--active {
        background: var(--snice-color-primary, rgb(37 99 235));
        color: var(--snice-color-text-inverse, rgb(250 250 250));
        border-color: var(--snice-color-primary, rgb(37 99 235));
      }

      .pagination__btn--active:hover:not(:disabled) {
        background: var(--snice-color-primary-hover, rgb(29 78 216));
      }

      .pagination__btn:focus-visible {
        outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
        outline-offset: 2px;
        z-index: 1;
      }

      .pagination__ellipsis {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }

      .pagination__size {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs, 0.5rem);
        white-space: nowrap;
      }

      .pagination__size label {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }

      .pagination__size-select {
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-background, rgb(255 255 255));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        cursor: pointer;
      }

      .pagination__size-select:focus-visible {
        outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
        outline-offset: 2px;
      }

      /* Column resize handle */
      .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background: transparent;
        z-index: 1;
      }

      .resize-handle:hover,
      .resize-handle:active {
        background: var(--snice-color-primary, rgb(37 99 235));
      }

      /* Filter indicator */
      th.filtered::after {
        content: '';
        position: absolute;
        top: 4px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--snice-color-primary, rgb(37 99 235));
      }

      /* Pinned column separator */
      td[style*="sticky"],
      th[style*="sticky"] {
        box-shadow: 2px 0 4px -1px rgb(0 0 0 / 0.1);
      }

      /* Density: compact */
      :host([density="compact"]) th {
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      :host([density="compact"]) td {
        padding: var(--snice-spacing-3xs, 0.125rem) var(--snice-spacing-xs, 0.5rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      /* Density: comfortable */
      :host([density="comfortable"]) th {
        padding: var(--snice-spacing-md, 1rem);
      }

      :host([density="comfortable"]) td {
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
      }

      /* Editing */
      .table-editor-input {
        width: 100%;
        box-sizing: border-box;
        padding: var(--snice-spacing-2xs, 0.25rem);
        border: 2px solid var(--snice-color-primary, rgb(37 99 235));
        border-radius: var(--snice-border-radius-sm, 0.125rem);
        font-family: inherit;
        font-size: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-background, rgb(255 255 255));
        outline: none;
      }

      .table-editor-select {
        width: 100%;
        padding: var(--snice-spacing-2xs, 0.25rem);
        border: 2px solid var(--snice-color-primary, rgb(37 99 235));
        border-radius: var(--snice-border-radius-sm, 0.125rem);
        font-family: inherit;
        font-size: inherit;
      }

      .table-editor-checkbox {
        width: 1rem;
        height: 1rem;
      }

      td.editing {
        padding: 2px !important;
      }

      .cell-error {
        color: var(--snice-color-danger, rgb(220 38 38));
        font-size: var(--snice-font-size-xs, 0.75rem);
        margin-top: 2px;
      }

      /* Header filter row */
      .header-filter-row td {
        padding: var(--snice-spacing-2xs, 0.25rem);
        background: var(--snice-color-background-secondary, rgb(245 245 245));
      }

      .header-filter-input {
        width: 100%;
        box-sizing: border-box;
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-sm, 0.125rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
        font-family: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-background-input, rgb(248 247 245));
      }

      .header-filter-input:focus {
        outline: none;
        border-color: var(--snice-color-primary, rgb(37 99 235));
      }

      /* Focus indicator for keyboard nav */
      [data-grid-focus] {
        outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
        outline-offset: -2px;
      }

      /* Slotted table layout */
      .snice-table--slotted {
        border: 1px solid var(--snice-color-border);
        border-radius: var(--snice-border-radius-lg);
        overflow: hidden;
      }

      .snice-table--slotted .table-header {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        background-color: var(--snice-color-background-secondary);
        border-bottom: 2px solid var(--snice-color-border);
        padding: var(--snice-spacing-sm);
        font-weight: var(--snice-font-weight-semibold);
        color: var(--snice-color-text);
      }

      .snice-table--slotted .header-cell {
        color: var(--snice-color-text);
      }

      .snice-table--slotted .table-header::slotted(snice-column) {
        padding: var(--snice-spacing-sm);
      }

      .snice-table--slotted .table-body {
        display: flex;
        flex-direction: column;
      }

      .snice-table--slotted .table-body::slotted(snice-row) {
        border-bottom: 1px solid var(--snice-color-border);
      }

      .snice-table--slotted .table-body::slotted(snice-row:last-child) {
        border-bottom: none;
      }

      :host([striped]) .snice-table--slotted .table-body::slotted(snice-row:nth-child(even)) {
        background-color: var(--snice-color-background-secondary);
      }

      :host([hoverable]) .snice-table--slotted .table-body::slotted(snice-row:hover) {
        background-color: var(--snice-color-background-tertiary);
      }
    `;
  }

  @render()
  render() {
    // Check if we have slotted rows
    const hasSlottedRows = this.querySelectorAll('snice-row[slot="rows"]').length > 0;

    if (hasSlottedRows) {
      // Use slotted rows layout
      return html/*html*/`
        <div class="snice-table snice-table--slotted" @click=${this.handleClick} @change=${this.handleChange}>
          <div class="table-controls-container"></div>
          <div class="table-header" id="slotted-header"></div>
          <div class="table-body">
            <slot name="rows"></slot>
          </div>
          <slot name="columns" style="display: none;"></slot>
        </div>
      `;
    } else {
      // Use traditional table layout
      return html/*html*/`
        <div class="snice-table" @click=${this.handleClick} @change=${this.handleChange}>
          <div class="table-controls-container"></div>
          <table>
            <thead></thead>
            <tbody></tbody>
          </table>
          <div class="table-pagination-container"></div>
        </div>
      `;
    }
  }

  renderControls() {
    const container = this.shadowRoot?.querySelector('.table-controls-container');
    if (!container) return;

    const showControls = this.searchable || this.filterable;
    if (!showControls) {
      container.innerHTML = '';
      return;
    }

    // Only render if container is empty (first time)
    if (container.children.length === 0) {
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'table-controls';
      controlsDiv.setAttribute('part', 'controls');

      if (this.searchable) {
        const searchInput = document.createElement('snice-input');
        searchInput.className = 'search-input';
        searchInput.setAttribute('type', 'search');
        searchInput.setAttribute('placeholder', 'Search...');
        searchInput.setAttribute('size', 'medium');
        searchInput.addEventListener('input', this.handleSearchInput);
        controlsDiv.appendChild(searchInput);
      }

      if (this.filterable) {
        const select = document.createElement('snice-select');
        select.className = 'selector-input';
        select.setAttribute('multiple', '');
        select.setAttribute('searchable', '');
        select.setAttribute('clearable', '');
        select.setAttribute('placeholder', 'Filter...');
        select.setAttribute('size', 'medium');

        this.selectorOptions.forEach(opt => {
          const option = document.createElement('snice-option');
          option.setAttribute('value', opt.value);
          option.textContent = opt.label;
          select.appendChild(option);
        });

        controlsDiv.appendChild(select);
      }

      container.appendChild(controlsDiv);
    }
  }

  @ready()
  async initialize() {
    // Listen for controller attached event
    this.addEventListener('controller-attached', this.onAttached as EventListener);

    // Listen for select change events from the filter dropdown
    this.addEventListener('select-change', this.handleSelectorChange as EventListener);

    // Wait for snice-column to be defined
    await customElements.whenDefined('snice-column');
    await customElements.whenDefined('snice-row');

    // Process slotted columns and rows
    await this.processSlottedContent();

    // Render controls after initial setup
    this.renderControls();

    // Initialize feature modules
    this.initializeModules();

    // Setup virtualization if enabled
    if (this.virtualize) {
      requestAnimationFrame(() => this.setupVirtualization());
    }
  }

  private async processSlottedContent() {
    // Get slotted column elements
    const columnElements = Array.from(this.querySelectorAll('snice-column[slot="columns"]')) as any[];

    if (columnElements.length > 0) {
      // Extract column definitions from snice-column elements
      this.columns = columnElements.map((col: any) => col.getColumnDefinition());

      // Pass column definitions to slotted rows
      const rowElements = Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
      rowElements.forEach((row: any, index: number) => {
        row.columns = this.columns;
        row.index = index;
        row.hoverable = this.hoverable;
        row.clickable = this.clickable;
        row.selectable = this.selectable;
      });

      // Render the header for slotted mode (after next tick to ensure DOM is updated)
      requestAnimationFrame(() => this.renderSlottedHeader());
    }
  }

  private renderSlottedHeader() {
    const headerContainer = this.shadowRoot?.querySelector('#slotted-header');
    if (!headerContainer || this.columns.length === 0) return;

    // Render column headers
    headerContainer.innerHTML = this.columns.map(col =>
      `<div class="header-cell">${col.label}</div>`
    ).join('');
  }


  @watch('selector-options')
  handleSelectorOptionsChange() {
    // Update CSS class to show/hide selector
    if (this.selectorOptions.length === 0) {
      this.classList.add('selector-options-empty');
    } else {
      this.classList.remove('selector-options-empty');
    }
  }

  @watch('sortable')
  handleSortableChange() {
    this.renderHeader(); // Re-render header to show/hide sort indicators
  }

  @watch('selectable')
  handleSelectableChange() {
    this.render(); // Re-render both header and body for checkbox columns
  }

  @watch('columns')
  handleColumnsChange() {
    this.renderHeader();
  }

  @watch('data', 'loading')
  handleDataChange() {
    this.renderBody();
  }

  @watch('selected-rows')
  handleSelectedRowsChange() {
    this.updateRowSelectionState();
    this.updateSelectAllState();
  }

  @watch('current-sort')
  handleSortChange() {
    this.renderHeader();
  }

  @watch('searchable', 'filterable')
  handleControlsChange() {
    this.renderControls();
  }

  renderHeader() {
    if (!this.thead) return;
    
    const headerRow = document.createElement('tr');
    
    if (this.selectable) {
      const selectCell = document.createElement('th');
      selectCell.className = 'select-column';
      const allSelected = this.selectedRows.length === this.data.length && this.data.length > 0;
      const someSelected = this.selectedRows.length > 0 && this.selectedRows.length < this.data.length;
      selectCell.innerHTML = `<input type="checkbox" class="select-all" ${allSelected ? 'checked' : ''} />`;
      headerRow.appendChild(selectCell);
      
      // Set indeterminate after insertion
      setTimeout(() => {
        const checkbox = selectCell.querySelector('.select-all') as HTMLInputElement;
        if (checkbox) {
          checkbox.indeterminate = someSelected;
        }
      }, 0);
    }

    // Determine which columns are visible
    const visibleStates = this.columnManager.getVisibleColumns();
    const visibleKeys = visibleStates.length > 0 ? new Set(visibleStates.map(s => s.key)) : null;

    this.columns.forEach(column => {
      // Skip hidden columns
      if (visibleKeys && !visibleKeys.has(column.key)) return;

      const th = document.createElement('th');
      th.setAttribute('data-key', column.key);

      // Apply column width
      const state = this.columnManager.getState(column.key);
      if (state) {
        th.style.width = `${state.width}px`;

        // Pinned column sticky positioning
        if (state.pinned === 'left') {
          const offsets = this.columnManager.getPinnedLeftOffsets();
          th.style.position = 'sticky';
          th.style.left = `${offsets.get(column.key) ?? 0}px`;
          th.style.zIndex = '2';
        } else if (state.pinned === 'right') {
          const offsets = this.columnManager.getPinnedRightOffsets();
          th.style.position = 'sticky';
          th.style.right = `${offsets.get(column.key) ?? 0}px`;
          th.style.zIndex = '2';
        }
      }

      if (this.sortable && column.sortable !== false) {
        th.classList.add('sortable');
        th.setAttribute('role', 'button');
        th.innerHTML = this.renderSortableHeader(column);
      } else {
        th.textContent = column.label;
      }

      // Filter indicator
      if (this.filterEngine.hasColumnFilter(column.key)) {
        th.classList.add('filtered');
      }

      // Resize handle
      if (this.columnResize && column.resizable !== false) {
        const handle = document.createElement('span');
        handle.className = 'resize-handle';
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.columnManager.startResize(column.key, e.clientX);
        });
        handle.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (this.tbody) {
            this.columnManager.autoSizeColumn(column.key, this.tbody);
            this.renderHeader();
            this.renderBody();
          }
        });
        th.appendChild(handle);
        th.style.position = 'relative';
      }

      headerRow.appendChild(th);
    });

    this.thead.innerHTML = '';
    this.thead.appendChild(headerRow);
  }

  renderSortableHeader(column: any): string {
    const sortItem = this.currentSort.find(s => s.column === column.key);
    const sortIndex = this.currentSort.findIndex(s => s.column === column.key);
    const isActive = !!sortItem;

    let indicator = '▲▼'; // Default unsorted state
    let orderNumber = '';

    if (sortItem) {
      if (sortItem.direction === 'asc') {
        indicator = '▲';
      } else if (sortItem.direction === 'desc') {
        indicator = '▼';
      }

      if (this.currentSort.length > 1) {
        orderNumber = `<span class="sort-order">${sortIndex + 1}</span>`;
      }
    }

    const indicatorClasses = ['sort-indicator', isActive ? 'active' : ''].filter(Boolean).join(' ');

    return `
      <div class="sort-header">
        <span>${column.label}</span>
        <div class="${indicatorClasses}">
          ${indicator}
          ${orderNumber}
        </div>
      </div>
    `;
  }


  renderBody() {
    if (!this.tbody) return;

    // Update column manager when columns change
    if (this.columns.length > 0) {
      this.columnManager.initialize(this.columns, this);
    }

    // Virtualized rendering: delegate to virtualizer
    if (this.virtualize && this.virtualizer.isEnabled()) {
      const filtered = this.getFilteredData();
      this.virtualizer.setTotalRows(filtered.length);
      this.virtualizer.refresh();

      // Still render pagination
      if (this.pagination) this.renderPagination();
      return;
    }

    this.tbody.innerHTML = '';

    if (this.data.length === 0 && this.columns.length > 0) {
      if (this.loading) {
        // Show loading spinner
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const colSpan = this.columns.length + (this.selectable ? 1 : 0);
        td.colSpan = colSpan;
        td.className = 'no-data';
        td.innerHTML = '<snice-progress variant="circular" indeterminate size="small"></snice-progress>';
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      } else {
        // Show "No Data" message
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const colSpan = this.columns.length + (this.selectable ? 1 : 0);
        td.colSpan = colSpan;
        td.className = 'no-data';
        td.textContent = 'No Data';
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      }
    }

    const fragment = document.createDocumentFragment();

    // Apply client-side filters
    let filteredData = this.getFilteredData();

    // Client-side pagination: slice data
    let displayData = filteredData;
    let startIndex = 0;
    if (this.pagination && this.paginationMode === 'client') {
      this.totalItems = filteredData.length;
      startIndex = (this.currentPage - 1) * this.pageSize;
      displayData = filteredData.slice(startIndex, startIndex + this.pageSize);
    }

    displayData.forEach((rowData, i) => {
      const index = startIndex + i;
      fragment.appendChild(this.createRow(rowData, index));
    });

    this.tbody.appendChild(fragment);

    // Render pagination after body
    if (this.pagination) {
      this.renderPagination();
    }
  }

  private get totalPages(): number {
    const total = this.paginationMode === 'client' ? this.data.length : this.totalItems;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, this.totalPages));
    if (clamped === this.currentPage) return;
    this.currentPage = clamped;

    if (this.paginationMode === 'server' && this._hasController) {
      this.debouncedDataRequest();
    } else {
      this.renderBody();
    }

    this.dispatchPageChange();
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;

    if (this.paginationMode === 'server' && this._hasController) {
      this.debouncedDataRequest();
    } else {
      this.renderBody();
    }

    this.dispatchPageChange();
  }

  @dispatch('page-change', { bubbles: true, composed: true })
  private dispatchPageChange() {
    return {
      page: this.currentPage,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      totalItems: this.paginationMode === 'client' ? this.data.length : this.totalItems
    };
  }

  renderPagination() {
    const container = this.shadowRoot?.querySelector('.table-pagination-container');
    if (!container) return;

    if (!this.pagination) {
      container.innerHTML = '';
      return;
    }

    const total = this.paginationMode === 'client' ? this.data.length : this.totalItems;
    const totalPages = this.totalPages;
    const start = Math.min((this.currentPage - 1) * this.pageSize + 1, total);
    const end = Math.min(this.currentPage * this.pageSize, total);

    // Build page buttons
    const pageButtons: string[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(this.pageButton(i));
      }
    } else {
      pageButtons.push(this.pageButton(1));
      if (this.currentPage > 3) pageButtons.push('<span class="pagination__ellipsis">…</span>');

      const rangeStart = Math.max(2, this.currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, this.currentPage + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pageButtons.push(this.pageButton(i));
      }

      if (this.currentPage < totalPages - 2) pageButtons.push('<span class="pagination__ellipsis">…</span>');
      pageButtons.push(this.pageButton(totalPages));
    }

    const pageSizeOptions = this.pageSizes.map(s =>
      `<option value="${s}" ${s === this.pageSize ? 'selected' : ''}>${s}</option>`
    ).join('');

    container.innerHTML = `
      <div class="pagination" part="pagination">
        <div class="pagination__info">
          Showing ${start}–${end} of ${total}
        </div>
        <div class="pagination__controls">
          <button class="pagination__btn pagination__first" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="1" aria-label="First page">⟨⟨</button>
          <button class="pagination__btn pagination__prev" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}" aria-label="Previous page">⟨</button>
          ${pageButtons.join('')}
          <button class="pagination__btn pagination__next" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}" aria-label="Next page">⟩</button>
          <button class="pagination__btn pagination__last" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${totalPages}" aria-label="Last page">⟩⟩</button>
        </div>
        <div class="pagination__size">
          <label>Rows per page:</label>
          <select class="pagination__size-select">${pageSizeOptions}</select>
        </div>
      </div>
    `;

    // Bind events
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt((btn as HTMLElement).getAttribute('data-page')!);
        this.goToPage(page);
      });
    });

    const sizeSelect = container.querySelector('.pagination__size-select') as HTMLSelectElement;
    if (sizeSelect) {
      sizeSelect.addEventListener('change', () => {
        this.setPageSize(parseInt(sizeSelect.value));
      });
    }
  }

  private pageButton(page: number): string {
    const active = page === this.currentPage ? ' pagination__btn--active' : '';
    return `<button class="pagination__btn pagination__page${active}" data-page="${page}">${page}</button>`;
  }

  getCellAttributes(column: any, value: any): string {
    const attributes = [
      `type="${column.type}"`,
      `align="${column.align || 'left'}"`,
      `value="${String(value || '').replace(/"/g, '&quot;')}"`,
      `in-table="true"`
    ];
    
    // Add type-specific attributes
    if (column.type === 'number' || column.type === 'currency') {
      if (column.decimals !== undefined) attributes.push(`decimals="${column.decimals}"`);
      if (column.thousandsSeparator) attributes.push(`thousands-separator="true"`);
      if (column.prefix) attributes.push(`prefix="${column.prefix}"`);
      if (column.suffix) attributes.push(`suffix="${column.suffix}"`);
    }
    
    if (column.type === 'date') {
      if (column.dateFormat) attributes.push(`date-format="${column.dateFormat}"`);
    }
    
    if (column.type === 'boolean') {
      if (column.useSymbols) attributes.push(`use-symbols="true"`);
      if (column.trueSymbol) attributes.push(`true-symbol="${column.trueSymbol}"`);
      if (column.falseSymbol) attributes.push(`false-symbol="${column.falseSymbol}"`);
      if (column.trueValue) attributes.push(`true-value="${column.trueValue}"`);
      if (column.falseValue) attributes.push(`false-value="${column.falseValue}"`);
    }
    
    return attributes.join(' ');
  }

  getCellTagName(type: string): string {
    switch (type) {
      case 'text':
        return 'snice-cell-text';
      case 'number':
      case 'currency':
        return 'snice-cell-number';
      case 'date':
        return 'snice-cell-date';
      case 'boolean':
        return 'snice-cell-boolean';
      case 'rating':
        return 'snice-cell-rating';
      case 'progress':
        return 'snice-cell-progress';
      case 'duration':
        return 'snice-cell-duration';
      case 'filesize':
        return 'snice-cell-filesize';
      case 'sparkline':
        return 'snice-cell-sparkline';
      case 'image':
        return 'snice-cell-image';
      default:
        return 'snice-cell';
    }
  }

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Handle sortable header click
    const th = target.closest('th.sortable') as HTMLElement;
    if (th) {
      const columnKey = th.getAttribute('data-key');
      if (columnKey) {
        this.toggleSort(columnKey, true); // Always multi-sort
      }
      return;
    }

    // Handle row click
    const tr = target.closest('tbody tr') as HTMLElement;
    if (tr) {
      // Don't trigger if clicking on checkbox or other interactive elements
      if (target.matches('input[type="checkbox"], button, a, .interactive')) {
        return;
      }

      const rowIndex = parseInt(tr.getAttribute('data-index') || '0');
      const rowData = this.data[rowIndex];

      // Handle row selection if selectable
      if (this.selectable) {
        const isCurrentlySelected = this.selectedRows.includes(rowIndex);

        if (isCurrentlySelected) {
          this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
        } else {
          this.selectedRows = [...this.selectedRows, rowIndex];
        }

        this.updateRowSelectionState();
        this.updateSelectAllState();
        this.dispatchRowSelectionChanged(rowIndex, !isCurrentlySelected);
      }

      // Handle clickable row event
      if (this.clickable) {
        this.dispatchEvent(new CustomEvent('row-clicked', {
          detail: { rowData, rowIndex }
        }));
      }
    }
  }

  private handleChange = (e: Event) => {
    const target = e.target as HTMLElement;

    // Handle row select checkbox
    if (target.matches('.row-select')) {
      const checkbox = target as HTMLInputElement;
      const rowIndex = parseInt(checkbox.getAttribute('data-row-index') || '0');

      if (checkbox.checked) {
        if (!this.selectedRows.includes(rowIndex)) {
          this.selectedRows = [...this.selectedRows, rowIndex];
        }
      } else {
        this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
      }

      this.updateRowSelectionState();
      this.updateSelectAllState();
      this.dispatchRowSelectionChanged(rowIndex, checkbox.checked);
      return;
    }

    // Handle select all checkbox
    if (target.matches('.select-all')) {
      const checkbox = target as HTMLInputElement;

      if (checkbox.checked) {
        this.selectedRows = this.data.map((_, index) => index);
      } else {
        this.selectedRows = [];
      }

      this.updateRowSelectionState();
      this.dispatchSelectAllChanged(checkbox.checked);
    }
  }

  private onAttached = () => {
    this._hasController = true;
    this.getTableConfig();
    this.getTableData();
  }

  private searchDebounceTimeout: any = null;

  private handleSearchInput = (e: Event) => {
    const target = e.target as HTMLElement;
    const input = target as HTMLInputElement;
    this.searchText = input.value;

    // Manual debounce implementation
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
    this.searchDebounceTimeout = setTimeout(() => {
      this.debouncedDataRequest();
    }, this.searchDebounce);
  }

  private selectorDebounceTimeout: any = null;

  private handleSelectorChange = (e: CustomEvent) => {
    this.selector = Array.isArray(e.detail.value) ? e.detail.value.join(',') : e.detail.value;

    // Manual debounce implementation
    if (this.selectorDebounceTimeout) {
      clearTimeout(this.selectorDebounceTimeout);
    }
    this.selectorDebounceTimeout = setTimeout(() => {
      this.debouncedDataRequest();
    }, 150);
  }


  updateRowSelectionState() {
    if (!this.tbody) return;
    
    const rows = this.tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const isSelected = this.selectedRows.includes(index);
      row.setAttribute('data-selected', String(isSelected));
      
      const checkbox = row.querySelector('.row-select') as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    });
  }

  updateSelectAllState() {
    const selectAllCheckbox = this.thead?.querySelector('.select-all') as HTMLInputElement;
    if (!selectAllCheckbox) return;
    
    const allSelected = this.selectedRows.length === this.data.length;
    const someSelected = this.selectedRows.length > 0 && this.selectedRows.length < this.data.length;
    
    selectAllCheckbox.checked = allSelected;
    selectAllCheckbox.indeterminate = someSelected;
  }

  toggleSort(columnKey: string, multiSort: boolean = false) {
    if (!multiSort) {
      // Single column sort - clear all other sorts
      const existingSort = this.currentSort.find(s => s.column === columnKey);

      if (!existingSort) {
        this.currentSort = [{ column: columnKey, direction: 'asc' }];
      } else if (existingSort.direction === 'asc') {
        this.currentSort = [{ column: columnKey, direction: 'desc' }];
      } else {
        this.currentSort = [];
      }
    } else {
      // Multi column sort - modify existing or add new
      const existingSortIndex = this.currentSort.findIndex(s => s.column === columnKey);

      if (existingSortIndex === -1) {
        // Add new sort
        this.currentSort = [...this.currentSort, { column: columnKey, direction: 'asc' }];
      } else {
        const existingSort = this.currentSort[existingSortIndex];
        if (existingSort.direction === 'asc') {
          // Change to desc - create new array to trigger reactivity
          this.currentSort = this.currentSort.map((sort, index) =>
            index === existingSortIndex ? { ...sort, direction: 'desc' as const } : sort
          );
        } else {
          // Remove this sort
          this.currentSort = this.currentSort.filter(s => s.column !== columnKey);
        }
      }
    }

    this.renderHeader(); // Update sort indicators immediately
    if (this._hasController) {
      this.debouncedDataRequest(); // Delegate to controller for server-side sort
    } else {
      this.sortLocalData(); // Sort in-memory data
    }
  }

  private sortLocalData() {
    if (!this._unsortedData.length) {
      this._unsortedData = [...this.data];
    }
    if (this.currentSort.length === 0) {
      this.data = [...this._unsortedData];
    } else {
      this.data = [...this._unsortedData].sort((a, b) => {
        for (const { column, direction } of this.currentSort) {
          const aVal = a[column] ?? '';
          const bVal = b[column] ?? '';
          const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
          if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }
    this.renderBody();
  }

  @dispatch('table-row-selection-changed', { bubbles: true, composed: true })
  private dispatchRowSelectionChanged(rowIndex: number, selected: boolean) {
    return {
      selectedRows: this.selectedRows,
      rowIndex,
      selected
    };
  }

  @dispatch('table-select-all-changed', { bubbles: true, composed: true })
  private dispatchSelectAllChanged(allSelected: boolean) {
    return {
      selectedRows: this.selectedRows,
      allSelected
    };
  }

  // ── Module Integration: Initialize ──

  private initializeModules() {
    // Column manager
    this.columnManager.initialize(this.columns, this);

    // Editor
    if (this.editable) {
      this.editor.attach(this);
      this.editor.setEditMode(this.editMode);
      const editableCols = this.columns.filter(c => c.editable !== false).map(c => c.key);
      this.editor.setEditableColumns(editableCols);

      // Register value pipelines
      for (const col of this.columns) {
        if (col.valueGetter || col.valueFormatter || col.valueParser || col.valueSetter) {
          this.editor.setPipeline(col.key, {
            valueGetter: col.valueGetter,
            valueFormatter: col.valueFormatter,
            valueParser: col.valueParser,
            valueSetter: col.valueSetter,
          });
        }
      }
    }

    // Keyboard
    if (this.shadowRoot) {
      this.keyboard.attach({
        shadowRoot: this.shadowRoot,
        totalRows: this.data.length,
        totalColumns: this.columns.length,
        tabMode: 'all',
        isEditing: () => this.editor.isEditing(),
        onCellActivate: (row, col) => {
          if (this.editable) this.startEdit(row, col);
        },
        onSelectionToggle: (row) => {
          if (this.selectable) this.toggleRowSelection(row);
        },
        onSelectAll: () => {
          if (this.selectable) this.selectAllRows();
        },
      });
    }
  }

  @dispose()
  cleanup() {
    this.virtualizer.detach();
    this.keyboard.detach();
  }

  // ── Virtualization API ──

  private setupVirtualization() {
    if (!this.virtualize || !this.shadowRoot) return;

    const scrollContainer = this.shadowRoot.querySelector('.snice-table') as HTMLElement;
    if (!scrollContainer) return;

    this.virtualizer.attach({
      rowHeight: this.rowHeight,
      bufferPx: this.virtualBuffer,
      totalRows: this.getFilteredData().length,
      scrollContainer,
      renderRange: (start, end) => this.renderRowRange(start, end),
    });
  }

  private renderRowRange(startIndex: number, endIndex: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const displayData = this.getFilteredData();

    for (let i = startIndex; i < endIndex && i < displayData.length; i++) {
      const rowData = displayData[i];
      const tr = this.createRow(rowData, i);
      fragment.appendChild(tr);
    }

    return fragment;
  }

  scrollToRow(index: number) {
    this.virtualizer.scrollToRow(index);
  }

  getScrollPosition() {
    return this.virtualizer.getScrollPosition();
  }

  // ── Filtering API ──

  setColumnFilter(column: string, operator: any, value: any) {
    this.filterEngine.setColumnFilter(column, operator, value);
    this.applyClientFilters();
  }

  removeColumnFilter(column: string) {
    this.filterEngine.removeColumnFilter(column);
    this.applyClientFilters();
  }

  setQuickFilter(text: string) {
    this.filterEngine.setQuickFilter(text);
    this.applyClientFilters();
  }

  setFilterModel(model: FilterModel) {
    this.filterEngine.setFilterModel(model);
    this.applyClientFilters();
  }

  getFilterModel() {
    return this.filterEngine.getFilterModel();
  }

  clearAllFilters() {
    this.filterEngine.clearAllFilters();
    this.applyClientFilters();
  }

  private getFilteredData(): any[] {
    if (!this.filterEngine.hasActiveFilters()) return this.data;
    return this.filterEngine.applyFilters(this.data, this.columns);
  }

  private applyClientFilters() {
    if (this._hasController) {
      // Server-side: send filter params to controller
      this.debouncedDataRequest();
    } else {
      // Client-side: re-render with filtered data
      this.renderBody();
    }
  }

  // ── Column API ──

  setColumnVisible(key: string, visible: boolean) {
    this.columnManager.setColumnVisible(key, visible);
    this.renderHeader();
    this.renderBody();
  }

  showAllColumns() {
    this.columnManager.showAllColumns();
    this.renderHeader();
    this.renderBody();
  }

  hideAllColumns() {
    this.columnManager.hideAllColumns();
    this.renderHeader();
    this.renderBody();
  }

  getColumnVisibility() {
    return this.columnManager.getVisibilityModel();
  }

  pinColumn(key: string, side: 'left' | 'right') {
    this.columnManager.pinColumn(key, side);
    this.renderHeader();
    this.renderBody();
  }

  unpinColumn(key: string) {
    this.columnManager.unpinColumn(key);
    this.renderHeader();
    this.renderBody();
  }

  autoSizeColumn(key: string) {
    if (this.tbody) {
      this.columnManager.autoSizeColumn(key, this.tbody);
      this.renderHeader();
    }
  }

  autoSizeAllColumns() {
    if (this.tbody) {
      this.columnManager.autoSizeAll(this.tbody);
      this.renderHeader();
    }
  }

  moveColumn(key: string, toIndex: number) {
    this.columnManager.moveColumn(key, toIndex);
    this.renderHeader();
    this.renderBody();
  }

  // ── Editing API ──

  startEdit(rowIndex: number, columnKey: string) {
    if (!this.editable) return;
    const row = this.data[rowIndex];
    if (!row) return;

    if (this.editMode === 'row') {
      this.editor.startRowEdit(rowIndex, row);
    } else {
      const value = row[columnKey];
      this.editor.startCellEdit(rowIndex, columnKey, value, row);
    }
    // Re-render the affected row to show editor
    this.renderBody();
  }

  async commitEdit(): Promise<string | null> {
    if (this.editMode === 'row') {
      const errors = await this.editor.commitRowEdit();
      this.renderBody();
      return errors ? 'Validation errors' : null;
    } else {
      const error = await this.editor.commitCellEdit();
      this.renderBody();
      return error;
    }
  }

  cancelEdit() {
    if (this.editMode === 'row') {
      this.editor.cancelRowEdit();
    } else {
      this.editor.cancelCellEdit();
    }
    this.renderBody();
  }

  // ── Export API ──

  exportCSV(options?: any) {
    const data = this.getFilteredData();
    const selectedData = options?.selectedOnly
      ? this.selectedRows.map(i => data[i]).filter(Boolean)
      : data;
    this.exporter.exportCSV(selectedData, this.columns, options);
  }

  printTable(options?: any) {
    this.exporter.print(this, options);
  }

  async copyToClipboard(options?: any): Promise<boolean> {
    return this.exporter.copyToClipboard(this.getFilteredData(), this.columns, this.selectedRows, options);
  }

  // ── Selection helpers ──

  private toggleRowSelection(rowIndex: number) {
    const isSelected = this.selectedRows.includes(rowIndex);
    if (isSelected) {
      this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
    } else {
      this.selectedRows = [...this.selectedRows, rowIndex];
    }
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.dispatchRowSelectionChanged(rowIndex, !isSelected);
  }

  private selectAllRows() {
    if (this.selectedRows.length === this.data.length) {
      this.selectedRows = [];
    } else {
      this.selectedRows = this.data.map((_, i) => i);
    }
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.dispatchSelectAllChanged(this.selectedRows.length === this.data.length);
  }

  // ── Row creation helper (used by both regular and virtualized rendering) ──

  private createRow(rowData: any, index: number): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', String(index));

    const isSelected = this.selectedRows.includes(index);
    tr.setAttribute('data-selected', String(isSelected));

    if (this.selectable) {
      const selectCell = document.createElement('td');
      selectCell.className = 'select-column';
      selectCell.innerHTML = `<input type="checkbox" class="row-select" ${isSelected ? 'checked' : ''} data-row-index="${index}" />`;
      tr.appendChild(selectCell);
    }

    const visibleCols = this.columnManager.getAllStates().length > 0
      ? this.columnManager.getVisibleColumns()
      : null;

    const columnsToRender = visibleCols
      ? this.columns.filter(col => visibleCols.some(s => s.key === col.key))
      : this.columns;

    columnsToRender.forEach(column => {
      const td = document.createElement('td');
      td.setAttribute('data-key', column.key);
      const value = rowData[column.key];
      const cellTagName = this.getCellTagName(column.type);
      const attributes = this.getCellAttributes(column, value);
      td.innerHTML = `<${cellTagName} ${attributes}></${cellTagName}>`;

      // Apply column width
      const state = this.columnManager.getState(column.key);
      if (state) {
        td.style.width = `${state.width}px`;

        // Pinned column sticky positioning
        if (state.pinned === 'left') {
          const offsets = this.columnManager.getPinnedLeftOffsets();
          td.style.position = 'sticky';
          td.style.left = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
          td.style.background = 'var(--snice-color-background, rgb(255 255 255))';
        } else if (state.pinned === 'right') {
          const offsets = this.columnManager.getPinnedRightOffsets();
          td.style.position = 'sticky';
          td.style.right = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
          td.style.background = 'var(--snice-color-background, rgb(255 255 255))';
        }
      }

      tr.appendChild(td);
    });

    return tr;
  }

}