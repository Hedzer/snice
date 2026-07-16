import { element, property, state, query, watch, dispatch, ready, dispose, reconnect, render, styles, html, css } from 'snice';
import cssContent from './snice-date-time-picker.css?inline';
import type { DateTimePickerVariant, DateTimePickerTimeFormat, DateTimePickerSize, DateTimePickerDateFormat, SniceDateTimePickerElement } from './snice-date-time-picker.types';
import { FormLabelAssociation } from '../form-label-association';

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@element('snice-date-time-picker', { formAssociated: true })
export class SniceDateTimePicker extends HTMLElement implements SniceDateTimePickerElement {
  internals!: ElementInternals;

  private dirtyValue = false;
  private customValidationMessage = '';
  private readonly descriptionId = `snice-date-time-picker-desc-${Math.random().toString(36).slice(2, 10)}`;
  private readonly labelAssociation: FormLabelAssociation;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : (this.variant === 'inline' ? this.panel : this.input),
      () => this.label || 'Date and time',
      name => this.syncCompositeAccessibleNames(name)
    );
  }

  @property()
  size: DateTimePickerSize = 'medium';

  @state()
  private valueState = '';

  @state()
  private formDisabled = false;

  /**
   * Live local date-time value. Assigning it does not rewrite the authored
   * form-reset default stored by the `value` content attribute.
   * @public
   */
  get value(): string {
    return this.valueState;
  }

  set value(value: string) {
    this.setValueFromString(value, true);
  }

  /** The `value` content attribute and form-reset default. */
  @property({ attribute: 'value' })
  defaultValue = '';

  @property({ attribute: 'date-format' })
  dateFormat: DateTimePickerDateFormat = 'yyyy-mm-dd';

  @property({ attribute: 'time-format' })
  timeFormat: DateTimePickerTimeFormat = '24h';

  @property()
  min = '';

  @property()
  max = '';

  @property({ type: Boolean, attribute: 'show-seconds' })
  showSeconds = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  clearable = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  readonly = false;

  @property()
  placeholder = '';

  @property()
  label = '';

  @property({ attribute: 'helper-text' })
  helperText = '';

  @property({ attribute: 'error-text' })
  errorText = '';

  @property({ type: Boolean })
  required = false;

  @property({ type: Boolean })
  invalid = false;

  @property()
  name = '';

  @property()
  variant: DateTimePickerVariant = 'dropdown';

  @property({ type: Boolean, attribute: 'show-panel' })
  private showPanel = false;

  @query('.input')
  input?: HTMLInputElement;

  @query('.input-container')
  inputContainer?: HTMLElement;

  @query('.panel')
  panel?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  // Internal state
  private inputValue = '';
  private selectedDate: Date | null = null;
  private selectedParts: DateTimeParts | null = null;
  private validationInput?: HTMLInputElement;
  private viewDate = new Date();
  private calendarView: 'days' | 'years' = 'days';
  private yearRangeStart = 0;
  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private period: 'AM' | 'PM' = 'AM';

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

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
  renderContent() {
    const interactionDisabled = this.interactionDisabled;
    const validityInvalid = this.hasValidationError();
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const inputClasses = [
      'input',
      `input--${this.size}`,
      this.invalid || validityInvalid ? 'input--invalid' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');
    const isInline = this.variant === 'inline';
    const accessibleName = this.labelAssociation.accessibleName;
    const describedBy = this.errorText || this.helperText ? this.descriptionId : '';

    return html/*html*/`
      <div class="datetime-wrapper" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" part="label" @click=${() => this.focus()}>${this.label}</label>
        </if>

        <if ${!isInline}>
          <div class="input-container">
            <input
              class="${inputClasses}"
              type="text"
              .value=${this.inputValue}
              .placeholder=${this.placeholder || this.getPlaceholder()}
              .disabled=${interactionDisabled}
              .readOnly=${this.readonly}
              .required=${this.required}
              aria-label="${accessibleName}"
              aria-describedby="${describedBy}"
              aria-invalid="${this.invalid || validityInvalid ? 'true' : 'false'}"
              part="input"
              autocomplete="off"
              @input=${this.handleInput}
              @change=${this.handleChange}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
              @click=${this.handleInputClick}
              @keydown=${this.handleKeydown}
            />

            <button
              class="toggle-button"
              type="button"
              aria-label="Open date and time picker"
              tabindex="-1"
              part="toggle"
              .disabled=${interactionDisabled}
              @click=${this.handleToggle}
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
              .disabled=${interactionDisabled || this.readonly}
              @click=${(e: Event) => this.handleClear(e)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>

            <if ${this.loading}>
              <span class="spinner" part="spinner"></span>
            </if>
          </div>
        </if>

        <div
          class="panel ${isInline ? 'panel--inline' : ''}"
          part="panel"
          role="group"
          aria-label="${accessibleName} controls"
          aria-describedby="${isInline ? describedBy : ''}"
          tabindex="-1"
          ?hidden=${!isInline && !this.showPanel}
        >
          <div class="panel-calendar" part="calendar" role="group" aria-label="${accessibleName} date">
            ${this.renderCalendar()}
          </div>
          <div class="panel-time" part="time">
            ${this.renderTimeSelectors()}
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

  private renderCalendar() {
    return html/*html*/`
      <case ${this.calendarView}>
        <when value="years">
          <div class="calendar-header">
            <button class="nav-button" type="button" aria-label="Previous years" .disabled=${this.interactionDisabled || this.readonly} @click=${this.prevYears}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>

            <div class="calendar-title">
              <span class="month-label">${this.yearRangeStart} — ${this.yearRangeStart + 11}</span>
            </div>

            <button class="nav-button" type="button" aria-label="Next years" .disabled=${this.interactionDisabled || this.readonly} @click=${this.nextYears}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div class="year-grid" @click=${(e: Event) => this.handleYearClick(e)}>
            ${this.getYearsGrid()}
          </div>
        </when>
        <default>
          <div class="calendar-header">
            <button class="nav-button" type="button" aria-label="Previous month" .disabled=${this.interactionDisabled || this.readonly} @click=${this.prevMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>

            <div class="calendar-title">
              <span class="month-label">${this.monthNames[this.viewDate.getMonth()]} </span><button class="year-button" type="button" .disabled=${this.interactionDisabled || this.readonly} @click=${this.showYears}>${this.viewDate.getFullYear()}</button>
            </div>

            <button class="nav-button" type="button" aria-label="Next month" .disabled=${this.interactionDisabled || this.readonly} @click=${this.nextMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div class="calendar-weekdays">
            ${this.dayNames.map(day => html`<div class="weekday">${day}</div>`)}
          </div>

          <div class="calendar-days" @click=${(e: Event) => this.handleDayClick(e)}>
            ${this.getDaysGrid()}
          </div>
        </default>
      </case>

      <div class="calendar-footer">
        <button class="today-button" type="button" .disabled=${this.interactionDisabled || this.readonly || !this.dateIntersectsRange(new Date())} @click=${this.goToToday}>Today</button>
      </div>
    `;
  }

  private renderTimeSelectors() {
    const hourMax = this.timeFormat === '12h' ? 12 : 23;
    const hourStart = this.timeFormat === '12h' ? 1 : 0;
    const accessibleName = this.labelAssociation.accessibleName;

    return html/*html*/`
      <div class="time-header">Time</div>
      <div class="time-selectors">
        <div class="time-column" role="group" data-time-unit="hours" aria-label="${accessibleName} hours">
          <label class="time-label">Hr</label>
          <div class="time-list" @click=${(e: Event) => this.handleHourClick(e)}>
            ${Array.from({ length: hourMax - hourStart + 1 }, (_, i) => i + hourStart).map(h => {
              const displayH = this.timeFormat === '12h' ? this.hours : this.hours;
              const isSelected = h === (this.timeFormat === '12h' ? (this.hours === 0 ? 12 : this.hours > 12 ? this.hours - 12 : this.hours) : this.hours);
              return html`
                <button
                  class="time-item ${isSelected ? 'time-item--selected' : ''}"
                  type="button"
                  data-hour="${h}"
                  .disabled=${this.interactionDisabled || this.readonly}
                >${this.timeFormat === '12h' ? String(h) : h.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <div class="time-column" role="group" data-time-unit="minutes" aria-label="${accessibleName} minutes">
          <label class="time-label">Min</label>
          <div class="time-list" @click=${(e: Event) => this.handleMinuteClick(e)}>
            ${Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
              const isSelected = m === this.minutes;
              return html`
                <button
                  class="time-item ${isSelected ? 'time-item--selected' : ''}"
                  type="button"
                  data-minute="${m}"
                  .disabled=${this.interactionDisabled || this.readonly}
                >${m.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <if ${this.showSeconds}>
          <div class="time-column" role="group" data-time-unit="seconds" aria-label="${accessibleName} seconds">
            <label class="time-label">Sec</label>
            <div class="time-list" @click=${(e: Event) => this.handleSecondClick(e)}>
              ${Array.from({ length: 12 }, (_, i) => i * 5).map(s => {
                const isSelected = s === this.seconds;
                return html`
                  <button
                    class="time-item ${isSelected ? 'time-item--selected' : ''}"
                    type="button"
                    data-second="${s}"
                    .disabled=${this.interactionDisabled || this.readonly}
                  >${s.toString().padStart(2, '0')}</button>
                `;
              })}
            </div>
          </div>
        </if>

        <if ${this.timeFormat === '12h'}>
          <div class="time-column time-column--period" role="group" data-time-unit="period" aria-label="${accessibleName} period">
            <label class="time-label">Period</label>
            <div class="time-list">
              <button
                class="time-item ${this.period === 'AM' ? 'time-item--selected' : ''}"
                type="button"
                .disabled=${this.interactionDisabled || this.readonly}
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="time-item ${this.period === 'PM' ? 'time-item--selected' : ''}"
                type="button"
                .disabled=${this.interactionDisabled || this.readonly}
                @click=${() => this.setPeriod('PM')}
              >PM</button>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @ready()
  init() {
    // Preserve a property assigned before custom-element upgrade. An own data
    // property would otherwise shadow the live-value accessor permanently.
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
      this.value = String(value ?? '');
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }

    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.syncNativeInput();
    this.syncFormState();
    this.setupClickOutside();
    this.labelAssociation.connect();
    queueMicrotask(() => {
      this.syncNativeInput();
      this.updateClearButton();
    });

    // Set popover attribute for dropdown variant (not inline)
    if (this.variant !== 'inline' && this.panel) {
      this.panel.setAttribute('popover', 'manual');
    }
  }

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  formDisabledCallback(disabled: boolean) {
    // Fieldset disabledness is effective state, not authored component state.
    this.formDisabled = disabled;
    if (disabled && this.showPanel) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    const displayParts = this.parseDisplayValue(state);
    if (displayParts) {
      this.commitDateTimeState(displayParts, this.toCanonicalDateTime(displayParts), state, true);
      return;
    }
    this.setValueFromString(state, true);
  }

  private applyDefaultValue() {
    this.setValueFromString(this.defaultValue, false);
  }

  private setValueFromString(value: unknown, dirty: boolean) {
    const candidate = String(value ?? '');
    const parts = this.parseCanonicalDateTime(candidate);
    const display = parts ? this.formatPartsForDisplay(parts) : candidate;
    this.commitDateTimeState(parts, candidate, display, dirty);
  }

  private setValueFromInput(inputValue: string, dirty: boolean) {
    const parts = this.parseDisplayValue(inputValue);
    const liveValue = parts ? this.toCanonicalDateTime(parts) : inputValue;
    this.commitDateTimeState(parts, liveValue, inputValue, dirty);
  }

  private commitDateTimeState(
    parts: DateTimeParts | null,
    liveValue: string,
    inputValue: string,
    dirty: boolean
  ) {
    if (dirty) this.dirtyValue = true;

    this.selectedParts = parts;
    this.inputValue = inputValue;
    this.valueState = liveValue;

    if (parts) {
      this.selectedDate = this.createLocalDate(parts.year, parts.month, parts.day);
      if (this.selectedDate) this.viewDate = new Date(this.selectedDate);
      this.hours = parts.hours;
      this.minutes = parts.minutes;
      this.seconds = parts.seconds;
      this.period = parts.hours >= 12 ? 'PM' : 'AM';
    } else {
      this.selectedDate = null;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.period = 'AM';
    }

    this.syncNativeInput();
    this.syncFormState();
    this.updateClearButton();
  }

  private parseCanonicalDateTime(value: string): DateTimeParts | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    return this.createDateTimeParts(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      match[6] === undefined ? 0 : Number(match[6])
    );
  }

  private parseDisplayValue(value: string): DateTimeParts | null {
    const candidate = value.trim();
    if (!candidate) return null;

    const timeMatch = this.timeFormat === '12h'
      ? candidate.match(/\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i)
      : candidate.match(/\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch || (this.showSeconds && timeMatch[3] === undefined)) return null;

    const dateText = candidate.slice(0, timeMatch.index).trim();
    const date = this.parseDisplayDate(dateText);
    if (!date) return null;

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = timeMatch[3] === undefined ? 0 : Number(timeMatch[3]);

    if (this.timeFormat === '12h') {
      if (hours < 1 || hours > 12) return null;
      const period = timeMatch[4].toUpperCase();
      hours = hours % 12 + (period === 'PM' ? 12 : 0);
    }

    return this.createDateTimeParts(date.year, date.month, date.day, hours, minutes, seconds);
  }

  private parseDisplayDate(value: string): Pick<DateTimeParts, 'year' | 'month' | 'day'> | null {
    let match: RegExpMatchArray | null = null;
    let year = 0;
    let month = 0;
    let day = 0;

    switch (this.dateFormat) {
      case 'mm/dd/yyyy':
        match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) [month, day, year] = match.slice(1).map(Number);
        break;
      case 'dd/mm/yyyy':
        match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) [day, month, year] = match.slice(1).map(Number);
        break;
      case 'yyyy/mm/dd':
        match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if (match) [year, month, day] = match.slice(1).map(Number);
        break;
      case 'dd-mm-yyyy':
        match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (match) [day, month, year] = match.slice(1).map(Number);
        break;
      case 'mm-dd-yyyy':
        match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (match) [month, day, year] = match.slice(1).map(Number);
        break;
      case 'mmmm dd, yyyy': {
        match = value.match(/^([A-Za-z]+)\s+(\d{2}),\s*(\d{4})$/);
        if (match) {
          month = this.monthNames.findIndex(name => name.toLowerCase() === match![1].toLowerCase()) + 1;
          day = Number(match[2]);
          year = Number(match[3]);
          if (month === 0) match = null;
        }
        break;
      }
      case 'yyyy-mm-dd':
      default:
        match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) [year, month, day] = match.slice(1).map(Number);
        break;
    }

    return match && this.createLocalDate(year, month, day) ? { year, month, day } : null;
  }

  private createDateTimeParts(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number
  ): DateTimeParts | null {
    if (!this.createLocalDate(year, month, day) ||
        !Number.isInteger(hours) || hours < 0 || hours > 23 ||
        !Number.isInteger(minutes) || minutes < 0 || minutes > 59 ||
        !Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
      return null;
    }
    return { year, month, day, hours, minutes, seconds };
  }

  private createLocalDate(year: number, month: number, day: number): Date | null {
    if (!Number.isInteger(year) || year < 1 || year > 9999 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }

  private formatPartsForDisplay(parts: DateTimeParts): string {
    return `${this.formatDateValues(parts.year, parts.month, parts.day)} ${this.formatTimeValues(parts.hours, parts.minutes, parts.seconds)}`;
  }

  private getDisplayValue(): string {
    if (!this.selectedDate || !this.selectedParts) return this.inputValue;

    const datePart = this.formatDatePart(this.selectedDate);
    const timePart = this.formatTimePart();
    return `${datePart} ${timePart}`;
  }

  private formatDatePart(date: Date): string {
    return this.formatDateValues(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  private formatDateValues(year: number, month: number, day: number): string {
    const yyyy = year.toString();
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');

    switch (this.dateFormat) {
      case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
      case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
      case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
      case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
      case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
      case 'mmmm dd, yyyy': return `${this.monthNames[month - 1]} ${dd}, ${yyyy}`;
      case 'yyyy-mm-dd':
      default: return `${yyyy}-${mm}-${dd}`;
    }
  }

  private formatTimePart(): string {
    return this.formatTimeValues(this.hours, this.minutes, this.seconds);
  }

  private formatTimeValues(hours: number, minutes: number, seconds: number): string {
    if (this.timeFormat === '12h') {
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? 'PM' : 'AM';
      const base = `${displayHour}:${minutes.toString().padStart(2, '0')}`;
      if (this.showSeconds) {
        return `${base}:${seconds.toString().padStart(2, '0')} ${period}`;
      }
      return `${base} ${period}`;
    }

    const base = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (this.showSeconds) {
      return `${base}:${seconds.toString().padStart(2, '0')}`;
    }
    return base;
  }

  private getPlaceholder(): string {
    const datePh = this.dateFormat === 'mmmm dd, yyyy' ? 'Month DD, YYYY' : this.dateFormat.toUpperCase();
    const timePh = this.timeFormat === '12h'
      ? (this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM')
      : (this.showSeconds ? 'HH:MM:SS' : 'HH:MM');
    return `${datePh} ${timePh}`;
  }

  private getISOValue(): string {
    return this.selectedParts ? this.toCanonicalDateTime(this.selectedParts) : '';
  }

  private toCanonicalDateTime(parts: DateTimeParts): string {
    const yyyy = parts.year.toString().padStart(4, '0');
    const mm = parts.month.toString().padStart(2, '0');
    const dd = parts.day.toString().padStart(2, '0');
    const hh = parts.hours.toString().padStart(2, '0');
    const mi = parts.minutes.toString().padStart(2, '0');
    const ss = parts.seconds.toString().padStart(2, '0');
    return this.showSeconds
      ? `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
      : `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  private parseConstraint(value: string, edge: 'min' | 'max'): DateTimeParts | null {
    const dateTime = this.parseCanonicalDateTime(value);
    if (dateTime) return dateTime;
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return null;
    return this.createDateTimeParts(
      Number(dateMatch[1]),
      Number(dateMatch[2]),
      Number(dateMatch[3]),
      edge === 'max' ? 23 : 0,
      edge === 'max' ? 59 : 0,
      edge === 'max' ? 59 : 0
    );
  }

  private dateTimeKey(parts: DateTimeParts): number {
    return (((((parts.year * 13 + parts.month) * 32 + parts.day) * 24 + parts.hours) * 60 + parts.minutes) * 60) + parts.seconds;
  }

  private dateIntersectsRange(date: Date): boolean {
    const start = this.createDateTimeParts(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0, 0, 0);
    const end = this.createDateTimeParts(date.getFullYear(), date.getMonth() + 1, date.getDate(), 23, 59, 59);
    if (!start || !end) return false;
    const min = this.parseConstraint(this.min, 'min');
    const max = this.parseConstraint(this.max, 'max');
    return (!min || this.dateTimeKey(end) >= this.dateTimeKey(min)) &&
      (!max || this.dateTimeKey(start) <= this.dateTimeKey(max));
  }

  private getDaysGrid() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const isToday = (date: Date) =>
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isSelected = (date: Date) =>
      this.selectedDate &&
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear();

    const isDisabled = (date: Date) => !this.dateIntersectsRange(date);

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(html`<div class="day day--empty"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const classes = ['day'];
      if (isToday(date)) classes.push('day--today');
      if (isSelected(date)) classes.push('day--selected');
      if (isDisabled(date)) classes.push('day--disabled');

      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      days.push(html`
        <button
          class="${classes.join(' ')}"
          type="button"
          data-date="${dateStr}"
          ?disabled=${isDisabled(date)}
          aria-label="${this.formatDatePart(date)}"
        >${day}</button>
      `);
    }

    return days;
  }

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
        <button class="${classes.join(' ')}" type="button" data-year="${year}" .disabled=${this.interactionDisabled || this.readonly}>${year}</button>
      `);
    }
    return years;
  }

  // Event handlers

  private handleInput(e: Event) {
    this.setValueFromInput((e.target as HTMLInputElement).value, true);
  }

  private handleChange(e: Event) {
    this.setValueFromInput((e.target as HTMLInputElement).value, true);
    this.emitDateTimeChange();
  }

  private handleFocus() {
    this.emitFocus();
  }

  private handleBlur() {
    this.emitBlur();
  }

  private handleInputClick() {
    if (!this.showPanel && !this.interactionDisabled && !this.readonly) {
      this.open();
    }
  }

  private handleToggle() {
    if (this.interactionDisabled || this.readonly) return;
    if (this.showPanel) {
      this.close();
    } else {
      this.open();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.interactionDisabled || this.readonly) return;
    if (e.key === 'Escape' && this.showPanel) {
      this.close();
      this.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && !this.showPanel) {
      e.preventDefault();
      this.open();
    }
  }

  private handleDayClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-date]');
    if (!target || (target as HTMLButtonElement).disabled) return;

    const dateStr = target.getAttribute('data-date')!;
    const [year, month, day] = dateStr.split('-').map(Number);
    const next = this.createDateTimeParts(year, month, day, this.hours, this.minutes, this.seconds);
    if (!next) return;
    this.selectedParts = next;
    this.selectedDate = this.createLocalDate(year, month, day);
    this.viewDate = new Date(this.selectedDate!);
    this.updateValue();
  }

  private handleYearClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-year]');
    if (!target) return;
    const year = parseInt(target.getAttribute('data-year')!, 10);
    this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
    this.calendarView = 'days';
    this.renderContent();
  }

  private handleClear(e: Event) {
    e.stopPropagation();
    if (this.interactionDisabled || this.readonly) return;
    this.clear();
  }

  private showYears() {
    if (this.interactionDisabled || this.readonly) return;
    this.yearRangeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 12);
    this.calendarView = 'years';
    this.renderContent();
  }

  private prevYears() {
    if (this.interactionDisabled || this.readonly) return;
    this.yearRangeStart -= 12;
    this.renderContent();
  }

  private nextYears() {
    if (this.interactionDisabled || this.readonly) return;
    this.yearRangeStart += 12;
    this.renderContent();
  }

  private updateClearButton() {
    if (!this.clearButton || !this.clearable) return;
    const shouldShow = Boolean(this.inputValue) && !this.interactionDisabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
  }

  private syncCompositeAccessibleNames(name: string) {
    this.panel?.setAttribute('aria-label', `${name} controls`);
    this.shadowRoot?.querySelector('.panel-calendar')?.setAttribute('aria-label', `${name} date`);
    this.shadowRoot?.querySelectorAll<HTMLElement>('[data-time-unit]').forEach(group => {
      group.setAttribute('aria-label', `${name} ${group.dataset.timeUnit}`);
    });
  }

  private handleHourClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-hour]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    let h = parseInt(target.getAttribute('data-hour')!, 10);

    if (this.timeFormat === '12h') {
      // Convert to 24h internal
      if (this.period === 'AM' && h === 12) h = 0;
      else if (this.period === 'PM' && h !== 12) h += 12;
    }

    this.hours = h;
    this.updateValue();
  }

  private handleMinuteClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-minute]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.minutes = parseInt(target.getAttribute('data-minute')!, 10);
    this.updateValue();
  }

  private handleSecondClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-second]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.seconds = parseInt(target.getAttribute('data-second')!, 10);
    this.updateValue();
  }

  private setPeriod(period: 'AM' | 'PM') {
    if (this.interactionDisabled || this.readonly) return;
    if (this.period === period) return;

    // Convert hours when switching periods
    if (period === 'PM' && this.hours < 12) {
      this.hours += 12;
    } else if (period === 'AM' && this.hours >= 12) {
      this.hours -= 12;
    }
    this.period = period;
    this.updateValue();
  }

  private prevMonth() {
    if (this.interactionDisabled || this.readonly) return;
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.renderContent();
  }

  private nextMonth() {
    if (this.interactionDisabled || this.readonly) return;
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.renderContent();
  }

  private goToToday() {
    if (this.interactionDisabled || this.readonly) return;
    const today = new Date();
    if (!this.dateIntersectsRange(today)) return;
    this.selectedDate = this.createLocalDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this.selectedParts = this.createDateTimeParts(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      this.hours,
      this.minutes,
      this.seconds
    );
    this.viewDate = new Date(this.selectedDate!);
    this.calendarView = 'days';
    this.updateValue();
  }

  private updateValue() {
    if (!this.selectedDate) {
      this.syncFormState();
      this.emitDateTimeChange();
      this.renderContent();
      return;
    }
    const parts = this.createDateTimeParts(
      this.selectedDate.getFullYear(),
      this.selectedDate.getMonth() + 1,
      this.selectedDate.getDate(),
      this.hours,
      this.minutes,
      this.seconds
    );
    if (!parts) return;
    const canonical = this.toCanonicalDateTime(parts);
    this.commitDateTimeState(parts, canonical, this.formatPartsForDisplay(parts), true);
    this.emitDateTimeChange();
    this.renderContent();
  }

  private clickOutsideHandler = (e: MouseEvent) => {
    if (!this.showPanel) return;
    if (e.composedPath().includes(this)) return;
    this.close();
  };

  private setupClickOutside() {
    document.addEventListener('click', this.clickOutsideHandler);
    window.addEventListener('resize', this.positionPanelHandler);
    window.addEventListener('scroll', this.positionPanelHandler, true);
  }

  @reconnect()
  private onReconnect() {
    this.setupClickOutside();
    this.labelAssociation.connect();
  }

  @dispose()
  private cleanupClickOutside() {
    document.removeEventListener('click', this.clickOutsideHandler);
    window.removeEventListener('resize', this.positionPanelHandler);
    window.removeEventListener('scroll', this.positionPanelHandler, true);
    this.labelAssociation.disconnect();
  }

  // Watchers

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('show-panel')
  handleShowPanelChange() {
    if (this.panel) {
      if (this.showPanel) {
        this.panel.removeAttribute('hidden');
        if (typeof (this.panel as any).showPopover === 'function') {
          (this.panel as any).showPopover();
        }
        this.positionPanel();
        this.emitOpen();
      } else {
        this.panel.setAttribute('hidden', '');
        if (typeof (this.panel as any).hidePopover === 'function') {
          (this.panel as any).hidePopover();
        }
        this.emitClose();
      }
    }
  }

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    if (this.interactionDisabled && this.showPanel) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('readonly', { immediate: false })
  handleReadonlyChange() {
    if (this.readonly && this.showPanel) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('name', 'required', 'min', 'max', { immediate: false })
  handleFormConstraintChange() {
    this.syncNativeInput();
    this.syncFormState();
  }

  @watch('dateFormat', 'timeFormat', { immediate: false })
  handleDisplayFormatChange() {
    if (this.selectedParts) this.inputValue = this.formatPartsForDisplay(this.selectedParts);
    this.syncNativeInput();
  }

  @watch('showSeconds', { immediate: false })
  handleSecondsVisibilityChange() {
    if (this.selectedParts) this.inputValue = this.formatPartsForDisplay(this.selectedParts);
    this.syncNativeInput();
    this.syncFormState();
  }

  @watch('clearable', { immediate: false })
  handleClearableChange() {
    queueMicrotask(() => this.updateClearButton());
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      const invalid = this.invalid || this.hasValidationError();
      this.input.setAttribute('aria-invalid', String(invalid));
      this.input.classList.toggle('input--invalid', invalid);
    }
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) {
      this.validationInput = document.createElement('input');
      this.validationInput.type = 'datetime-local';
    }
    return this.validationInput;
  }

  private syncNativeInput() {
    if (!this.input) return;
    this.input.value = this.inputValue;
    this.input.disabled = this.interactionDisabled;
    this.input.readOnly = this.readonly;
    this.input.required = this.required;
    const invalid = this.invalid || this.hasValidationError();
    this.input.setAttribute('aria-invalid', String(invalid));
    this.input.classList.toggle('input--invalid', invalid);
  }

  private syncFormState() {
    const canonical = this.getISOValue();
    if (this.internals) {
      // The first value is the successful-control value. The second preserves
      // exact visible text for browser history/autofill restoration.
      this.internals.setFormValue(canonical, this.inputValue);
    }
    this.syncValidity();
  }

  private getValidityFlags(): ValidityStateFlags {
    const barred = this.interactionDisabled || this.readonly;
    if (barred) {
      return {
        badInput: false,
        customError: false,
        patternMismatch: false,
        rangeOverflow: false,
        rangeUnderflow: false,
        stepMismatch: false,
        tooLong: false,
        tooShort: false,
        typeMismatch: false,
        valueMissing: false
      };
    }

    const proxy = this.validationProxy;
    const canonical = this.getISOValue();
    proxy.disabled = false;
    proxy.readOnly = false;
    proxy.required = this.required;
    proxy.step = this.showSeconds ? '1' : '60';
    const min = this.parseConstraint(this.min, 'min');
    const max = this.parseConstraint(this.max, 'max');
    proxy.min = min ? this.toCanonicalDateTime(min) : '';
    proxy.max = max ? this.toCanonicalDateTime(max) : '';
    proxy.value = canonical;
    proxy.setCustomValidity(this.customValidationMessage);

    const effectiveValue = this.selectedParts
      ? { ...this.selectedParts, seconds: this.showSeconds ? this.selectedParts.seconds : 0 }
      : null;
    const valueKey = effectiveValue ? this.dateTimeKey(effectiveValue) : null;
    const nativeValidity = proxy.validity;
    return {
      badInput: Boolean(this.inputValue) && !this.selectedParts,
      customError: Boolean(this.customValidationMessage),
      patternMismatch: nativeValidity.patternMismatch,
      rangeOverflow: valueKey !== null && Boolean(max) && valueKey > this.dateTimeKey(max!),
      rangeUnderflow: valueKey !== null && Boolean(min) && valueKey < this.dateTimeKey(min!),
      stepMismatch: nativeValidity.stepMismatch,
      tooLong: nativeValidity.tooLong,
      tooShort: nativeValidity.tooShort,
      typeMismatch: nativeValidity.typeMismatch,
      valueMissing: this.required && !canonical
    };
  }

  private hasValidationError(): boolean {
    return Object.values(this.getValidityFlags()).some(Boolean);
  }

  private syncValidity() {
    const flags = this.getValidityFlags();
    const hasError = Object.values(flags).some(Boolean);
    const message = this.customValidationMessage ||
      (flags.badInput ? 'Please enter a valid local date and time.' : '') ||
      (flags.rangeUnderflow ? `Value must be ${this.min} or later.` : '') ||
      (flags.rangeOverflow ? `Value must be ${this.max} or earlier.` : '') ||
      (flags.valueMissing ? 'Please select a date and time.' : '') ||
      (hasError ? this.validationProxy.validationMessage || 'Please enter a valid local date and time.' : '');

    if (this.input) {
      this.input.setCustomValidity(hasError ? message : '');
      const invalid = this.invalid || hasError;
      this.input.setAttribute('aria-invalid', String(invalid));
      this.input.classList.toggle('input--invalid', invalid);
    }

    if (!this.internals) return;
    if (!hasError) {
      this.internals.setValidity({});
    } else if (this.input) {
      this.internals.setValidity(flags, message, this.input);
    } else {
      this.internals.setValidity(flags, message);
    }
  }

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

  @dispatch('datetimepicker-clear', { bubbles: true, composed: true })
  private emitClear() {
    return { dateTimePicker: this };
  }

  // Event dispatchers

  @dispatch('datetime-change', { bubbles: true, composed: true })
  private emitDateTimeChange() {
    return {
      value: this.value,
      date: this.selectedDate,
      dateString: this.selectedDate ? this.formatDatePart(this.selectedDate) : '',
      timeString: this.formatTimePart(),
      iso: this.getISOValue(),
      dateTimePicker: this,
    };
  }

  @dispatch('datetimepicker-focus', { bubbles: true, composed: true })
  private emitFocus() {
    return { dateTimePicker: this };
  }

  @dispatch('datetimepicker-blur', { bubbles: true, composed: true })
  private emitBlur() {
    return { dateTimePicker: this };
  }

  @dispatch('datetimepicker-open', { bubbles: true, composed: true })
  private emitOpen() {
    return { dateTimePicker: this };
  }

  @dispatch('datetimepicker-close', { bubbles: true, composed: true })
  private emitClose() {
    return { dateTimePicker: this };
  }

  // Public API

  open() {
    if (!this.interactionDisabled && !this.readonly && this.variant === 'dropdown') {
      this.calendarView = 'days';
      this.showPanel = true;
      if (this.panel) {
        this.panel.removeAttribute('hidden');
        if (typeof (this.panel as any).showPopover === 'function') {
          (this.panel as any).showPopover();
        }
        this.positionPanel();
      }
      this.emitOpen();
    }
  }

  close() {
    this.showPanel = false;
    if (this.panel) {
      this.panel.setAttribute('hidden', '');
      if (typeof (this.panel as any).hidePopover === 'function') {
        (this.panel as any).hidePopover();
      }
    }
    this.emitClose();
  }

  private positionPanel() {
    if (!this.panel) return;
    const container = this.inputContainer;
    if (!container) return;
    const anchor = container.getBoundingClientRect();
    const popup = this.panel.getBoundingClientRect();
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

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
    this.panel.style.minWidth = `${anchor.width}px`;
  }

  private positionPanelHandler = () => {
    if (this.showPanel) this.positionPanel();
  };

  focus() {
    if (this.interactionDisabled) return;
    (this.variant === 'inline' ? this.panel : this.input)?.focus();
  }

  blur() {
    (this.variant === 'inline' ? this.panel : this.input)?.blur();
  }

  clear() {
    this.commitDateTimeState(null, '', '', true);
    this.emitClear();
    this.emitDateTimeChange();
    this.focus();
  }

  /** Native-compatible control type. @public */
  get type(): 'datetime-local' {
    return 'datetime-local' as const;
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.fallbackFormOwner;
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input?.validity ?? this.validationProxy.validity;
  }

  /** Current localized validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this picker participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with this picker. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity() {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.input?.checkValidity() ?? true;
  }

  reportValidity() {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string) {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }
}
