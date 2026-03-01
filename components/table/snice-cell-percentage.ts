import { element, property, watch, ready, query, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-percentage.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-percentage')
export class SniceCellPercentage extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'right';

  @property({ type: String })
  type: string = 'percentage';

  @property({  })
  value: any = '';

  @property({ type: Object, attribute: false })
  column: ColumnDefinition | null = null;

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  @property({ type: Number })
  decimals: number = 2;

  @property({ type: Boolean })
  showTrend: boolean = false;

  @property({ type: Number })
  trendValue: number | null = null;

  @property({ type: Boolean })
  colorize: boolean = true;

  @render()
  render() {
    const formattedValue = this.formatPercentageValue();
    const trendArrow = this.getTrendArrow();
    const styles = this.getPercentageStyles();

    return html/*html*/`
      <div class="cell-content cell-content--percentage" part="content" style="${styles}">
        ${formattedValue}
        ${this.showTrend && trendArrow ? unsafeHTML(`<span class="percentage-trend">${trendArrow}</span>`) : ''}
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
      const formattedValue = this.formatPercentageValue();
      const trendArrow = this.getTrendArrow();
      const styles = this.getPercentageStyles();

      const trendHTML = this.showTrend && trendArrow
        ? `<span class="percentage-trend">${trendArrow}</span>`
        : '';

      this.contentElement.innerHTML = formattedValue + trendHTML;
      this.contentElement.setAttribute('style', styles);
    }
  }

  private formatPercentageValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return '';
    }

    // Use custom formatter if provided
    if (this.column?.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    // Use column percentage format or component properties
    const format = this.column?.percentageFormat || {
      decimals: this.decimals,
      showTrend: this.showTrend,
      trendValue: this.trendValue,
      colorize: this.colorize
    };

    const num = Number(this.value);

    if (isNaN(num)) {
      return String(this.value);
    }

    const formatted = num.toFixed(format.decimals ?? this.decimals);
    return `${formatted}%`;
  }

  private getTrendArrow(): string {
    const trend = this.column?.percentageFormat?.trendValue ?? this.trendValue;

    if (trend === null || trend === undefined) {
      return '';
    }

    if (trend > 0) {
      return '↑';
    } else if (trend < 0) {
      return '↓';
    }
    return '→';
  }

  private getPercentageStyles(): string {
    const num = Number(this.value);
    const shouldColorize = this.column?.percentageFormat?.colorize ?? this.colorize;

    // Remove existing classes
    this.classList.remove('percentage--positive', 'percentage--negative', 'percentage--zero');

    if (shouldColorize) {
      if (num > 0) {
        this.classList.add('percentage--positive');
      } else if (num < 0) {
        this.classList.add('percentage--negative');
      } else if (num === 0) {
        this.classList.add('percentage--zero');
      }
    }

    // Apply trend arrow color
    const trend = this.column?.percentageFormat?.trendValue ?? this.trendValue;
    this.classList.remove('percentage--trend-up', 'percentage--trend-down', 'percentage--trend-neutral');

    if (trend !== null && trend !== undefined) {
      if (trend > 0) {
        this.classList.add('percentage--trend-up');
      } else if (trend < 0) {
        this.classList.add('percentage--trend-down');
      } else {
        this.classList.add('percentage--trend-neutral');
      }
    }

    return 'text-align: right';
  }
}
