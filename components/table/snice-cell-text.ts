import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-text')
export class SniceCellText extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'text';

  @property({  })
  value: any = '';

  @property({ type: Object, attribute: false })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'text',
    align: 'left'
  };

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;
  
  @property({ type: Boolean,  })
  multiline: boolean = false;

  @property({ type: Number, attribute: 'max-lines' })
  maxLines?: number;

  @render()
  render() {
    const content = this.formatTextContent();
    const textStyles = this.getTextStyles();

    return html/*html*/`
      <div class="cell-content cell-content--text" part="content" style="${textStyles}">
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
      const content = this.formatTextContent();
      const styles = this.getTextStyles();
      this.contentElement.innerHTML = content;
      this.contentElement.setAttribute('style', styles);
    }
  }

  private formatTextContent(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }

    let text = String(this.value);

    // Apply custom formatter if provided
    if (this.column.formatter) {
      text = this.column.formatter(this.value, this.rowData);
    }

    // Handle multiline text
    if (this.multiline) {
      text = text.replace(/\n/g, '<br>');
    }

    // Handle ellipsis for single line
    if (!this.multiline && this.column.ellipsis) {
      // CSS will handle the ellipsis
    }

    return text;
  }

  private getTextStyles(): string {
    let styles = [];

    if (!this.multiline) {
      styles.push('white-space: nowrap');
      if (this.column.ellipsis) {
        styles.push('overflow: hidden');
        styles.push('text-overflow: ellipsis');
      }
    } else {
      if (this.column.wrap) {
        styles.push('white-space: pre-wrap');
        styles.push('word-wrap: break-word');
      }
      
      if (this.maxLines) {
        styles.push('display: -webkit-box');
        styles.push('-webkit-box-orient: vertical');
        styles.push(`-webkit-line-clamp: ${this.maxLines}`);
        styles.push('overflow: hidden');
      }
    }

    return styles.join('; ');
  }
}