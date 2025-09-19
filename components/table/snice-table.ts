import { element, on, property, query, request, dispatch, watch } from 'snice';
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

@element('snice-table')
export class SniceTable extends HTMLElement {

  @property({ type: Boolean,  attribute: 'striped' })
  striped = false;

  @property({ type: Boolean,  attribute: 'searchable' })
  searchable = false;

  @property({ type: Boolean,  attribute: 'sortable' })
  sortable = false;

  @property({ type: Boolean,  attribute: 'selectable' })
  selectable = false;

  @property({ type: Boolean,  attribute: 'hoverable' })
  hoverable = true;

  @property({ type: Boolean,  attribute: 'clickable' })
  clickable = false;

  @property({ type: Array, attribute: 'columns' })
  columns: any[] = [];

  @property({ type: Array, attribute: 'data' })
  data: any[] = [];

  @property({ type: Array, attribute: 'current-sort' })
  currentSort: Array<{ column: string, direction: 'asc' | 'desc' }> = [];

  @property({ type: String, attribute: 'search-text' })
  searchText: string = '';

  @property({ type: String, attribute: 'selector' })
  selector: string = '';

  @property({ type: Array, attribute: 'selector-options' })
  selectorOptions: Array<{value: string, label: string}> = [];

  @property({ type: Boolean,  attribute: 'loading' })
  loading: boolean = false;

  @property({ type: Array, attribute: 'selected-rows' })
  selectedRows: number[] = [];

  @query('table')
  table!: HTMLTableElement;

  @query('thead')
  thead!: HTMLTableSectionElement;

  @query('tbody')
  tbody!: HTMLTableSectionElement;

  @request('@snice/table/config')
  async *getTableConfig(): any {
    const config = await (yield {});
    this.columns = config.columns || [];
    this.selectorOptions = config.selectorOptions || [];
    this.render();
    return config;
  }

