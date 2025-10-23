import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-currency')
export class SniceCellCurrency extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'right';

  @property({ type: String })
  type: string = 'currency';

  @property({  })
  value: any = '';

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'currency',
    align: 'right'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  @property({ type: Number })
  decimals: number = 2;

  @property({ type: Boolean, attribute: 'thousands-separator' })
  thousandsSeparator: boolean = true;

  @property({ type: String })
  currency: string = 'USD';

  @property({ type: String })
  currencyDisplay: 'symbol' | 'code' | 'name' = 'symbol';

  @property({ type: String })
  locale: string = 'en-US';

  @property({ type: String, attribute: 'negative-style' })
  negativeStyle: 'parentheses' | 'red' | 'minus' = 'red';

  @property({ type: Boolean })
  highlight: boolean = false;

  @render()
  renderContent() {
    const formattedValue = this.formatCurrencyValue();
    const styles = this.getCurrencyStyles();

    return html/*html*/`
      <div class="cell-content cell-content--number" part="content" style="${styles}">
        ${formattedValue}
      </div>
    `;
  }

  @styles()
  componentStyles() {
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
      const formattedValue = this.formatCurrencyValue();
      const styles = this.getCurrencyStyles();
      this.contentElement.innerHTML = formattedValue;
      this.contentElement.setAttribute('style', styles);
    }
  }

  private formatCurrencyValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    // Use column currency format or component properties
    const format = this.column.currencyFormat || {
      decimals: this.decimals,
      currency: this.currency,
      currencyDisplay: this.currencyDisplay,
      locale: this.locale,
      negativeStyle: this.negativeStyle
    };

    const num = Number(this.value);

    if (isNaN(num)) {
      return String(this.value);
    }

    try {
      const formatter = new Intl.NumberFormat(format.locale || this.locale, {
        style: 'currency',
        currency: format.currency || this.currency,
        currencyDisplay: format.currencyDisplay || this.currencyDisplay,
        minimumFractionDigits: format.decimals ?? this.decimals,
        maximumFractionDigits: format.decimals ?? this.decimals
      });

      let formatted = formatter.format(Math.abs(num));

      // Handle negative numbers
      if (num < 0) {
        const negStyle = format.negativeStyle ?? this.negativeStyle;
        if (negStyle === 'parentheses') {
          formatted = `(${formatted})`;
        } else if (negStyle === 'red') {
          formatted = `-${formatted}`;
        } else {
          formatted = `-${formatted}`;
        }
      }

      return formatted;
    } catch (error) {
      // Fallback to basic formatting if Intl.NumberFormat fails
      let formatted = num.toFixed(format.decimals ?? this.decimals);

      if (this.thousandsSeparator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formatted = parts.join('.');
      }

      return `$${formatted}`;
    }
  }

  private getCurrencyStyles(): string {
    const num = Number(this.value);

    // Remove existing number classes
    this.classList.remove('number--negative', 'number--positive', 'number--zero', 'number--highlighted');

    // Apply CSS classes instead of direct styles
    if (num < 0) {
      this.classList.add('number--negative');
      const negStyle = this.column.currencyFormat?.negativeStyle ?? this.negativeStyle;
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

    return 'text-align: right';
  }
}
