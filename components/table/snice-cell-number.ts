import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { NumberFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-number')
export class SniceCellNumber extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'right';

  @property({  })
  type: ColumnType = 'number';

  @property({  })
  value: any = '';

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'number',
    align: 'right'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;
  @property({ type: Number,  })
  decimals: number = 0;

  @property({ type: Boolean,  attribute: 'thousands-separator' })
  thousandsSeparator: boolean = false;

  @property({  })
  prefix: string = '';

  @property({  })
  suffix: string = '';

  @property({  attribute: 'negative-style' })
  negativeStyle: 'parentheses' | 'red' | 'minus' = 'minus';

  @property({ type: Boolean,  })
  highlight: boolean = false;

  @render()
  render() {
    const formattedValue = this.formatNumberValue();
    const styles = this.getNumberStyles();

    return html/*html*/`
      <div class="cell-content cell-content--number" part="content" style="${styles}">
        ${formattedValue}
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
      const formattedValue = this.formatNumberValue();
      const styles = this.getNumberStyles();
      this.contentElement.innerHTML = formattedValue;
      this.contentElement.setAttribute('style', styles);
    }
  }

  private formatNumberValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    // Use column number format or component properties
    const format: NumberFormat = this.column.numberFormat || {
      decimals: this.decimals,
      thousandsSeparator: this.thousandsSeparator,
      prefix: this.prefix,
      suffix: this.suffix,
      negativeStyle: this.negativeStyle
    };

    const num = Number(this.value);
    
    if (isNaN(num)) {
      return String(this.value);
    }

    let formatted = num.toFixed(format.decimals ?? this.decimals);
    
    // Add thousands separator
    if (format.thousandsSeparator ?? this.thousandsSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    // Handle negative numbers
    if (num < 0) {
      const negStyle = format.negativeStyle ?? this.negativeStyle;
      if (negStyle === 'parentheses') {
        formatted = `(${formatted.replace('-', '')})`;
      } else if (negStyle === 'red') {
        // Color will be handled in styles
        formatted = formatted.replace('-', '');
      }
    }

    // Add prefix and suffix
    const prefix = format.prefix ?? this.prefix;
    const suffix = format.suffix ?? this.suffix;
    
    if (prefix) formatted = prefix + formatted;
    if (suffix) formatted = formatted + suffix;

    return formatted;
  }

  private getNumberStyles(): string {
    const num = Number(this.value);
    
    // Remove existing number classes
    this.classList.remove('number--negative', 'number--positive', 'number--zero', 'number--highlighted');
    
    // Apply CSS classes instead of direct styles
    if (num < 0) {
      this.classList.add('number--negative');
      const negStyle = this.column.numberFormat?.negativeStyle ?? this.negativeStyle;
      if (negStyle === 'red') {
        this.classList.add('number--negative-red');
      }
    } else if (num > 0) {
      this.classList.add('number--positive');
      if (this.highlight) {
        this.classList.add('number--highlighted');
      }
    } else if (num === 0) {
      this.classList.add('number--zero');
    }

    return 'text-align: right'; // Keep text alignment as style for now
  }
}