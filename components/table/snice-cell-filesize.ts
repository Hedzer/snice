import { element, property, watch, ready, query } from '../../src/index';
import css from './snice-cell.css?inline';
import type { SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-filesize')
export class SniceCellFilesize extends HTMLElement implements SniceCellElement {
  @property({ reflect: true })
  align: ColumnAlign = 'right';

  @property({ reflect: true })
  type: ColumnType = 'filesize';

  @property({ reflect: true })
  value: any = 0;

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'filesize',
    align: 'right'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  html() {
    const content = this.formatFileSize();
    
    return `
      <div class="cell-content cell-content--filesize" part="content">
        ${content}
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    this.applyAlignment();
  }

  private applyAlignment() {
    this.style.textAlign = this.align;
  }

  @watch('align')
  updateAlignment() {
    this.applyAlignment();
  }

  @watch('value', 'column')
  updateContent() {
    if (this.contentElement) {
      const content = this.formatFileSize();
      this.contentElement.innerHTML = content;
    }
  }

  private formatFileSize(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    const bytes = Number(this.value);
    if (isNaN(bytes)) return String(this.value);
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}