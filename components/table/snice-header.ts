import { element, property, on, watch, ready, dispatch } from 'snice';
import type { 
  SniceHeaderElement, 
  ColumnDefinition,
  TableSort,
  SortDirection
} from './snice-table.types';

@element('snice-header')
export class SniceHeader extends HTMLElement implements SniceHeaderElement {
  @property({ type: Boolean,  })
  sticky: boolean = false;

  @property({ type: Array })
  columns: ColumnDefinition[] = [];

  @property({ type: Boolean,  })
  selectable: boolean = false;

  @property({ type: Boolean,  })
  sortable: boolean = false;

  @property({ type: Object })
  currentSort: TableSort = { column: '', direction: null };

  @property({ type: Boolean,  attribute: 'all-selected' })
  allSelected: boolean = false;

  @property({ type: Boolean,  attribute: 'some-selected' })
  someSelected: boolean = false;

  html() {
    return `
      <div class="header-container" part="container">
        ${this.selectable ? this.renderSelectAllCheckbox() : ''}
        ${this.renderHeaderCells()}
      </div>
    `;
  }

  @ready()
  init() {
    this.updateHeaderAttributes();
  }

  @watch('sticky', 'selectable', 'sortable')
  updateHeaderAttributes() {
    this.classList.toggle('header--sticky', this.sticky);
    this.classList.toggle('header--selectable', this.selectable);
    this.classList.toggle('header--sortable', this.sortable);
  }

  @watch('columns', 'currentSort')
  updateHeaderCells() {
    const cellsContainer = this.shadowRoot?.querySelector('.cells-container');
    if (cellsContainer) {
      cellsContainer.innerHTML = this.renderHeaderCells();
    }
  }

  @watch('allSelected', 'someSelected')
  updateSelectAllCheckbox() {
    const checkbox = this.shadowRoot?.querySelector('.select-all-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = this.allSelected;
      checkbox.indeterminate = this.someSelected && !this.allSelected;
    }
  }

  @on('click', '.header-cell[data-sortable="true"]')
  handleSort(e: MouseEvent) {
    const cell = e.currentTarget as HTMLElement;
    const columnKey = cell.dataset.columnKey;
    
    if (columnKey && this.sortable) {
      this.dispatchSort(columnKey);
    }
  }

  @on('change', '.select-all-checkbox')
  handleSelectAll(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    this.dispatchSelectAll(checkbox.checked);
  }

  @on('keydown', '.header-cell[data-sortable="true"]')
  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const cell = e.currentTarget as HTMLElement;
      const columnKey = cell.dataset.columnKey;
      
      if (columnKey && this.sortable) {
        this.dispatchSort(columnKey);
      }
    }
  }

  private renderSelectAllCheckbox(): string {
    return `
      <div class="header-cell header-cell--checkbox" part="checkbox-cell">
        <input 
          type="checkbox" 
          class="select-all-checkbox" 
          ${this.allSelected ? 'checked' : ''}
          title="Select all rows"
          tabindex="0"
        />
      </div>
    `;
  }

  private renderHeaderCells(): string {
    if (!this.columns.length) {
      return '';
    }

    return `
      <div class="cells-container">
        ${this.columns.map((column, index) => this.renderHeaderCell(column, index)).join('')}
      </div>
    `;
  }

  private renderHeaderCell(column: ColumnDefinition, index: number): string {
    const isSortable = this.sortable && column.sortable !== false;
    const isCurrentSort = this.currentSort.column === column.key;
    const sortDirection = isCurrentSort ? this.currentSort.direction : null;
    
    return `
      <div 
        class="header-cell header-cell--${column.type || 'text'}" 
        part="cell"
        data-column-key="${column.key}"
        data-column-index="${index}"
        data-sortable="${isSortable}"
        style="${this.getHeaderCellStyles(column)}"
        ${isSortable ? 'role="button" tabindex="0"' : ''}
        ${isSortable ? `aria-label="Sort by ${column.label}"` : ''}
        ${isCurrentSort ? `aria-sort="${this.getAriaSortValue(sortDirection)}"` : ''}
      >
        <div class="header-cell-content">
          <span class="header-cell-label">${column.label}</span>
          ${isSortable ? this.renderSortIndicator(sortDirection) : ''}
        </div>
        ${column.filterable ? this.renderFilterButton(column) : ''}
      </div>
    `;
  }

  private renderSortIndicator(direction: SortDirection): string {
    const ascIcon = '▲';
    const descIcon = '▼';
    const neutralIcon = '⇅';
    
    let icon = neutralIcon;
    let state = 'neutral';
    
    if (direction === 'asc') {
      icon = ascIcon;
      state = 'ascending';
    } else if (direction === 'desc') {
      icon = descIcon;
      state = 'descending';
    }
    
    return `
      <span 
        class="sort-indicator sort-indicator--${state}" 
        part="sort-indicator"
        aria-hidden="true"
      >${icon}</span>
    `;
  }

  private renderFilterButton(column: ColumnDefinition): string {
    return `
      <button 
        class="filter-button" 
        part="filter-button"
        data-column-key="${column.key}"
        title="Filter ${column.label}"
        tabindex="-1"
      >
        🔽
      </button>
    `;
  }

  private getHeaderCellStyles(column: ColumnDefinition): string {
    let styles = [];
    
    if (column.width) {
      styles.push(`width: ${column.width}`);
      styles.push(`min-width: ${column.width}`);
      styles.push(`max-width: ${column.width}`);
    }
    
    if (column.align) {
      styles.push(`text-align: ${column.align}`);
    }

    return styles.join('; ');
  }

  private getAriaSortValue(direction: SortDirection): string {
    switch (direction) {
      case 'asc':
        return 'ascending';
      case 'desc':
        return 'descending';
      default:
        return 'none';
    }
  }

  @dispatch('@snice/header-sort', { bubbles: true, composed: true })
  private dispatchSort(columnKey: string) {
    return { column: columnKey };
  }

  @dispatch('@snice/header-select-all', { bubbles: true, composed: true })
  private dispatchSelectAll(checked: boolean) {
    return { checked };
  }

  @dispatch('@snice/header-filter', { bubbles: true, composed: true })
  private dispatchFilter(columnKey: string) {
    return { column: columnKey };
  }

  // Public API methods
  setSortState(column: string, direction: SortDirection) {
    this.currentSort = { column, direction };
  }

  setSelectionState(allSelected: boolean, someSelected: boolean = false) {
    this.allSelected = allSelected;
    this.someSelected = someSelected && !allSelected;
  }

  getColumnElement(columnKey: string): HTMLElement | null {
    return this.shadowRoot?.querySelector(`[data-column-key="${columnKey}"]`) || null;
  }

  // Method to update column definitions
  updateColumns(columns: ColumnDefinition[]) {
    this.columns = columns;
  }

  // Method to highlight a column temporarily
  highlightColumn(columnKey: string, duration: number = 2000) {
    const columnElement = this.getColumnElement(columnKey);
    if (columnElement) {
      columnElement.classList.add('header-cell--highlighted');
      setTimeout(() => {
        columnElement.classList.remove('header-cell--highlighted');
      }, duration);
    }
  }
}