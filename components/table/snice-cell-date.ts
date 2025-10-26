import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { DateFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-date')
export class SniceCellDate extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'date';

  @property({  })
  value: any = '';

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'date',
    align: 'left'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;
  @property({  attribute: 'date-format' })
  dateFormat: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'short';

  @property({  attribute: 'custom-format' })
  customFormat?: string;

  @property({  })
  locale: string = 'en-US';

  @property({ type: Boolean,  attribute: 'relative-time' })
  relativeTime: boolean = false;

  @property({ type: Boolean,  attribute: 'show-time' })
  showTime: boolean = false;

  @render()
  render() {
    const formattedValue = this.formatDateValue();
    const dateStyles = this.getDateStyles();

    return html/*html*/`
      <div class="cell-content cell-content--date" part="content" style="${dateStyles}">
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
      const formattedValue = this.formatDateValue();
      const styles = this.getDateStyles();
      this.contentElement.innerHTML = formattedValue;
      this.contentElement.setAttribute('style', styles);
    }
  }

  private formatDateValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    const date = new Date(this.value);
    
    if (isNaN(date.getTime())) {
      return String(this.value);
    }

    // Show relative time if enabled
    if (this.relativeTime) {
      return this.formatRelativeTime(date);
    }

    // Use column date format or component properties
    const format: DateFormat = this.column.dateFormat || {
      format: this.dateFormat,
      customFormat: this.customFormat,
      locale: this.locale
    };

    // Handle custom format
    if (format.customFormat || this.customFormat) {
      return this.formatCustomDate(date, format.customFormat || this.customFormat!);
    }

    // Use Intl.DateTimeFormat
    const options: Intl.DateTimeFormatOptions = {};
    const formatType = format.format ?? this.dateFormat;
    
    switch (formatType) {
      case 'short':
        options.dateStyle = 'short';
        break;
      case 'medium':
        options.dateStyle = 'medium';
        break;
      case 'long':
        options.dateStyle = 'long';
        break;
      case 'full':
        options.dateStyle = 'full';
        break;
    }

    // Add time if requested
    if (this.showTime) {
      options.timeStyle = 'short';
    }

    const locale = format.locale ?? this.locale;
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  private formatCustomDate(date: Date, format: string): string {
    const tokens: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'YY': date.getFullYear().toString().slice(-2),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'M': (date.getMonth() + 1).toString(),
      'DD': date.getDate().toString().padStart(2, '0'),
      'D': date.getDate().toString(),
      'HH': date.getHours().toString().padStart(2, '0'),
      'H': date.getHours().toString(),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'm': date.getMinutes().toString(),
      'ss': date.getSeconds().toString().padStart(2, '0'),
      's': date.getSeconds().toString()
    };

    let formatted = format;
    for (const [token, value] of Object.entries(tokens)) {
      formatted = formatted.replace(new RegExp(token, 'g'), value);
    }

    return formatted;
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      // Fall back to formatted date for older dates
      return new Intl.DateTimeFormat(this.locale, { dateStyle: 'short' }).format(date);
    }
  }

  private getDateStyles(): string {
    const date = new Date(this.value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isPast = date < now;
    const isFuture = date > now;

    // Apply CSS classes instead of direct styles
    this.classList.remove('date--today', 'date--past', 'date--future');
    
    if (isToday) {
      this.classList.add('date--today');
    } else if (isPast) {
      this.classList.add('date--past');
    } else if (isFuture) {
      this.classList.add('date--future');
    }

    return '';
  }
}