import { element, property, on, watch, ready, dispatch } from 'snice';
import css from './snice-row.css?inline';
import type { 
  SniceRowElement, 
  ColumnDefinition,
  SniceCellElement
} from './snice-table.types';
import './snice-cell';
import './snice-cell-text';
import './snice-cell-number';
import './snice-cell-date';
import './snice-cell-sparkline';

@element('snice-row')
export class SniceRow extends HTMLElement implements SniceRowElement {
  @property({ type: Boolean, reflect: true })
  selected: boolean = false;

  @property({ type: Boolean, reflect: true })
  hoverable: boolean = true;

  @property({ type: Boolean, reflect: true })
  clickable: boolean = false;

  @property({ type: Boolean, reflect: true })
  selectable: boolean = false;

  @property({ type: Object })
  data: any = {};

  // Extract data from data-* attributes - pass raw values, let cells handle conversion
  private extractDataFromAttributes() {
    const data: any = {};
    
    // Get all attribute names that start with data-
    const attrNames = this.getAttributeNames().filter(name => 
      name.startsWith('data-') && name !== 'data-column-index'
    );
    
    attrNames.forEach(attrName => {
      const key = attrName.slice(5); // Remove 'data-' prefix
      const value = this.getAttribute(attrName);
      if (value !== null) {
        data[key] = value; // Keep as raw string, let cells convert
      }
    });
    return data;
  }

  @property({ type: Number, reflect: true })
  index: number = 0;

  @property({ type: Array })
  columns: ColumnDefinition[] = [];

  html() {
    return `
      <div class="row-container" part="container">
        ${this.selectable ? this.renderCheckbox() : ''}
        <div class="cells-container">
          ${this.columns && this.columns.length ? this.columns.map((column, columnIndex) => this.renderCell(column, columnIndex)).join('') : '<!-- No columns set yet -->'}
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    // Extract data from data-* attributes if data object is empty
    if (!this.data || Object.keys(this.data).length === 0) {
      this.data = this.extractDataFromAttributes();
    }
    this.updateRowAttributes();
    this.configureCells();
  }

  private configureCells() {
    if (!this.columns) {
      return;
    }
    
    this.columns.forEach((column, index) => {
      const cellElement = this.shadowRoot?.querySelector(`[data-column-index="${index}"]`) as any;
      if (cellElement) {
        const value = this.data[column.key];
        cellElement.value = value;
        cellElement.column = column;
        cellElement.rowData = this.data;
        
        // For sparkline cells, also set the data property if value is an array
        if (column.type === 'sparkline' && Array.isArray(value)) {
          cellElement.data = value;
        }
      }
    });
  }

  @watch('selected')
  updateSelection() {
    this.updateRowAttributes();
    const checkbox = this.shadowRoot?.querySelector('.row-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = this.selected;
    }
  }

  @watch('hoverable', 'clickable', 'selectable')
  updateRowAttributes() {
    this.classList.toggle('row--hoverable', this.hoverable);
    this.classList.toggle('row--clickable', this.clickable);
    this.classList.toggle('row--selectable', this.selectable);
    this.classList.toggle('row--selected', this.selected);
  }

  @watch('data', 'columns')
  updateCells() {
    const cellsContainer = this.shadowRoot?.querySelector('.cells-container');
    if (cellsContainer && this.columns && this.columns.length) {
      cellsContainer.innerHTML = this.renderCells();
      this.configureCells();
    }
  }

  @on('click')
  handleRowClick(e: MouseEvent) {
    // Don't trigger row click if clicking on checkbox or cell interactive elements
    const target = e.target as HTMLElement;
    if (target.matches('input[type="checkbox"], button, a, .interactive')) {
      return;
    }

    if (this.clickable) {
      this.dispatchRowClick();
    }

    if (this.selectable) {
      this.toggleSelection();
    }
  }

  @on('change', '.row-checkbox')
  handleCheckboxChange(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    this.selected = checkbox.checked;
    this.dispatchRowSelect();
  }

  @on('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
      if (this.selectable) {
        this.toggleSelection();
      } else if (this.clickable) {
        this.dispatchRowClick();
      }
    }
  }

  private renderCheckbox(): string {
    return `
      <div class="cell cell--checkbox" part="checkbox-cell">
        <input 
          type="checkbox" 
          class="row-checkbox" 
          ${this.selected ? 'checked' : ''}
          tabindex="-1"
        />
      </div>
    `;
  }

  private renderCells(): string {
    if (!this.columns || !this.columns.length) {
      return '<!-- No columns available -->';
    }
    return this.columns.map((column, columnIndex) => this.renderCell(column, columnIndex)).join('');
  }

  private renderCell(column: ColumnDefinition, columnIndex: number): string {
    const value = this.data[column.key];
    const cellComponent = this.getCellComponent(column.type);
    
    return `
      <div class="cell cell--${column.type}" part="cell" style="${this.getCellStyles(column)}">
        <${cellComponent} 
          type="${column.type}"
          align="${column.align || 'left'}"
          data-column-index="${columnIndex}"
        ></${cellComponent}>
      </div>
    `;
  }

  private getCellComponent(type: string | undefined): string {
    switch (type) {
      case 'text':
        return 'snice-cell-text';
      case 'number':
      case 'currency':
      case 'percent':
      case 'accounting':
      case 'scientific':
      case 'fraction':
        return 'snice-cell-number';
      case 'date':
        return 'snice-cell-date';
      case 'boolean':
        return 'snice-cell-boolean';
      case 'sparkline':
        return 'snice-cell-sparkline';
      case 'rating':
        return 'snice-cell-rating';
      case 'progress':
        return 'snice-cell-progress';
      case 'duration':
        return 'snice-cell-duration';
      case 'filesize':
        return 'snice-cell-filesize';
      case 'custom':
      default:
        return 'snice-cell';
    }
  }

  private getCellStyles(column: ColumnDefinition): string {
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

  private escapeHtml(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private toggleSelection() {
    this.selected = !this.selected;
    this.dispatchRowSelect();
  }

  @dispatch('@snice/row-click', { bubbles: true, composed: true })
  private dispatchRowClick() {
    return {
      data: this.data,
      index: this.index,
      element: this
    };
  }

  @dispatch('@snice/row-select', { bubbles: true, composed: true })
  private dispatchRowSelect() {
    return {
      selected: this.selected,
      data: this.data,
      index: this.index,
      element: this
    };
  }

  @dispatch('@snice/row-hover', { bubbles: true, composed: true })
  private dispatchRowHover() {
    return {
      data: this.data,
      index: this.index,
      element: this
    };
  }

  // Public API methods
  select() {
    this.selected = true;
    this.dispatchRowSelect();
  }

  deselect() {
    this.selected = false;
    this.dispatchRowSelect();
  }

  focusRow() {
    super.focus();
    this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  getCellValue(columnKey: string): any {
    return this.data[columnKey];
  }

  setCellValue(columnKey: string, value: any) {
    this.data = { ...this.data, [columnKey]: value };
    this.updateCells();
  }

  getCellElement(columnKey: string): SniceCellElement | null {
    const column = this.columns.find(col => col.key === columnKey);
    if (!column) return null;
    
    const columnIndex = this.columns.indexOf(column);
    return this.shadowRoot?.querySelector(`[data-column-index="${columnIndex}"]`) as SniceCellElement || null;
  }

  // Highlight row temporarily (useful for showing updates)
  highlight(duration: number = 2000) {
    this.classList.add('row--highlighted');
    setTimeout(() => {
      this.classList.remove('row--highlighted');
    }, duration);
  }
}