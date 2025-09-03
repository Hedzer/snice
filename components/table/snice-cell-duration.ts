import { element, property, watch, ready, query } from '../../src/index';
import css from './snice-cell.css?inline';
import type { SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-duration')
export class SniceCellDuration extends HTMLElement implements SniceCellElement {
  @property({ reflect: true })
  align: ColumnAlign = 'right';

  @property({ reflect: true })
  type: ColumnType = 'duration';

  @property({ reflect: true })
  value: any = 0;

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'duration',
    align: 'right'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  html() {
    const content = this.formatDuration();
    
    return `
      <div class="cell-content cell-content--duration" part="content">
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
      const content = this.formatDuration();
      this.contentElement.innerHTML = content;
    }
  }

  private formatDuration(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    const seconds = Number(this.value);
    if (isNaN(seconds)) return String(this.value);
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}