  @request('@snice/table/data')
  async *getTableData(): any {
    this.loading = true;
    this.selectedRows = []; // Clear selections when loading new data
    
    try {
      const params = {
        search: this.searchText,
        sort: this.currentSort,
        selector: this.selector
      };
      console.log('Requesting table data with params:', params);
      const response = await (yield params);
      console.log('Received table data response:', response);
      this.data = response.data || [];
      this.loading = false;
      this.render();
      return response;
    } catch (error) {
      console.error('Error loading table data:', error);
      this.data = [];
      this.loading = false;
      this.render();
    }
  }

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
    }, 500);
  }

  css() {
    return /*css*/`
      :host {
        display: block;
      }

      .snice-table {
        border-collapse: collapse;
        width: 100%;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: var(--snice-border-radius-lg);
        overflow: hidden;
        border: 1px solid var(--snice-color-border);
      }

      th, td {
        padding: var(--snice-spacing-sm);
        border: 1px solid var(--snice-color-border);
        text-align: left;
        color: var(--snice-color-text);
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

      .search-input {
        min-width: 200px;
        flex: 1;
      }

      .selector-input {
        min-width: 150px;
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
    `;
  }

  html() {
    return /*html*/`
      <div class="snice-table">
        ${this.renderControls()}
        <table>
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    `;
  }

  renderControls() {
    return /*html*/`
      <div class="table-controls" part="controls">
        <snice-input 
          class="search-input"
          type="search" 
          placeholder="Search..." 
          value="${this.searchText}"
          size="medium"
        ></snice-input>
        <snice-select 
          class="selector-input"
          multiple
          searchable
          clearable
          placeholder="Filter..."
          size="medium"
        >
          ${this.selectorOptions.map(opt => 
            `<snice-option value="${opt.value}">${opt.label}</snice-option>`
          ).join('')}
        </snice-select>
      </div>
    `;
  }

  render() {
    console.log('render() called');
    this.renderHeader();
    this.renderBody();
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

  renderHeader() {
    if (!this.thead) return;
    
    const headerRow = document.createElement('tr');
    
    if (this.selectable) {
      const selectCell = document.createElement('th');
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

    this.columns.forEach(column => {
      const th = document.createElement('th');
      th.setAttribute('data-key', column.key);
      
      if (this.sortable && column.sortable !== false) {
        th.classList.add('sortable');
        th.setAttribute('role', 'button');
        th.innerHTML = this.renderSortableHeader(column);
      } else {
        th.textContent = column.label;
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
    
    return `
      <div class="sort-header">
        <span>${column.label}</span>
        <div class="sort-indicator ${isActive ? 'active' : ''}">
          ${indicator}
          ${orderNumber}
        </div>
      </div>
    `;
  }


  renderBody() {
    if (!this.tbody) return;

    console.log('renderBody called with data:', this.data.length, 'columns:', this.columns.length, 'loading:', this.loading);
    
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
    
    this.data.forEach((rowData, index) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-index', String(index));
      
      // Set row selection state
      const isSelected = this.selectedRows.includes(index);
      tr.setAttribute('data-selected', String(isSelected));
      
      if (this.selectable) {
        const selectCell = document.createElement('td');
        selectCell.innerHTML = `<input type="checkbox" class="row-select" ${isSelected ? 'checked' : ''} data-row-index="${index}" />`;
        tr.appendChild(selectCell);
      }

      this.columns.forEach(column => {
        const td = document.createElement('td');
        const value = rowData[column.key];
        
        // Create cell component as HTML string
        const cellTagName = this.getCellTagName(column.type);
        const attributes = this.getCellAttributes(column, value);
        td.innerHTML = `<${cellTagName} ${attributes}></${cellTagName}>`;
        
        tr.appendChild(td);
      });

      this.tbody.appendChild(tr);
    });
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
      default:
        return 'snice-cell';
    }
  }

  @on('click', 'th.sortable')
  handleSort(e: MouseEvent) {
    const th = (e.target as HTMLElement).closest('th.sortable');
    if (!th) return;
    
    const columnKey = th.getAttribute('data-key');
    if (columnKey) {
      console.log('Sorting column:', columnKey);
      this.toggleSort(columnKey, true); // Always multi-sort
    }
  }


  @on('change', '.row-select')
  handleRowSelect(e: Event) {
    const checkbox = e.target as HTMLInputElement;
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
  }

  @on('change', '.select-all')
  handleSelectAll(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.selectedRows = this.data.map((_, index) => index);
    } else {
      this.selectedRows = [];
    }
    
    this.updateRowSelectionState();
    this.dispatchSelectAllChanged(checkbox.checked);
  }

  @on('click', 'tbody tr')
  handleRowClick(e: Event) {
    const tr = (e.target as HTMLElement).closest('tr');
    if (!tr) return;
    
    const target = e.target as HTMLElement;
    
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

  @on('@snice/controller-attached')
  onAttached() {
    console.log('Controller attached, loading config and data...');
    this.getTableConfig();
    this.getTableData();
  }

  @on('input', '.search-input', { debounce: 500 })
  handleSearchChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchText = input.value;
    this.debouncedDataRequest();
  }

  @on('@snice/select/change', '.selector-input', { debounce: 150 }) 
  handleSelectorChange(e: CustomEvent) {
    this.selector = Array.isArray(e.detail.value) ? e.detail.value.join(',') : e.detail.value;
    this.debouncedDataRequest();
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
    console.log('toggleSort called:', { columnKey, multiSort, currentSort: this.currentSort });
    
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
    
    console.log('New sort state:', this.currentSort);
    this.renderHeader(); // Update sort indicators immediately
    this.debouncedDataRequest(); // Show loading immediately, debounce the actual request
  }

  @dispatch('@snice/table/row-selection-changed', { bubbles: true, composed: true })
  private dispatchRowSelectionChanged(rowIndex: number, selected: boolean) {
    return {
      selectedRows: this.selectedRows,
      rowIndex,
      selected
    };
  }

  @dispatch('@snice/table/select-all-changed', { bubbles: true, composed: true })
  private dispatchSelectAllChanged(allSelected: boolean) {
    return {
      selectedRows: this.selectedRows,
      allSelected
    };
  }

}