import { element, property, state, query, watch, dispatch, ready, dispose, reconnect, render, styles, html, css } from 'snice';
import cssContent from './snice-date-picker.css?inline';
import type { DatePickerSize, DatePickerVariant, DateFormat, SniceDatePickerElement, DatePickerValue } from './snice-date-picker.types';
import { FormLabelAssociation } from '../form-label-association';

@element('snice-date-picker', { formAssociated: true, delegatesFocus: true })
export class SniceDatePicker extends HTMLElement implements SniceDatePickerElement {
  internals!: ElementInternals;

  private dirtyValue = false;
  private customValidationMessage = '';
  private readonly descriptionId = `snice-date-picker-desc-${Math.random().toString(36).slice(2, 10)}`;
  private readonly labelAssociation: FormLabelAssociation;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.input,
      () => this.label || 'Date'
    );
  }
  @property({  })
  size: DatePickerSize = 'medium';

  @property({  })
  variant: DatePickerVariant = 'outlined';

  @state()
  private valueState = '';

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  /**
   * Live value in the stable `YYYY-MM-DD` form used by native date inputs.
   * Assigning it does not rewrite the authored reset default.
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

  // Track input separately to prevent cursor jumps during typing
  private inputValue = '';

  @property({  })
  format: DateFormat = 'mm/dd/yyyy';

  @property({  })
  placeholder = '';

  @property({  })
  label = '';

  @property({ attribute: 'helper-text',  })
  helperText = '';

  @property({ attribute: 'error-text',  })
  errorText = '';

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  readonly = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({ type: Boolean,  })
  clearable = false;

  @property({  })
  min = '';

  @property({  })
  max = '';

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'open',  })
  open = false;

  @property({ type: Number, attribute: 'first-day-of-week',  })
  firstDayOfWeek = 0; // 0 = Sunday

  @query('.input')
  input?: HTMLInputElement;

  @query('.calendar')
  calendar?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  @query('.calendar-toggle')
  calendarToggle?: HTMLButtonElement;

  @query('.day--selected')
  selectedDayButton?: HTMLButtonElement;

  @query('.day:not(.day--empty):not(.day--disabled)')
  firstDayButton?: HTMLButtonElement;

  private selectedDate: Date | null = null;
  private validationInput?: HTMLInputElement;
  private viewDate = new Date();
  private calendarView: 'days' | 'years' = 'days';
  private yearRangeStart = 0;
  
  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  render() {
    const interactionDisabled = this.interactionDisabled;
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const showClear = Boolean(this.inputValue) && this.clearable && !interactionDisabled && !this.readonly;
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      displayedInvalid ? 'input--invalid' : '',
      this.clearable ? 'input--clearable' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');
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
            .value=${this.inputValue}
            .placeholder=${this.placeholder || this.getPlaceholderForFormat()}
            .disabled=${interactionDisabled}
            .readOnly=${this.readonly}
            .required=${this.required}
            .name=${this.name || ''}
            aria-label="${accessibleName}"
            aria-describedby="${describedBy}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
            part="input"
            autocomplete="off"
            @input=${(e: Event) => this.handleInput(e)}
            @change=${(e: Event) => this.handleChange(e)}
            @focus=${(e: Event) => this.handleFocus(e)}
            @blur=${(e: Event) => this.handleBlur(e)}
            @click=${(e: Event) => this.handleInputClick(e)}
            @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}
          />

          <button
            class="calendar-toggle"
            type="button"
            aria-label="Open calendar"
            tabindex="-1"
            part="calendar-toggle"
            .disabled=${interactionDisabled}
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
            @click=${(e: Event) => this.handleClear(e)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>

          <div class="calendar" part="calendar" popover="manual" ?hidden=${!this.open} @click=${(e: Event) => this.handleCalendarClick(e)}>
            <case ${this.calendarView}>
              <when value="years">
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
              </when>
              <default>
                <div class="calendar-header">
                  <button class="nav-button" type="button" data-nav="prev-month" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                    </svg>
                  </button>

                  <div class="calendar-title">
                    <span class="month-label">${this.monthNames[this.viewDate.getMonth()]} </span><button class="year-button" type="button" data-nav="show-years">${this.viewDate.getFullYear()}</button>
                  </div>

                  <button class="nav-button" type="button" data-nav="next-month" aria-label="Next month">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>

                <div class="calendar-weekdays">
                  ${this.getDayHeaders()}
                </div>

                <div class="calendar-days" role="grid" aria-label="Calendar days" @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}>
                  ${this.getDaysGrid()}
                </div>
              </default>
            </case>

            <div class="calendar-footer">
              <snice-button
                class="today-button"
                variant="default"
                size="small"
                data-nav="today"
                ?disabled=${!this.isDateInRange(new Date())}
              >
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
    // Preserve a property assigned before custom-element upgrade. The own data
    // property otherwise shadows the native-compatible accessor forever.
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
      this.value = String(value ?? '');
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }

    this.syncNativeInput();
    this.syncFormState();
    queueMicrotask(() => {
      this.syncNativeInput();
      this.updateClearButton();
    });
    this.setupCalendarClickOutside();
    this.labelAssociation.connect();
  }

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  formDisabledCallback(disabled: boolean) {
    // Effective disabledness can come from a disabled fieldset. Keep it
    // separate from the authored `disabled` property and content attribute.
    this.formDisabled = disabled;
    if (disabled && this.open) this.hide();
    this.syncNativeInput();
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    // Restore exact visible text. Complete dates derive their canonical value;
    // partial/invalid text stays visible and invalid, never submitted as a date.
    this.setValueFromInput(state, true);
  }

  private applyDefaultValue() {
    this.setValueFromString(this.defaultValue, false);
  }

  private setValueFromString(value: unknown, dirty: boolean) {
    const candidate = String(value ?? '');
    const date = this.parseDate(candidate);
    this.commitDateState(date, date ? this.formatDate(date) : '', dirty);
  }

  private setValueFromInput(inputValue: string, dirty: boolean) {
    this.commitDateState(this.parseDate(inputValue), inputValue, dirty);
  }

  private commitDateState(date: Date | null, inputValue: string, dirty: boolean) {
    if (dirty) this.dirtyValue = true;

    const normalizedDate = date
      ? this.createLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      : null;
    this.selectedDate = normalizedDate;
    this.inputValue = inputValue;
    if (normalizedDate) this.viewDate = new Date(normalizedDate);

    this.valueState = normalizedDate ? this.toCanonicalDate(normalizedDate) : '';
    this.syncNativeInput();
    this.syncFormState();
    this.updateClearButton();
    if (this.open && this.calendar) this.updateCalendarGrid();
  }

  private createLocalDate(year: number, month: number, day: number): Date | null {
    if (!Number.isInteger(year) || year < 1 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }

    // setFullYear avoids JavaScript's special 1900 offset for years 0-99.
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
    // format, exactly like assigning to a native date input's value property.
    const canonicalDate = this.parseCanonicalDate(dateString);
    if (canonicalDate) return canonicalDate;

    if (this.format === 'mmmm dd, yyyy') {
      const monthNameRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4,})$/;
      const match = dateString.match(monthNameRegex);
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
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    const yyyy = year.toString().padStart(4, '0');
    
    switch (this.format) {
      case 'mm/dd/yyyy':
        return `${mm}/${dd}/${yyyy}`;
      case 'dd/mm/yyyy':
        return `${dd}/${mm}/${yyyy}`;
      case 'yyyy-mm-dd':
        return `${yyyy}-${mm}-${dd}`;
      case 'yyyy/mm/dd':
        return `${yyyy}/${mm}/${dd}`;
      case 'dd-mm-yyyy':
        return `${dd}-${mm}-${yyyy}`;
      case 'mm-dd-yyyy':
        return `${mm}-${dd}-${yyyy}`;
      case 'mmmm dd, yyyy':
        return `${this.monthNames[date.getMonth()]} ${dd}, ${yyyy}`;
      default:
        return `${mm}/${dd}/${yyyy}`;
    }
  }

  private toCanonicalDate(date: Date): string {
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getPlaceholderForFormat(): string {
    switch (this.format) {
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'dd/mm/yyyy':
        return 'DD/MM/YYYY';
      case 'yyyy-mm-dd':
        return 'YYYY-MM-DD';
      case 'yyyy/mm/dd':
        return 'YYYY/MM/DD';
      case 'dd-mm-yyyy':
        return 'DD-MM-YYYY';
      case 'mm-dd-yyyy':
        return 'MM-DD-YYYY';
      case 'mmmm dd, yyyy':
        return 'Month DD, YYYY';
      default:
        return 'MM/DD/YYYY';
    }
  }

  private getDayHeaders() {
    const days = [...this.dayNames];
    // Rotate array based on firstDayOfWeek (0=Sunday, 1=Monday, etc.)
    for (let i = 0; i < this.firstDayOfWeek; i++) {
      days.push(days.shift()!);
    }
    return days.map(day => html`<div class="weekday">${day}</div>`);
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
        <button class="${classes.join(' ')}" type="button" data-year="${year}">${year}</button>
      `);
    }
    return years;
  }

  private isDateInRange(date: Date): boolean {
    const normalized = this.createLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    if (!normalized) return false;

    // Canonical constraints are the documented/native form, but retain the
    // picker's earlier support for constraints written in its display format.
    const minDate = this.parseDate(this.min);
    if (minDate && normalized < minDate) return false;
    const maxDate = this.parseDate(this.max);
    if (maxDate && normalized > maxDate) return false;
    return true;
  }

  private getDaysGrid() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Calculate starting position based on first day of week preference
    let startingDayOfWeek = firstDay.getDay() - this.firstDayOfWeek;
    if (startingDayOfWeek < 0) startingDayOfWeek += 7;

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

    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(html`<div class="day day--empty" role="gridcell" aria-hidden="true"></div>`);
    }

    const focused = this.getFocusedCalendarDate();
    const isFocused = (date: Date) =>
      date.getDate() === focused.getDate() &&
      date.getMonth() === focused.getMonth() &&
      date.getFullYear() === focused.getFullYear();

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const classes = ['day'];

      if (isToday(date)) classes.push('day--today');
      if (isSelected(date)) classes.push('day--selected');
      if (!this.isDateInRange(date)) classes.push('day--disabled');

      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const selectedValue = isSelected(date) ? 'true' : 'false';
      const currentValue = isToday(date) ? 'date' : 'false';
      const tabindexValue = isFocused(date) ? '0' : '-1';

      days.push(html`
        <button
          class="${classes.join(' ')}"
          type="button"
          role="gridcell"
          data-date="${dateStr}"
          .disabled=${!this.isDateInRange(date)}
          aria-label="${this.formatDate(date)}"
          aria-selected="${selectedValue}"
          aria-current="${currentValue}"
          tabindex="${tabindexValue}"
        >
          ${day}
        </button>
      `);
    }

    return days;
  }

  private updateInputValue() {
    if (this.selectedDate) this.inputValue = this.formatDate(this.selectedDate);
    this.syncNativeInput();
    this.syncFormState();
    this.updateClearButton();
  }

  private get interactionDisabled() {
    return this.disabled || this.formDisabled || this.loading;
  }

  private syncNativeInput() {
    if (this.input) {
      if (this.input.value !== this.inputValue) this.input.value = this.inputValue;
      this.input.disabled = this.interactionDisabled;
      this.input.readOnly = this.readonly;
      this.input.required = this.required;
      this.input.name = this.name;
      this.input.setAttribute('aria-invalid', String(this.invalid || this.constraintInvalid));
    }
    if (this.calendarToggle) this.calendarToggle.disabled = this.interactionDisabled;
    if (this.clearButton) this.clearButton.disabled = this.interactionDisabled || this.readonly;
  }

  private updateClearButton() {
    if (!this.clearButton) return;

    const shouldShow = Boolean(this.inputValue) && this.clearable && !this.interactionDisabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
    this.clearButton.classList.toggle('clear-button--visible', shouldShow);
    this.clearButton.disabled = this.interactionDisabled || this.readonly;
  }

  private updateCalendarGrid() {
    // Trigger full re-render instead of manual DOM manipulation
    this.render();
  }

  private clickOutsideHandler = (e: MouseEvent) => {
    if (!this.open) return;
    if (e.composedPath().includes(this)) return;
    this.hide();
  };

  private setupCalendarClickOutside() {
    document.addEventListener('click', this.clickOutsideHandler);
  }

  @reconnect()
  private onReconnect() {
    this.setupCalendarClickOutside();
    this.labelAssociation.connect();
  }

  @dispose()
  private cleanupClickOutside() {
    document.removeEventListener('click', this.clickOutsideHandler);
    this.labelAssociation.disconnect();
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setValueFromInput(input.value, true);
    this.dispatchInputEvent();
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const date = this.parseDate(input.value);
    if (date) {
      this.commitDateState(date, this.formatDate(date), true);
    } else {
      this.setValueFromInput(input.value, true);
    }

    this.dispatchChangeEvent();
  }

  private handleFocus(e: Event) {
    this.dispatchFocusEvent();
  }

  private handleInputClick(e: Event) {
    if (!this.open && !this.interactionDisabled && !this.readonly) {
      this.show();
    }
  }

  private handleBlur(e: Event) {
    this.dispatchBlurEvent();
  }

  private handleCalendarToggle(e: Event) {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  private handleClear(e: Event) {
    this.clear();
  }

  private handleCalendarClick(e: Event) {
    e.stopPropagation();
    const target = e.target as HTMLElement;

    if (target.closest('[data-year]')) {
      const year = parseInt(target.closest('[data-year]')!.getAttribute('data-year')!, 10);
      this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
      this.calendarView = 'days';
      this.updateCalendarGrid();
      return;
    }

    if (target.closest('[data-date]')) {
      const dateString = target.closest('[data-date]')?.getAttribute('data-date');
      if (dateString) {
        const date = this.parseCanonicalDate(dateString);
        if (date && this.isDateInRange(date)) this.selectDate(date);
      }
    } else if (target.closest('[data-nav]')) {
      const nav = target.closest('[data-nav]')?.getAttribute('data-nav');
      this.handleNavigation(nav!);
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.open) {
        this.show();
      }
    } else if (e.key === 'Escape' && this.open) {
      this.hide();
      this.focus();
    } else if (this.open && this.calendarView === 'days') {
      // Arrow / Home / End / PageUp / PageDown navigation over the day grid.
      const delta = this.dayGridDelta(e.key);
      if (delta === null) return;
      e.preventDefault();
      const current = this.getFocusedCalendarDate();
      const next = new Date(current);
      if (typeof delta === 'number') {
        next.setDate(current.getDate() + delta);
      } else if (delta === 'month+') {
        next.setMonth(current.getMonth() + 1);
      } else if (delta === 'month-') {
        next.setMonth(current.getMonth() - 1);
      } else if (delta === 'year+') {
        next.setFullYear(current.getFullYear() + 1);
      } else if (delta === 'year-') {
        next.setFullYear(current.getFullYear() - 1);
      }
      this.viewDate = next;
      this.updateCalendarGrid();
      this.focusCalendarDate(next);
    }
  }

  private dayGridDelta(key: string): number | 'month+' | 'month-' | 'year+' | 'year-' | null {
    switch (key) {
      case 'ArrowLeft': return -1;
      case 'ArrowRight': return 1;
      case 'ArrowUp': return -7;
      case 'ArrowDown': return 7;
      case 'Home': {
        const d = this.getFocusedCalendarDate();
        return -d.getDay();
      }
      case 'End': {
        const d = this.getFocusedCalendarDate();
        return 6 - d.getDay();
      }
      case 'PageUp':
        return 'month-';
      case 'PageDown':
        return 'month+';
    }
    return null;
  }

  private getFocusedCalendarDate(): Date {
    const focused = this.shadowRoot?.querySelector('[data-date]:focus') as HTMLElement | null;
    if (focused) {
      const dateStr = focused.getAttribute('data-date');
      if (dateStr) return new Date(dateStr + 'T00:00:00');
    }
    if (this.selectedDate) return new Date(this.selectedDate);
    return new Date(this.viewDate);
  }

  private focusCalendarDate(date: Date) {
    requestAnimationFrame(() => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const btn = this.shadowRoot?.querySelector(`[data-date="${dateStr}"]`) as HTMLElement | null;
      btn?.focus();
    });
  }

  private handleNavigation(nav: string) {
    switch (nav) {
      case 'prev-month':
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.updateCalendarGrid();
        break;
      case 'next-month':
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.updateCalendarGrid();
        break;
      case 'today':
        this.calendarView = 'days';
        this.goToToday();
        break;
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

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  // Manual DOM manipulation required since Snice is imperative
  @watch('open')
  handleOpenChange() {
    if (this.calendar) {
      if (this.open) {
        this.calendar.removeAttribute('hidden');
        this.positionCalendar();
        if (typeof this.calendar.showPopover === 'function') {
          this.calendar.showPopover();
        }
        this.dispatchOpenEvent();
        // Focus selected date or first available date for accessibility
        setTimeout(() => {
          (this.selectedDayButton || this.firstDayButton)?.focus();
        }, 100);
      } else {
        this.calendar.setAttribute('hidden', '');
        if (typeof this.calendar.hidePopover === 'function') {
          this.calendar.hidePopover();
        }
        this.dispatchCloseEvent();
      }
    }
  }

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    if (this.interactionDisabled && this.open) this.hide();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.readonly && this.open) this.hide();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('name', 'required', 'min', 'max', { immediate: false })
  handleFormConstraintChange() {
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
      const displayedInvalid = this.invalid || this.constraintInvalid;
      this.input.setAttribute('aria-invalid', String(displayedInvalid));
      this.input.classList.toggle('input--invalid', displayedInvalid);
    }
  }

  @watch('format')
  handleFormatChange() {
    this.updateInputValue();
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) {
      this.validationInput = document.createElement('input');
      this.validationInput.type = 'date';
    }
    return this.validationInput;
  }

  private syncFormState() {
    if (this.internals) {
      // Empty controls remain successful controls (`name=` submits ""), while
      // the restore state keeps the exact visible text for history/autofill.
      this.internals.setFormValue(this.value, this.inputValue);
    }
    this.syncValidity();
  }

  private syncValidity() {
    const proxy = this.validationProxy;
    // Loading blocks interaction but preserves the date picker's established
    // form-submission and constraint-validation participation.
    proxy.disabled = this.disabled || this.formDisabled;
    proxy.readOnly = this.readonly;
    proxy.required = this.required;
    const minDate = this.parseDate(this.min);
    const maxDate = this.parseDate(this.max);
    proxy.min = minDate ? this.toCanonicalDate(minDate) : '';
    proxy.max = maxDate ? this.toCanonicalDate(maxDate) : '';
    proxy.value = this.value;
    proxy.setCustomValidity(this.customValidationMessage);

    const barred = proxy.disabled || proxy.readOnly;
    const badInput = !barred && Boolean(this.inputValue) && !this.selectedDate;
    const nativeValidity = proxy.validity;
    const flags: ValidityStateFlags = barred ? {} : {
      badInput,
      customError: nativeValidity.customError,
      patternMismatch: nativeValidity.patternMismatch,
      rangeOverflow: nativeValidity.rangeOverflow,
      rangeUnderflow: nativeValidity.rangeUnderflow,
      stepMismatch: nativeValidity.stepMismatch,
      tooLong: nativeValidity.tooLong,
      tooShort: nativeValidity.tooShort,
      typeMismatch: nativeValidity.typeMismatch,
      valueMissing: nativeValidity.valueMissing
    };
    const hasError = Object.values(flags).some(Boolean);
    const message = this.customValidationMessage ||
      (badInput ? 'Please enter a valid date.' : proxy.validationMessage) ||
      (hasError ? 'Please enter a valid date.' : '');

    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;
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

  @dispatch('datepicker-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, datePicker: this };
  }

  @dispatch('datepicker-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { 
      value: this.value,
      date: this.selectedDate,
      formatted: this.selectedDate ? this.formatDate(this.selectedDate) : '',
      iso: this.value,
      datePicker: this 
    };
  }

  @dispatch('datepicker-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { datePicker: this };
  }

  @dispatch('datepicker-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { datePicker: this };
  }

  @dispatch('datepicker-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { datePicker: this };
  }

  @dispatch('datepicker-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { datePicker: this };
  }

  @dispatch('datepicker-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return { datePicker: this };
  }

  @dispatch('datepicker-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(date: Date) {
    return { 
      date,
      formatted: this.formatDate(date),
      iso: this.toCanonicalDate(date),
      datePicker: this 
    };
  }

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  clear() {
    this.commitDateState(null, '', true);
    this.dispatchClearEvent();
    this.dispatchChangeEvent();
    this.focus();
  }

  show() {
    if (!this.interactionDisabled && !this.readonly) {
      this.open = true;
      this.calendarView = 'days';
      if (this.selectedDate) {
        this.viewDate = new Date(this.selectedDate);
      }
      this.updateCalendarGrid();

      if (this.calendar) {
        this.calendar.removeAttribute('hidden');
        this.positionCalendar();
        if (typeof this.calendar.showPopover === 'function') {
          this.calendar.showPopover();
        }
      }
      this.dispatchOpenEvent();
    }
  }

  hide() {
    this.open = false;

    if (this.calendar) {
      this.calendar.setAttribute('hidden', '');
      if (typeof this.calendar.hidePopover === 'function') {
        this.calendar.hidePopover();
      }
    }
    this.dispatchCloseEvent();
  }

  private positionCalendar() {
    if (!this.calendar || CSS.supports('position-anchor', '--a')) return;
    const container = this.shadowRoot?.querySelector('.input-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.calendar.style.top = `${rect.bottom + 4}px`;
    this.calendar.style.left = `${rect.left}px`;
    this.calendar.style.minWidth = `${rect.width}px`;
  }

  selectDate(date: Date) {
    const normalized = date instanceof Date
      ? this.createLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      : null;
    if (!normalized) {
      this.commitDateState(null, '', true);
      this.dispatchChangeEvent();
      return;
    }

    this.commitDateState(normalized, this.formatDate(normalized), true);
    this.dispatchSelectEvent(normalized);
    this.dispatchChangeEvent();
    this.hide();
    this.focus();
  }

  goToMonth(year: number, month: number) {
    this.viewDate = new Date(year, month, 1);
    this.updateCalendarGrid();
  }

  goToToday() {
    const today = new Date();
    this.selectDate(today);
  }

  /** Native-compatible control type. @public */
  get type(): 'date' {
    return 'date' as const;
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

  /** Whether this date picker participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.disabled || this.formDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with this date picker. @public */
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
