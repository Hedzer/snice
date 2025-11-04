import { element, property, watch, ready, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-header.css?inline';
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

  @render()
  render() {
    return html/*html*/`
      <div class="header-container" part="container">
        <if ${this.selectable}>
          ${this.renderSelectAllCheckbox()}
        </if>
        ${this.renderHeaderCells()}
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
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

  @watch('allSelected', 'someSelected')
  updateSelectAllCheckbox() {
    const checkbox = this.shadowRoot?.querySelector('.select-all-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = this.allSelected;
      checkbox.indeterminate = this.someSelected && !this.allSelected;
    }
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const cell = target.closest('.header-cell[data-sortable="true"]') as HTMLElement;
    if (!cell) return;

    const columnKey = cell.dataset.columnKey;

    if (columnKey && this.sortable) {
      this.dispatchSort(columnKey);
    }
  }

  private handleChange(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.select-all-checkbox')) return;

    const checkbox = target as HTMLInputElement;
    this.dispatchSelectAll(checkbox.checked);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const cell = target.closest('.header-cell[data-sortable="true"]') as HTMLElement;
    if (!cell) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const columnKey = cell.dataset.columnKey;

      if (columnKey && this.sortable) {
        this.dispatchSort(columnKey);
      }
    }
  }

  private renderSelectAllCheckbox() {
    return html/*html*/`
      <div class="header-cell header-cell--checkbox" part="checkbox-cell">
        <input
          type="checkbox"
          class="select-all-checkbox"
          ?checked=${this.allSelected}
          title="Select all rows"
          tabindex="0"
          @change=${(e: Event) => this.handleChange(e)}
        />
      </div>
    `;
  }

  private renderHeaderCells() {
    if (!this.columns.length) {
      return html/*html*/``;
    }

    return html/*html*/`
      <div class="cells-container" @click=${(e: MouseEvent) => this.handleClick(e)} @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e)}>
        ${this.columns.map((column, index) => this.renderHeaderCell(column, index))}
      </div>
    `;
  }

  private renderHeaderCell(column: ColumnDefinition, index: number) {
    const isSortable = this.sortable && column.sortable !== false;
    const isCurrentSort = this.currentSort.column === column.key;
    const sortDirection = isCurrentSort ? this.currentSort.direction : null;

    return html/*html*/`
      <div
        class="header-cell header-cell--${column.type || 'text'}"
        part="cell"
        data-column-key="${column.key}"
        data-column-index="${index}"
        data-sortable="${isSortable}"
        style="${this.getHeaderCellStyles(column)}"
        role="${isSortable ? 'button' : ''}"
        tabindex="${isSortable ? '0' : ''}"
        aria-label="${isSortable ? `Sort by ${column.label}` : ''}"
        aria-sort="${isCurrentSort ? this.getAriaSortValue(sortDirection) : ''}"
      >
        <div class="header-cell-content">
          <span class="header-cell-label">${column.label}</span>
          <if ${isSortable}>
            ${this.renderSortIndicator(sortDirection)}
          </if>
        </div>
        <if ${column.filterable}>
          ${this.renderFilterButton(column)}
        </if>
      </div>
    `;
  }

  private renderSortIndicator(direction: SortDirection) {
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

    return html/*html*/`
      <span
        class="sort-indicator sort-indicator--${state}"
        part="sort-indicator"
        aria-hidden="true"
      >${icon}</span>
    `;
  }

  private renderFilterButton(column: ColumnDefinition) {
    return html/*html*/`
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

  @dispatch('header-sort', { bubbles: true, composed: true })
  private dispatchSort(columnKey: string) {
    return { column: columnKey };
  }

  @dispatch('header-select-all', { bubbles: true, composed: true })
  private dispatchSelectAll(checked: boolean) {
    return { checked };
  }

  @dispatch('header-filter', { bubbles: true, composed: true })
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
