import { element, property, watch, ready, query, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { BooleanFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-boolean')
export class SniceCellBoolean extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'center';

  @property({  })
  type: ColumnType = 'boolean';

  @property({  })
  value: any = false;

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'boolean',
    align: 'center'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;
  
  @property({  attribute: 'true-value' })
  trueValue: string = 'true';

  @property({  attribute: 'false-value' })
  falseValue: string = 'false';

  @property({ type: Boolean,  attribute: 'use-symbols' })
  useSymbols: boolean = true;

  @property({  attribute: 'true-symbol' })
  trueSymbol: string = '✓';

  @property({  attribute: 'false-symbol' })
  falseSymbol: string = '✗';

  @render()
  render() {
    const content = this.formatBooleanContent();

    return html/*html*/`
      <div class="cell-content cell-content--boolean" part="content">
        ${unsafeHTML(content)}
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
      const content = this.formatBooleanContent();
      this.contentElement.innerHTML = content;
    }
  }

  private formatBooleanContent(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    // Use column boolean format or component properties
    const format: BooleanFormat = this.column.booleanFormat || {
      trueValue: this.trueValue,
      falseValue: this.falseValue,
      useSymbols: this.useSymbols,
      trueSymbol: this.trueSymbol,
      falseSymbol: this.falseSymbol
    };

    const isTrue = Boolean(this.value);

    if (format.useSymbols ?? this.useSymbols) {
      const symbol = isTrue ? (format.trueSymbol ?? this.trueSymbol) : (format.falseSymbol ?? this.falseSymbol);
      const colorClass = isTrue ? 'boolean--true' : 'boolean--false';
      return `<span class="${colorClass}">${symbol}</span>`;
    } else {
      const text = isTrue ? (format.trueValue ?? this.trueValue) : (format.falseValue ?? this.falseValue);
      const colorClass = isTrue ? 'boolean--true' : 'boolean--false';
      return `<span class="${colorClass}">${text}</span>`;
    }
  }
}