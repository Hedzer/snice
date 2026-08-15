import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { DateFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';
import { installCellPresentation } from './table-cell-presentation';
import { parseCellDate, startOfLocalDay } from './table-date';

@element('snice-cell-date')
export class SniceCellDate extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'date';

  @property({  })
  value: any = '';

  @property({ type: Object, attribute: false })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'date',
    align: 'left'
  };

  @property({ type: Object, attribute: false })
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
    installCellPresentation(this);
    this.applyAlignment();
  }

  private applyAlignment() {
    this.style.textAlign = this.align;
  }

  @watch('align')
  updateAlignment() {
    this.applyAlignment();
  }

  // Every input the formatter reads, not just the value: a late
  // `custom-format` / `locale` / `show-time` change must repaint the day it
  // describes, or the cell keeps showing the format it happened to be born with.
  @watch('value', 'column', 'dateFormat', 'customFormat', 'locale', 'relativeTime', 'showTime')
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

    // A date-only value names a calendar day, so it is read at LOCAL midnight
    // (see table-date.ts). Parsing it with `new Date` would place it at UTC
    // midnight and render the previous day for every negative UTC offset.
    const date = parseCellDate(this.value);

    if (!date) {
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
    const date = parseCellDate(this.value);

    // Apply CSS classes instead of direct styles
    this.classList.remove('date--today', 'date--past', 'date--future');

    if (!date) return '';

    // Day granularity: a calendar day is today, past, or future as a whole —
    // the wall-clock time of day never decides which.
    const day = startOfLocalDay(date).getTime();
    const today = startOfLocalDay(new Date()).getTime();
    const isToday = day === today;
    const isPast = day < today;
    const isFuture = day > today;

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
