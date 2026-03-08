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

  @property({ type: Object, attribute: false })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'boolean',
    align: 'center'
  };

  @property({ type: Object, attribute: false })
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
  trueSymbol: string = 'svg';

  @property({  attribute: 'false-symbol' })
  falseSymbol: string = 'svg';

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
      const trueSymbolVal = format.trueSymbol ?? this.trueSymbol;
      const falseSymbolVal = format.falseSymbol ?? this.falseSymbol;
      const colorClass = isTrue ? 'boolean--true' : 'boolean--false';
      if (isTrue && trueSymbolVal === 'svg') {
        return `<span class="${colorClass}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/></svg></span>`;
      } else if (!isTrue && falseSymbolVal === 'svg') {
        return `<span class="${colorClass}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></span>`;
      }
      const symbol = isTrue ? trueSymbolVal : falseSymbolVal;
      return `<span class="${colorClass}">${symbol}</span>`;
    } else {
      const text = isTrue ? (format.trueValue ?? this.trueValue) : (format.falseValue ?? this.falseValue);
      const colorClass = isTrue ? 'boolean--true' : 'boolean--false';
      return `<span class="${colorClass}">${text}</span>`;
    }
  }
}