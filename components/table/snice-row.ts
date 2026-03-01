import { element, property, watch, ready, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-row.css?inline';
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
import './snice-cell-link';
import './snice-cell-actions';
import './snice-cell-tag';
import './snice-cell-image';
import './snice-cell-email';
import './snice-cell-phone';
import './snice-cell-status';
import './snice-cell-color';
import './snice-cell-json';
import './snice-cell-currency';
import './snice-cell-percentage';
import './snice-cell-location';

@element('snice-row')
export class SniceRow extends HTMLElement implements SniceRowElement {
  @property({ type: Boolean,  })
  selected: boolean = false;

  @property({ type: Boolean,  })
  hoverable: boolean = true;

  @property({ type: Boolean,  })
  clickable: boolean = false;

  @property({ type: Boolean,  })
  selectable: boolean = false;

  @property({ type: Object, attribute: false })
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

  @property({ type: Number,  })
  index: number = 0;

  @property({ type: Array, attribute: false })
  columns: ColumnDefinition[] = [];

  @render()
  render() {
    return html/*html*/`
      <div class="row-container" part="container" @click=${(e: MouseEvent) => this.handleRowClick(e)} @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e)}>
        <if ${this.selectable}>
          ${this.renderCheckbox()}
        </if>
        <div class="cells-container">
          <if ${this.columns && this.columns.length}>
            ${this.columns.map((column, columnIndex) => this.renderCell(column, columnIndex))}
          </if>
          <if ${!this.columns || !this.columns.length}>
            <!-- No columns set yet -->
          </if>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
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
    // Re-render is handled automatically by @render decorator
    // Just need to reconfigure cells after the template updates
    setTimeout(() => this.configureCells(), 0);
  }

  private handleRowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Handle checkbox change separately
    if (target.matches('.row-checkbox')) {
      return; // Let the change event handle this
    }

    // Don't trigger row click if clicking on other interactive elements
    if (target.matches('button, a, .interactive')) {
      return;
    }

    if (this.clickable) {
      this.dispatchRowClick();
    }

    if (this.selectable) {
      this.toggleSelection();
    }
  }

  private handleChange(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.row-checkbox')) return;

    const checkbox = target as HTMLInputElement;
    this.selected = checkbox.checked;
    this.dispatchRowSelect();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();

      if (this.selectable) {
        this.toggleSelection();
      } else if (this.clickable) {
        this.dispatchRowClick();
      }
    }
  }

  private renderCheckbox() {
    return html/*html*/`
      <div class="cell cell--checkbox" part="checkbox-cell">
        <input
          type="checkbox"
          class="row-checkbox"
          ?checked=${this.selected}
          tabindex="-1"
          @change=${(e: Event) => this.handleChange(e)}
        />
      </div>
    `;
  }

  private renderCell(column: ColumnDefinition, columnIndex: number) {
    const value = this.data[column.key];
    const cellComponent = this.getCellComponent(column.type);

    return html/*html*/`
      <div class="cell cell--${column.type}" part="cell" style="${this.getCellStyles(column)}">
        ${unsafeHTML(`<${cellComponent}
          type="${column.type}"
          align="${column.align || 'left'}"
          data-column-index="${columnIndex}"
        ></${cellComponent}>`)}
      </div>
    `;
  }

  private getCellComponent(type: string | undefined): string {
    switch (type) {
      case 'text':
        return 'snice-cell-text';
      case 'number':
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
      case 'link':
      case 'url':
        return 'snice-cell-link';
      case 'actions':
        return 'snice-cell-actions';
      case 'tag':
      case 'tags':
      case 'badge':
      case 'badges':
        return 'snice-cell-tag';
      case 'image':
      case 'avatar':
      case 'thumbnail':
        return 'snice-cell-image';
      case 'email':
        return 'snice-cell-email';
      case 'phone':
      case 'tel':
      case 'telephone':
        return 'snice-cell-phone';
      case 'status':
        return 'snice-cell-status';
      case 'color':
        return 'snice-cell-color';
      case 'json':
      case 'object':
        return 'snice-cell-json';
      case 'currency':
      case 'money':
        return 'snice-cell-currency';
      case 'percent':
      case 'percentage':
        return 'snice-cell-percentage';
      case 'location':
      case 'address':
      case 'coordinates':
        return 'snice-cell-location';
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

  @dispatch('row-click', { bubbles: true, composed: true })
  private dispatchRowClick() {
    return {
      data: this.data,
      index: this.index,
      element: this
    };
  }

  @dispatch('row-select', { bubbles: true, composed: true })
  private dispatchRowSelect() {
    return {
      selected: this.selected,
      data: this.data,
      index: this.index,
      element: this
    };
  }

  @dispatch('row-hover', { bubbles: true, composed: true })
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
