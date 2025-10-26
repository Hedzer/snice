import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-duration')
export class SniceCellDuration extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'right';

  @property({  })
  type: ColumnType = 'duration';

  @property({  })
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

  @render()
  render() {
    const content = this.formatDuration();

    return html/*html*/`
      <div class="cell-content cell-content--duration" part="content">
        ${content}
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
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