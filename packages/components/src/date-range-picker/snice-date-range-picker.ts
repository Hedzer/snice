import { element, property, state, query, watch, dispatch, ready, dispose, reconnect, render, styles, html, css } from 'snice';
import cssContent from './snice-date-range-picker.css?inline';
import type {
  DateRangePickerSize,
  DateRangePickerVariant,
  DateRangeFormat,
  DateRangePreset,
  SniceDateRangePickerElement,
} from './snice-date-range-picker.types';
import { FormLabelAssociation } from '../form-label-association';

@element('snice-date-range-picker', { formAssociated: true, delegatesFocus: true })
export class SniceDateRangePicker extends HTMLElement implements SniceDateRangePickerElement {
  internals!: ElementInternals;

  private dirtyRange = false;
  private customValidationMessage = '';
  private readonly descriptionId = `snice-date-range-picker-desc-${Math.random().toString(36).slice(2, 10)}`;
  private readonly labelAssociation: FormLabelAssociation;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.input,
      () => this.label || 'Date range',
      name => this.calendarEl?.setAttribute('aria-label', `${name} calendar`)
    );
  }

  @state()
  private startState = '';

  @state()
  private endState = '';

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  /**
   * Live start value. Canonical and configured display-format strings are
   * accepted; assigning it does not rewrite the authored reset default.
   * @public
   */
  get start(): string {
    return this.startState;
  }

  set start(value: string) {
    this.setStartFromString(value, true);
  }

  /**
   * Live end value. Canonical and configured display-format strings are
   * accepted; assigning it does not rewrite the authored reset default.
   * @public
   */
  get end(): string {
    return this.endState;
  }

  set end(value: string) {
    this.setEndFromString(value, true);
  }

  /** The `start` content attribute and form-reset start default. */
  @property({ attribute: 'start' })
  defaultStart = '';

  /** The `end` content attribute and form-reset end default. */
  @property({ attribute: 'end' })
  defaultEnd = '';

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

  @query('.input-container')
  inputContainer?: HTMLElement;

  private startDate: Date | null = null;
  private endDate: Date | null = null;
  private validationInput?: HTMLInputElement;
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
    const interactionDisabled = this.interactionDisabled;
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const showClear = Boolean(this.start || this.end) && this.clearable && !interactionDisabled && !this.readonly;
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      displayedInvalid ? 'input--invalid' : '',
      this.clearable ? 'input--clearable' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');

    const hasPresets = this.presets && this.presets.length > 0;
    const isDual = this.columns === 2;
    const nextMonthDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    const accessibleName = this.labelAssociation.accessibleName;
    const describedBy = this.errorText || this.helperText ? this.descriptionId : '';

    return html/*html*/`
      <div class="date-picker-wrapper">
        <if ${this.label}>
          <label class="${labelClasses}" @click=${() => this.focus()}>
            ${this.label}
          </label>
        </if>

        <div class="input-container">
          <input
            class="${inputClasses}"
            type="text"
            .value=${this.getDisplayValue()}
            .placeholder=${this.placeholder || this.getPlaceholder()}
            .disabled=${interactionDisabled}
            .readOnly=${true}
            .required=${this.required}
            .name=${this.name || ''}
            aria-label="${accessibleName}"
            aria-describedby="${describedBy}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
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
            .disabled=${interactionDisabled || this.readonly}
            @click=${(e: Event) => this.handleCalendarToggle(e)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
          </button>

          <button
            class="clear-button${showClear ? ' clear-button--visible' : ''}"
            type="button"
            aria-label="Clear"
            tabindex="-1"
            part="clear"
            style="${showClear ? '' : 'display: none;'}"
            .disabled=${interactionDisabled || this.readonly}
            @click=${() => this.clear()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>

          <div class="calendar" part="calendar" popover="manual" role="group" aria-label="${accessibleName} calendar" ?hidden=${!this.showCalendar}
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
            <span id="${this.descriptionId}" class="error-text" part="error-text" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span id="${this.descriptionId}" class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default></default>
        </case>
      </div>
    `;
  }

  @ready()
  init() {
    // Firefox focuses the form-associated host when reporting ElementInternals
    // validity even when a shadow validation anchor is supplied. Keep the host
    // programmatically focusable without adding a second sequential tab stop.
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;

    // Preserve properties assigned before custom-element upgrade. Own data
    // properties otherwise shadow the native-style live accessors forever.
    const hasOwnStart = Object.prototype.hasOwnProperty.call(this, 'start');
    const hasOwnEnd = Object.prototype.hasOwnProperty.call(this, 'end');
    const liveStart = hasOwnStart ? (this as { start: unknown }).start : this.defaultStart;
    const liveEnd = hasOwnEnd ? (this as { end: unknown }).end : this.defaultEnd;
    if (hasOwnStart) delete (this as Partial<{ start: unknown }>).start;
    if (hasOwnEnd) delete (this as Partial<{ end: unknown }>).end;

    if (hasOwnStart || hasOwnEnd) {
      this.commitRangeValues(liveStart, liveEnd, true);
    } else if (!this.dirtyRange) {
      this.applyDefaultRange();
    }

    this.syncNativeInput();
    this.syncFormState();
    queueMicrotask(() => {
      this.syncNativeInput();
      this.updateClearButton();
    });
    this.setupClickOutside();
    this.labelAssociation.connect();
  }

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyRange = false;
    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.applyDefaultRange();
  }

  formDisabledCallback(disabled: boolean) {
    // Effective disabledness can come from a disabled fieldset. Keep it
    // separate from the authored `disabled` property and content attribute.
    this.formDisabled = disabled;
    if (disabled && this.showCalendar) this.close();
    this.syncNativeInput();
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    const restored = this.readRestoredState(state);
    if (!restored) return;
    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.commitRangeValues(restored.start, restored.end, true);
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

  // --- Date parsing/formatting (kept compatible with date-picker formats) ---

  private createLocalDate(year: number, month: number, day: number): Date | null {
    if (!Number.isInteger(year) || year < 1 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }

    // setFullYear avoids JavaScript's special 1900 offset for years 0-99.
    // The field round trip rejects month/day rollover while keeping the value
    // in local-calendar space rather than introducing a UTC date shift.
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? date
      : null;
  }

  private parseCanonicalDate(dateString: string): Date | null {
    const match = dateString.match(/^(\d{4,})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return this.createLocalDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Canonical values are accepted regardless of the configured display
    // format, just as they are by date-picker.
    const canonicalDate = this.parseCanonicalDate(dateString);
    if (canonicalDate) return canonicalDate;

    if (this.format === 'mmmm dd, yyyy') {
      const match = dateString.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4,})$/);
      if (match) {
        const [, monthName, day, year] = match;
        const monthIndex = this.monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex >= 0) {
          return this.createLocalDate(Number(year), monthIndex + 1, Number(day));
        }
      }
      return null;
    }

    let match: RegExpMatchArray | null = null;
    let year = 0;
    let month = 0;
    let day = 0;
    switch (this.format) {
      case 'mm/dd/yyyy':
        match = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/);
        if (match) [, month, day, year] = match.map(Number);
        break;
      case 'dd/mm/yyyy':
        match = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/);
        if (match) [, day, month, year] = match.map(Number);
        break;
      case 'yyyy/mm/dd':
        match = dateString.match(/^(\d{4,})[\/-](\d{1,2})[\/-](\d{1,2})$/);
        if (match) [, year, month, day] = match.map(Number);
        break;
      case 'dd-mm-yyyy':
        match = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/);
        if (match) [, day, month, year] = match.map(Number);
        break;
      case 'mm-dd-yyyy':
        match = dateString.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/);
        if (match) [, month, day, year] = match.map(Number);
        break;
      case 'yyyy-mm-dd':
        return null;
    }

    return match ? this.createLocalDate(year, month, day) : null;
  }

  private formatDate(date: Date): string {
    if (!this.isValidDate(date)) return '';
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

  private toCanonicalDate(date: Date): string {
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isValidDate(date: Date | null): date is Date {
    return date instanceof Date && Number.isFinite(date.getTime());
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

  // --- Live/default range state ---

  private applyDefaultRange() {
    this.commitRangeValues(this.defaultStart, this.defaultEnd, false);
  }

  private setStartFromString(value: unknown, dirty: boolean) {
    if (dirty) this.dirtyRange = true;
    this.startState = String(value ?? '');
    this.startDate = this.parseDate(this.startState);
    if (this.startDate) this.viewDate = new Date(this.startDate);
    this.finishRangeStateUpdate();
  }

  private setEndFromString(value: unknown, dirty: boolean) {
    if (dirty) this.dirtyRange = true;
    this.endState = String(value ?? '');
    this.endDate = this.parseDate(this.endState);
    this.finishRangeStateUpdate();
  }

  private commitRangeValues(start: unknown, end: unknown, dirty: boolean) {
    if (dirty) this.dirtyRange = true;

    this.startState = String(start ?? '');
    this.endState = String(end ?? '');
    this.startDate = this.parseDate(this.startState);
    this.endDate = this.parseDate(this.endState);
    if (this.startDate) this.viewDate = new Date(this.startDate);

    this.finishRangeStateUpdate();
  }

  private finishRangeStateUpdate() {
    this.syncNativeInput();
    this.syncFormState();
    this.updateClearButton();
    if (this.showCalendar && this.calendarEl) this.updateCalendarGrid();
  }

  private readRestoredState(state: File | string | FormData | null): { start: string; end: string } | null {
    if (state instanceof FormData) {
      const start = state.get(`${this.name}-start`) ?? state.get('start');
      const end = state.get(`${this.name}-end`) ?? state.get('end');
      if ((typeof start !== 'string' && start !== null) || (typeof end !== 'string' && end !== null)) return null;
      return { start: start ?? '', end: end ?? '' };
    }
    if (typeof state !== 'string') return null;

    try {
      const parsed = JSON.parse(state) as unknown;
      if (!Array.isArray(parsed) || parsed.length !== 2 ||
          typeof parsed[0] !== 'string' || typeof parsed[1] !== 'string') {
        return null;
      }
      return { start: parsed[0], end: parsed[1] };
    } catch {
      return null;
    }
  }

  // --- Handlers ---

  private handleInputClick(_e: Event) {
    if (!this.showCalendar && !this.interactionDisabled && !this.readonly) {
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
    // A live start assignment can invalidate the first click while the popup
    // remains open. Treat the next day as a fresh start instead of assuming a
    // stale selection phase still has a usable Date.
    if (this.selectionPhase === 'idle' || !this.startDate) {
      this.selectionPhase = 'selecting';
      this.commitRangeValues(this.formatDate(date), '', true);
      this.updateCalendarGrid();
    } else {
      if (date.getTime() < this.startDate!.getTime()) {
        this.commitRangeValues(this.formatDate(date), '', true);
        this.updateCalendarGrid();
        return;
      }

      this.selectionPhase = 'idle';
      this.hoverDate = null;
      this.commitRangeValues(this.start, this.formatDate(date), true);
      this.dispatchChangeEvent();
      this.close();
    }
  }

  private handlePresetSelect(preset: DateRangePreset) {
    const startDate = preset.start instanceof Date ? preset.start : this.parseDate(preset.start as string);
    const endDate = preset.end instanceof Date ? preset.end : this.parseDate(preset.end as string);
    if (this.isValidDate(startDate) && this.isValidDate(endDate)) {
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
    if (this.isValidDate(s) && this.isValidDate(en)) {
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

  private get interactionDisabled() {
    return this.disabled || this.loading || this.formDisabled;
  }

  private syncNativeInput() {
    if (this.input) {
      this.input.value = this.getDisplayValue();
      this.input.disabled = this.interactionDisabled;
      this.input.readOnly = true;
      this.input.required = this.required;
      this.input.name = this.name || '';
    }
    if (this.calendarToggle) this.calendarToggle.disabled = this.interactionDisabled || this.readonly;
    if (this.clearButton) this.clearButton.disabled = this.interactionDisabled || this.readonly;
  }

  private updateClearButton() {
    if (!this.clearButton) return;
    const shouldShow = Boolean(this.start || this.end) && this.clearable && !this.interactionDisabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
    this.clearButton.classList.toggle('clear-button--visible', shouldShow);
    this.clearButton.disabled = this.interactionDisabled || this.readonly;
  }

  private updateClearButtonAfterRender() {
    // Property watchers run before their queued render. The nested microtask
    // applies imperative query state after that render has reconciled.
    queueMicrotask(() => queueMicrotask(() => this.updateClearButton()));
  }

  private updateCalendarGrid() {
    this.template();
  }

  private syncFormState() {
    if (this.internals && this.name) {
      const formData = new FormData();
      formData.append(`${this.name}-start`, this.startDate ? this.toCanonicalDate(this.startDate) : '');
      formData.append(`${this.name}-end`, this.endDate ? this.toCanonicalDate(this.endDate) : '');
      this.internals.setFormValue(formData, JSON.stringify([this.start, this.end]));
    } else if (this.internals) {
      this.internals.setFormValue(null);
    }
    this.syncValidity();
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) {
      this.validationInput = document.createElement('input');
      this.validationInput.type = 'text';
    }
    return this.validationInput;
  }

  private syncValidity() {
    const barred = this.interactionDisabled || this.readonly;
    const hasStart = Boolean(this.start);
    const hasEnd = Boolean(this.end);
    const invalidStart = hasStart && !this.startDate;
    const invalidEnd = hasEnd && !this.endDate;
    const partial = hasStart !== hasEnd;
    const complete = Boolean(this.startDate && this.endDate);
    const reversed = complete && this.startDate!.getTime() > this.endDate!.getTime();
    const minDate = this.parseDate(this.min);
    const maxDate = this.parseDate(this.max);
    const rangeUnderflow = complete && Boolean(minDate) &&
      (this.startDate!.getTime() < minDate!.getTime() || this.endDate!.getTime() < minDate!.getTime());
    const rangeOverflow = complete && Boolean(maxDate) &&
      (this.startDate!.getTime() > maxDate!.getTime() || this.endDate!.getTime() > maxDate!.getTime());

    const flags: ValidityStateFlags = {
      badInput: !barred && (invalidStart || invalidEnd || partial),
      customError: !barred && (Boolean(this.customValidationMessage) || reversed),
      patternMismatch: false,
      rangeOverflow: !barred && rangeOverflow,
      rangeUnderflow: !barred && rangeUnderflow,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: !barred && this.required && !complete
    };
    const hasError = Object.values(flags).some(Boolean);
    const message = this.customValidationMessage ||
      (flags.badInput ? 'Please select both a valid start and end date.' : '') ||
      (reversed ? 'End date must be on or after start date.' : '') ||
      (flags.valueMissing ? 'Please select a date range.' : '') ||
      (flags.rangeUnderflow && minDate ? `Dates must be on or after ${this.toCanonicalDate(minDate)}.` : '') ||
      (flags.rangeOverflow && maxDate ? `Dates must be on or before ${this.toCanonicalDate(maxDate)}.` : '') ||
      (hasError ? 'Please select a valid date range.' : '');

    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;
    const proxy = this.validationProxy;
    proxy.disabled = barred;
    proxy.value = complete ? `${this.toCanonicalDate(this.startDate!)} / ${this.toCanonicalDate(this.endDate!)}` : '';
    proxy.setCustomValidity(hasError ? message : '');
    this.input?.setCustomValidity(hasError ? message : '');
    this.input?.setAttribute('aria-invalid', String(displayedInvalid));
    this.input?.classList.toggle('input--invalid', displayedInvalid);

    if (!this.internals) return;
    if (!hasError) {
      this.internals.setValidity({});
    } else if (this.input) {
      this.internals.setValidity(flags, message, this.input);
    } else {
      this.internals.setValidity(flags, message);
    }
  }

  /**
   * ElementInternals.form is authoritative in browsers. Some DOM test
   * implementations expose ElementInternals without form-owner discovery, so
   * retain the standard explicit-form/nearest-form lookup as a fallback.
   */
  private get fallbackFormOwner(): HTMLFormElement | null {
    const explicitOwner = this.getAttribute('form');
    if (explicitOwner !== null) {
      const root = this.getRootNode();
      if (!('querySelectorAll' in root)) return null;
      return Array.from((root as ParentNode).querySelectorAll('form[id]'))
        .find((candidate): candidate is HTMLFormElement =>
          candidate instanceof HTMLFormElement && candidate.id === explicitOwner
        ) ?? null;
    }
    return this.closest('form');
  }

  private clickOutsideHandler = (e: MouseEvent) => {
    if (!this.showCalendar) return;
    if (e.composedPath().includes(this)) return;
    this.close();
  };

  private setupClickOutside() {
    document.addEventListener('click', this.clickOutsideHandler);
    window.addEventListener('resize', this.positionCalendarHandler);
    window.addEventListener('scroll', this.positionCalendarHandler, true);
  }

  @reconnect()
  private onReconnect() {
    this.setupClickOutside();
    this.labelAssociation.connect();
  }

  @dispose()
  private cleanupClickOutside() {
    document.removeEventListener('click', this.clickOutsideHandler);
    window.removeEventListener('resize', this.positionCalendarHandler);
    window.removeEventListener('scroll', this.positionCalendarHandler, true);
    this.labelAssociation.disconnect();
  }

  // --- Watchers ---

  @watch('defaultStart', 'defaultEnd')
  handleDefaultRangeChange() {
    if (!this.dirtyRange) this.applyDefaultRange();
  }

  @watch('show-calendar')
  handleShowCalendarChange() {
    if (this.calendarEl) {
      if (this.showCalendar) {
        this.calendarEl.removeAttribute('hidden');
        this.calendarEl.classList.add('calendar--open');
        if (typeof (this.calendarEl as any).showPopover === 'function') {
          (this.calendarEl as any).showPopover();
        }
        this.positionCalendar();
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

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    if (this.interactionDisabled && this.showCalendar) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
    this.updateClearButtonAfterRender();
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.readonly && this.showCalendar) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
    this.updateClearButtonAfterRender();
  }

  @watch('name', 'required', 'min', 'max', { immediate: false })
  handleFormConstraintChange() {
    this.syncNativeInput();
    this.syncFormState();
    if (this.showCalendar) this.updateCalendarGrid();
  }

  @watch('clearable', { immediate: false })
  handleClearableChange() {
    this.updateClearButtonAfterRender();
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      const displayedInvalid = this.invalid || this.constraintInvalid;
      this.input.setAttribute('aria-invalid', String(displayedInvalid));
      this.input.classList.toggle('input--invalid', displayedInvalid);
    }
  }

  @watch('format')
  handleFormatChange() {
    this.updateInput();
    this.syncValidity();
    if (this.showCalendar) this.updateCalendarGrid();
  }

  // --- Events ---

  @dispatch('daterange-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return {
      start: this.start,
      end: this.end,
      startDate: this.startDate,
      endDate: this.endDate,
      startIso: this.startDate ? this.toCanonicalDate(this.startDate) : '',
      endIso: this.endDate ? this.toCanonicalDate(this.endDate) : '',
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
    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.commitRangeValues('', '', true);
    this.dispatchClearEvent();
    this.dispatchChangeEvent();
    this.focus();
  }

  open() {
    if (!this.interactionDisabled && !this.readonly) {
      this.showCalendar = true;
      this.calendarView = 'days';
      if (this.startDate) this.viewDate = new Date(this.startDate);
      this.updateCalendarGrid();
      if (this.calendarEl) {
        this.calendarEl.removeAttribute('hidden');
        this.calendarEl.classList.add('calendar--open');
        if (typeof (this.calendarEl as any).showPopover === 'function') {
          (this.calendarEl as any).showPopover();
        }
        this.positionCalendar();
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
    if (!this.calendarEl) return;
    const container = this.inputContainer;
    if (!container) return;
    const anchor = container.getBoundingClientRect();
    const popup = this.calendarEl.getBoundingClientRect();
    const margin = 8;
    const gap = 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = Math.max(popup.width, anchor.width);
    const below = anchor.bottom + gap;
    const above = anchor.top - popup.height - gap;

    let top = below;
    if (below + popup.height > viewportHeight - margin && above >= margin) top = above;
    top = Math.max(margin, Math.min(top, viewportHeight - popup.height - margin));

    let left = anchor.left;
    if (left + popupWidth > viewportWidth - margin) left = viewportWidth - popupWidth - margin;
    left = Math.max(margin, left);

    this.calendarEl.style.top = `${top}px`;
    this.calendarEl.style.left = `${left}px`;
    this.calendarEl.style.minWidth = `${anchor.width}px`;
  }

  private positionCalendarHandler = () => {
    if (this.showCalendar) this.positionCalendar();
  };

  selectRange(startDate: Date, endDate: Date) {
    // Invalid Date instances are possible at runtime despite the public
    // TypeScript signature. Ignore them atomically so an API call or preset
    // cannot replace a usable range with NaN-derived strings.
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) return;

    let s = startDate;
    let e = endDate;
    if (s.getTime() > e.getTime()) { const tmp = s; s = e; e = tmp; }

    this.selectionPhase = 'idle';
    this.hoverDate = null;
    this.commitRangeValues(this.formatDate(s), this.formatDate(e), true);
    if (this.startDate && this.endDate) this.viewDate = this.getBestViewDate(this.startDate, this.endDate);
    this.updateCalendarGrid();
    this.dispatchChangeEvent();
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.fallbackFormOwner;
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.validationProxy.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.validationProxy.validationMessage;
  }

  /** Whether this range picker participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.validationProxy.willValidate;
  }

  /** Labels associated with this range picker. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity() {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.validationProxy.checkValidity();
  }

  reportValidity() {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.validationProxy.reportValidity();
  }

  setCustomValidity(message: string) {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }
}
