import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-date-range-picker.css?inline';
import type {
  DateRangePickerSize,
  DateRangePickerVariant,
  DateRangeFormat,
  DateRangePreset,
  SniceDateRangePickerElement,
} from './snice-date-range-picker.types';

@element('snice-date-range-picker', { formAssociated: true })
export class SniceDateRangePicker extends HTMLElement implements SniceDateRangePickerElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({})
  start = '';

  @property({})
  end = '';

  @property({})
  size: DateRangePickerSize = 'medium';

  @property({})
  variant: DateRangePickerVariant = 'outlined';

  @property({})
  format: DateRangeFormat = 'mm/dd/yyyy';

  @property({})
  placeholder = '';

  @property({})
  label = '';

  @property({ attribute: 'helper-text' })
  helperText = '';

  @property({ attribute: 'error-text' })
  errorText = '';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  required = false;

  @property({ type: Boolean })
  invalid = false;

  @property({ type: Boolean })
  clearable = false;

  @property({})
  min = '';

  @property({})
  max = '';

  @property({})
  name = '';

  @property({ type: Number })
  columns: number = 1;

  @property({ type: Number, attribute: 'first-day-of-week' })
  firstDayOfWeek = 0;

  @property({ type: Array, attribute: false })
  presets: DateRangePreset[] = [];

  @property({ type: Boolean, attribute: 'show-calendar' })
  showCalendar = false;

  @query('.input')
  input?: HTMLInputElement;

  @query('.calendar')
  calendarEl?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  @query('.calendar-toggle')
  calendarToggle?: HTMLButtonElement;

  private startDate: Date | null = null;
  private endDate: Date | null = null;
  private viewDate = new Date();
  private selectionPhase: 'idle' | 'selecting' = 'idle';
  private hoverDate: Date | null = null;
  private presetPreviewStart: Date | null = null;
  private presetPreviewEnd: Date | null = null;
  private calendarView: 'days' | 'years' = 'days';
  private yearRangeStart = 0;

  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  template() {
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      this.invalid ? 'input--invalid' : '',
      this.clearable ? 'input--clearable' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');

    const hasPresets = this.presets && this.presets.length > 0;
    const isDual = this.columns === 2;
    const nextMonthDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);

    return html/*html*/`
      <div class="date-picker-wrapper">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="input-container">
          <input
            class="${inputClasses}"
            type="text"
            value="${this.getDisplayValue()}"
            placeholder="${this.placeholder || this.getPlaceholder()}"
            ?disabled=${this.disabled || this.loading}
            ?readonly=${true}
            ?required=${this.required}
            name="${this.name || ''}"
            part="input"
            autocomplete="off"
            @click=${(e: Event) => this.handleInputClick(e)}
            @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}
            @focus=${() => this.dispatchFocusEvent()}
            @blur=${() => this.dispatchBlurEvent()}
          />

          <button
            class="calendar-toggle"
            type="button"
            aria-label="Open calendar"
            tabindex="-1"
            part="calendar-toggle"
            ?disabled=${this.disabled || this.loading || this.readonly}
            @click=${(e: Event) => this.handleCalendarToggle(e)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
          </button>

          <button
            class="clear-button"
            type="button"
            aria-label="Clear"
            tabindex="-1"
            part="clear"
            style="display: none;"
            @click=${() => this.clear()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>

          <div class="calendar" part="calendar" popover="manual" ?hidden=${!this.showCalendar}
            @click=${(e: Event) => this.handleCalendarClick(e)}
            @mouseover=${(e: Event) => this.handleDayHover(e)}
            @mouseout=${() => this.handleCalendarMouseOut()}
          >
            <div class="calendar-body">
              <if ${hasPresets}>
                <div class="presets"
                  @mouseover=${(e: Event) => this.handlePresetHover(e)}
                  @mouseout=${(e: Event) => this.handlePresetHoverOut(e)}
                >
                  ${this.presets.map((preset, i) => html`
                    <button class="preset-button" type="button" data-preset="${i}">
                      ${preset.label}
                    </button>
                  `)}
                </div>
              </if>

              <div class="months">
                <case ${this.calendarView}>
                  <when value="years">
                    <div class="month">
                      <div class="calendar-header">
                        <button class="nav-button" type="button" data-nav="prev-years" aria-label="Previous years">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                          </svg>
                        </button>
                        <div class="calendar-title">
                          <span class="month-label">${this.yearRangeStart} — ${this.yearRangeStart + 11}</span>
                        </div>
                        <button class="nav-button" type="button" data-nav="next-years" aria-label="Next years">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                      <div class="year-grid">
                        ${this.getYearsGrid()}
                      </div>
                    </div>
                  </when>
                  <default>
                    <div class="month">
                      <div class="calendar-header">
                        <button class="nav-button" type="button" data-nav="prev-month" aria-label="Previous month">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                          </svg>
                        </button>
                        <div class="calendar-title">
                          <span class="month-label">${this.monthNames[this.viewDate.getMonth()]} </span><button class="year-button" type="button" data-nav="show-years">${this.viewDate.getFullYear()}</button>
                        </div>
                        <button class="nav-button ${isDual ? 'nav-button--hidden' : ''}" type="button" data-nav="next-month" aria-label="Next month">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                      <div class="calendar-weekdays">${this.getDayHeaders()}</div>
                      <div class="calendar-days">${this.getDaysGrid(this.viewDate.getFullYear(), this.viewDate.getMonth())}</div>
                    </div>

                    <if ${isDual}>
                      <div class="month">
                        <div class="calendar-header">
                          <button class="nav-button nav-button--hidden" type="button" aria-label="Previous month">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                            </svg>
                          </button>
                          <div class="calendar-title">
                            <span class="month-label">${this.monthNames[nextMonthDate.getMonth()]} </span><button class="year-button" type="button" data-nav="show-years">${nextMonthDate.getFullYear()}</button>
                          </div>
                          <button class="nav-button" type="button" data-nav="next-month" aria-label="Next month">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                        <div class="calendar-weekdays">${this.getDayHeaders()}</div>
                        <div class="calendar-days">${this.getDaysGrid(nextMonthDate.getFullYear(), nextMonthDate.getMonth())}</div>
                      </div>
                    </if>
                  </default>
                </case>
              </div>
            </div>

            <div class="calendar-footer">
              <snice-button class="today-button" variant="default" size="small" data-nav="today">
                Today
              </snice-button>
            </div>
          </div>
        </div>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default></default>
        </case>
      </div>
    `;
  }

  @ready()
  init() {
    this.parseInitialValues();
    this.updateFormValue();
    queueMicrotask(() => this.updateClearButton());
    this.setupClickOutside();
  }

  // --- Display ---

  private getDisplayValue(): string {
    const s = this.startDate ? this.formatDate(this.startDate) : '';
    const e = this.endDate ? this.formatDate(this.endDate) : '';
    if (s && e) return `${s}  —  ${e}`;
    if (s) return s;
    return '';
  }

  private getPlaceholder(): string {
    const fmt = this.getPlaceholderForFormat();
    return `${fmt}  —  ${fmt}`;
  }

  // --- Date parsing/formatting (copied from date-picker) ---

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Always try ISO format first
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch.map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }

    if (this.format === 'mmmm dd, yyyy') {
      const match = dateString.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
      if (match) {
        const [, monthName, day, year] = match;
        const monthIndex = this.monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex >= 0) {
          const date = new Date(parseInt(year), monthIndex, parseInt(day));
          if (!isNaN(date.getTime())) return date;
        }
      }
      return null;
    }

    const parts = dateString.split(/[-\/]/);
    if (parts.length === 3) {
      let year: number, month: number, day: number;
      switch (this.format) {
        case 'mm/dd/yyyy':
        case 'mm-dd-yyyy':
          [month, day, year] = parts.map(Number);
          break;
        case 'dd/mm/yyyy':
        case 'dd-mm-yyyy':
          [day, month, year] = parts.map(Number);
          break;
        case 'yyyy-mm-dd':
        case 'yyyy/mm/dd':
          [year, month, day] = parts.map(Number);
          break;
        default:
          return null;
      }
      if (year && month && day) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return null;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    const yyyy = year.toString();

    switch (this.format) {
      case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
      case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
      case 'yyyy-mm-dd': return `${yyyy}-${mm}-${dd}`;
      case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
      case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
      case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
      case 'mmmm dd, yyyy': return `${this.monthNames[date.getMonth()]} ${dd}, ${yyyy}`;
      default: return `${mm}/${dd}/${yyyy}`;
    }
  }

  private getPlaceholderForFormat(): string {
    switch (this.format) {
      case 'mm/dd/yyyy': return 'MM/DD/YYYY';
      case 'dd/mm/yyyy': return 'DD/MM/YYYY';
      case 'yyyy-mm-dd': return 'YYYY-MM-DD';
      case 'yyyy/mm/dd': return 'YYYY/MM/DD';
      case 'dd-mm-yyyy': return 'DD-MM-YYYY';
      case 'mm-dd-yyyy': return 'MM-DD-YYYY';
      case 'mmmm dd, yyyy': return 'Month DD, YYYY';
      default: return 'MM/DD/YYYY';
    }
  }

  // --- Year grid ---

  private getYearsGrid() {
    const currentYear = new Date().getFullYear();
    const selectedYear = this.viewDate.getFullYear();
    const years = [];
    for (let i = 0; i < 12; i++) {
      const year = this.yearRangeStart + i;
      const classes = ['year-cell'];
      if (year === currentYear) classes.push('year-cell--current');
      if (year === selectedYear) classes.push('year-cell--selected');
      years.push(html`
        <button class="${classes.join(' ')}" type="button" data-year="${year}">${year}</button>
      `);
    }
    return years;
  }

  // --- Day grid ---

  private getDayHeaders() {
    const days = [...this.dayNames];
    for (let i = 0; i < this.firstDayOfWeek; i++) {
      days.push(days.shift()!);
    }
    return days.map(day => html`<div class="weekday">${day}</div>`);
  }

  private getDaysGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startingDayOfWeek = firstDay.getDay() - this.firstDayOfWeek;
    if (startingDayOfWeek < 0) startingDayOfWeek += 7;

    const daysInMonth = lastDay.getDate();
    const today = new Date();

    const isSameDay = (a: Date, b: Date | null) =>
      b !== null &&
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const isDisabled = (date: Date) => {
      if (this.min) {
        const minDate = this.parseDate(this.min);
        if (minDate && date < minDate) return true;
      }
      if (this.max) {
        const maxDate = this.parseDate(this.max);
        if (maxDate && date > maxDate) return true;
      }
      return false;
    };

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(html`<div class="day day--empty"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const classes = ['day'];

      if (isSameDay(date, today)) classes.push('day--today');
      if (isDisabled(date)) classes.push('day--disabled');

      const isStart = isSameDay(date, this.startDate);
      const isEnd = isSameDay(date, this.endDate);

      if (isStart) classes.push('day--range-start');
      if (isEnd) classes.push('day--range-end');

      // Confirmed range
      if (this.startDate && this.endDate && !isStart && !isEnd) {
        const t = date.getTime();
        if (t > this.startDate.getTime() && t < this.endDate.getTime()) {
          classes.push('day--in-range');
        }
      }

      // Hover preview during selection
      if (this.selectionPhase === 'selecting' && this.startDate && this.hoverDate && !isStart) {
        const t = date.getTime();
        const startTime = this.startDate.getTime();
        const hoverTime = this.hoverDate.getTime();
        const lo = Math.min(startTime, hoverTime);
        const hi = Math.max(startTime, hoverTime);
        if ((t > lo && t < hi) || isSameDay(date, this.hoverDate)) {
          classes.push('day--range-preview');
        }
      }

      // Preset hover preview
      if (this.presetPreviewStart && this.presetPreviewEnd) {
        const t = date.getTime();
        const ps = this.presetPreviewStart.getTime();
        const pe = this.presetPreviewEnd.getTime();
        if (isSameDay(date, this.presetPreviewStart) || isSameDay(date, this.presetPreviewEnd)) {
          classes.push('day--preset-preview-endpoint');
        } else if (t > ps && t < pe) {
          classes.push('day--preset-preview');
        }
      }

      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      days.push(html`
        <button
          class="${classes.join(' ')}"
          type="button"
          data-date="${dateStr}"
          ?disabled="${isDisabled(date)}"
          aria-label="${this.formatDate(date)}"
        >
          ${day}
        </button>
      `);
    }

    return days;
  }

  // --- Init ---

  private parseInitialValues() {
    if (this.start) {
      const date = this.parseDate(this.start);
      if (date) {
        this.startDate = date;
        this.viewDate = new Date(date);
      }
    }
    if (this.end) {
      const date = this.parseDate(this.end);
      if (date) this.endDate = date;
    }
  }

  // --- Handlers ---

  private handleInputClick(_e: Event) {
    if (!this.showCalendar && !this.disabled && !this.readonly) {
      this.open();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.showCalendar) this.open();
    } else if (e.key === 'Escape' && this.showCalendar) {
      this.close();
      this.focus();
    }
  }

  private handleCalendarToggle(_e: Event) {
    if (this.showCalendar) this.close();
    else this.open();
  }

  private handleCalendarClick(e: Event) {
    e.stopPropagation();
    const target = e.target as HTMLElement;

    const yearEl = target.closest('[data-year]') as HTMLElement | null;
    if (yearEl) {
      const year = parseInt(yearEl.getAttribute('data-year')!, 10);
      this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
      this.calendarView = 'days';
      this.updateCalendarGrid();
      return;
    }

    const dayEl = target.closest('[data-date]') as HTMLElement | null;
    if (dayEl) {
      const dateString = dayEl.getAttribute('data-date');
      if (dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        this.handleDaySelect(new Date(year, month - 1, day));
      }
      return;
    }

    const presetEl = target.closest('[data-preset]') as HTMLElement | null;
    if (presetEl) {
      const idx = parseInt(presetEl.getAttribute('data-preset')!, 10);
      if (this.presets[idx]) this.handlePresetSelect(this.presets[idx]);
      return;
    }

    const navEl = target.closest('[data-nav]') as HTMLElement | null;
    if (navEl) this.handleNavigation(navEl.getAttribute('data-nav')!);
  }

  private handleDaySelect(date: Date) {
    if (this.selectionPhase === 'idle') {
      this.startDate = date;
      this.endDate = null;
      this.selectionPhase = 'selecting';
      this.start = this.formatDate(date);
      this.end = '';
      this.updateInput();
      this.updateCalendarGrid();
    } else {
      if (date.getTime() < this.startDate!.getTime()) {
        this.startDate = date;
        this.start = this.formatDate(date);
        this.updateInput();
        this.updateCalendarGrid();
        return;
      }

      this.endDate = date;
      this.end = this.formatDate(date);
      this.selectionPhase = 'idle';
      this.hoverDate = null;
      this.updateInput();
      this.updateFormValue();
      this.updateClearButton();
      this.dispatchChangeEvent();
      this.close();
    }
  }

  private handlePresetSelect(preset: DateRangePreset) {
    const startDate = preset.start instanceof Date ? preset.start : this.parseDate(preset.start as string);
    const endDate = preset.end instanceof Date ? preset.end : this.parseDate(preset.end as string);
    if (startDate && endDate) {
      this.presetPreviewStart = null;
      this.presetPreviewEnd = null;
      this.selectRange(startDate, endDate);
      this.dispatchPresetEvent(preset.label);
      this.close();
    }
  }

  private handleDayHover(e: Event) {
    if (this.selectionPhase !== 'selecting') return;
    const target = e.target as HTMLElement;
    const dayEl = target.closest('[data-date]') as HTMLElement | null;
    if (dayEl) {
      const dateString = dayEl.getAttribute('data-date');
      if (dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        this.hoverDate = new Date(year, month - 1, day);
        this.updateCalendarGrid();
      }
    }
  }

  private handleCalendarMouseOut() {
    if (this.selectionPhase === 'selecting' && this.hoverDate) {
      this.hoverDate = null;
      this.updateCalendarGrid();
    }
  }

  private handlePresetHover(e: Event) {
    const target = e.target as HTMLElement;
    const presetEl = target.closest('[data-preset]') as HTMLElement | null;
    if (!presetEl) return;
    const idx = parseInt(presetEl.getAttribute('data-preset')!, 10);
    const preset = this.presets[idx];
    if (!preset) return;
    const s = preset.start instanceof Date ? preset.start : this.parseDate(preset.start as string);
    const en = preset.end instanceof Date ? preset.end : this.parseDate(preset.end as string);
    if (s && en) {
      this.presetPreviewStart = s.getTime() <= en.getTime() ? s : en;
      this.presetPreviewEnd = s.getTime() <= en.getTime() ? en : s;
      this.updateCalendarGrid();
    }
  }

  private handlePresetHoverOut(e: Event) {
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    this.presetPreviewStart = null;
    this.presetPreviewEnd = null;
    this.updateCalendarGrid();
  }

  private handleNavigation(nav: string) {
    switch (nav) {
      case 'prev-month':
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
        this.updateCalendarGrid();
        break;
      case 'next-month':
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
        this.updateCalendarGrid();
        break;
      case 'today': {
        const today = new Date();
        this.viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.calendarView = 'days';
        this.updateCalendarGrid();
        break;
      }
      case 'show-years':
        this.yearRangeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 12);
        this.calendarView = 'years';
        this.updateCalendarGrid();
        break;
      case 'prev-years':
        this.yearRangeStart -= 12;
        this.updateCalendarGrid();
        break;
      case 'next-years':
        this.yearRangeStart += 12;
        this.updateCalendarGrid();
        break;
    }
  }

  // --- Helpers ---

  private getBestViewDate(start: Date, end: Date): Date {
    if (this.columns === 2) {
      // For dual column, show the start month (next month auto-shows beside it)
      return new Date(start.getFullYear(), start.getMonth(), 1);
    }
    // For single column, find which month has the most days in the range
    const months = new Map<string, number>();
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      months.set(key, (months.get(key) || 0) + 1);
      cursor.setDate(cursor.getDate() + 1);
    }
    let bestKey = '';
    let bestCount = 0;
    for (const [key, count] of months) {
      if (count > bestCount) { bestCount = count; bestKey = key; }
    }
    if (bestKey) {
      const [y, m] = bestKey.split('-').map(Number);
      return new Date(y, m, 1);
    }
    return new Date(start.getFullYear(), start.getMonth(), 1);
  }

  private updateInput() {
    if (this.input) {
      this.input.value = this.getDisplayValue();
    }
  }

  private updateClearButton() {
    if (!this.clearButton || !this.clearable) return;
    const shouldShow = (this.startDate || this.endDate) && !this.disabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
  }

  private updateCalendarGrid() {
    this.template();
  }

  private updateFormValue() {
    if (!this.internals) return;
    if (this.name && (this.start || this.end)) {
      const formData = new FormData();
      formData.append(`${this.name}-start`, this.start);
      formData.append(`${this.name}-end`, this.end);
      this.internals.setFormValue(formData);
    } else {
      this.internals.setFormValue(null);
    }
  }

  private setupClickOutside() {
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node) && this.showCalendar) {
        this.close();
      }
    });
  }

  // --- Watchers ---

  @watch('start')
  handleStartPropChange() {
    const date = this.parseDate(this.start);
    this.startDate = date;
    if (date) this.viewDate = new Date(date);
    this.updateInput();
    this.updateClearButton();
    this.updateFormValue();
    if (this.showCalendar) this.updateCalendarGrid();
  }

  @watch('end')
  handleEndPropChange() {
    const date = this.parseDate(this.end);
    this.endDate = date;
    this.updateInput();
    this.updateClearButton();
    this.updateFormValue();
    if (this.showCalendar) this.updateCalendarGrid();
  }

  @watch('show-calendar')
  handleShowCalendarChange() {
    if (this.calendarEl) {
      if (this.showCalendar) {
        this.calendarEl.removeAttribute('hidden');
        this.positionCalendar();
        this.calendarEl.classList.add('calendar--open');
        if (typeof (this.calendarEl as any).showPopover === 'function') {
          (this.calendarEl as any).showPopover();
        }
        this.dispatchOpenEvent();
      } else {
        this.calendarEl.classList.remove('calendar--open');
        if (typeof (this.calendarEl as any).hidePopover === 'function') {
          (this.calendarEl as any).hidePopover();
        }
        this.calendarEl.setAttribute('hidden', '');
        this.dispatchCloseEvent();
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) this.input.disabled = this.disabled;
    if (this.calendarToggle) this.calendarToggle.disabled = this.disabled;
    this.updateClearButton();
  }

  @watch('format')
  handleFormatChange() {
    this.updateInput();
  }

  // --- Events ---

  @dispatch('daterange-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return {
      start: this.start,
      end: this.end,
      startDate: this.startDate,
      endDate: this.endDate,
      startIso: this.startDate ? this.startDate.toISOString().split('T')[0] : '',
      endIso: this.endDate ? this.endDate.toISOString().split('T')[0] : '',
      dateRangePicker: this,
    };
  }

  @dispatch('daterange-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { dateRangePicker: this };
  }

  @dispatch('daterange-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { dateRangePicker: this };
  }

  @dispatch('daterange-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return { dateRangePicker: this };
  }

  @dispatch('daterange-preset', { bubbles: true, composed: true })
  private dispatchPresetEvent(label: string) {
    return { label, start: this.start, end: this.end, dateRangePicker: this };
  }

  @dispatch('daterange-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { dateRangePicker: this };
  }

  @dispatch('daterange-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { dateRangePicker: this };
  }

  // --- Public API ---

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  clear() {
    this.startDate = null;
    this.endDate = null;
    this.start = '';
    this.end = '';
    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.updateInput();
    this.updateFormValue();
    this.updateClearButton();
    this.dispatchClearEvent();
    this.dispatchChangeEvent();
    this.focus();
  }

  open() {
    if (!this.disabled && !this.readonly) {
      this.showCalendar = true;
      this.calendarView = 'days';
      if (this.startDate) this.viewDate = new Date(this.startDate);
      this.updateCalendarGrid();
      if (this.calendarEl) {
        this.calendarEl.removeAttribute('hidden');
        this.positionCalendar();
        this.calendarEl.classList.add('calendar--open');
        if (typeof (this.calendarEl as any).showPopover === 'function') {
          (this.calendarEl as any).showPopover();
        }
      }
      this.dispatchOpenEvent();
    }
  }

  close() {
    this.showCalendar = false;
    if (this.selectionPhase === 'selecting') {
      this.selectionPhase = 'idle';
      this.hoverDate = null;
    }
    if (this.calendarEl) {
      this.calendarEl.classList.remove('calendar--open');
      if (typeof (this.calendarEl as any).hidePopover === 'function') {
        (this.calendarEl as any).hidePopover();
      }
      this.calendarEl.setAttribute('hidden', '');
    }
    this.dispatchCloseEvent();
  }

  private positionCalendar() {
    if (!this.calendarEl || CSS.supports('position-anchor', '--a')) return;
    const container = this.shadowRoot?.querySelector('.input-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.calendarEl.style.top = `${rect.bottom + 2}px`;
    this.calendarEl.style.left = `${rect.left}px`;
    this.calendarEl.style.minWidth = `${rect.width}px`;
  }

  selectRange(startDate: Date, endDate: Date) {
    let s = startDate;
    let e = endDate;
    if (s.getTime() > e.getTime()) { const tmp = s; s = e; e = tmp; }

    this.startDate = s;
    this.endDate = e;
    this.start = this.formatDate(s);
    this.end = this.formatDate(e);
    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.viewDate = this.getBestViewDate(s, e);
    this.updateInput();
    this.updateFormValue();
    this.updateClearButton();
    this.updateCalendarGrid();
    this.dispatchChangeEvent();
  }

  checkValidity() {
    return this.input?.checkValidity() ?? true;
  }

  reportValidity() {
    return this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string) {
    this.input?.setCustomValidity(message);
  }
}
