import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-date-picker.css?inline';
import type { DatePickerSize, DatePickerVariant, DateFormat, SniceDatePickerElement, DatePickerValue } from './snice-date-picker.types';

@element('snice-date-picker')
export class SniceDatePicker extends HTMLElement implements SniceDatePickerElement {
  @property({  })
  size: DatePickerSize = 'medium';

  @property({  })
  variant: DatePickerVariant = 'outlined';

  @property({  })
  value = '';

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

  @property({ type: Boolean, attribute: 'show-calendar',  })
  showCalendar = false;

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
  private viewDate = new Date();
  
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
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      this.invalid ? 'input--invalid' : '',
      this.clearable ? 'input--clearable' : ''
    ].filter(Boolean).join(' ');

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
            value="${this.inputValue || this.getFormattedValue()}"
            placeholder="${this.placeholder || this.getPlaceholderForFormat()}"
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            name="${this.name || ''}"
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
            ?disabled=${this.disabled}
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
            @click=${(e: Event) => this.handleClear(e)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <div class="calendar" part="calendar" ?hidden=${!this.showCalendar} @click=${(e: Event) => this.handleCalendarClick(e)}>
            <div class="calendar-header">
              <button class="nav-button" type="button" data-nav="prev-month" aria-label="Previous month">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
              </button>

              <div class="calendar-title">
                <button class="month-button" type="button" data-nav="month-picker">
                  ${this.monthNames[this.viewDate.getMonth()]} ${this.viewDate.getFullYear()}
                </button>
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

            <div class="calendar-days">
              ${this.getDaysGrid()}
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
          <default>
            <span class="helper-text" part="helper-text">&nbsp;</span>
          </default>
        </case>
      </div>
    `;
  }

  @ready()
  init() {
    this.parseInitialValue();
    this.updateClearButton();
    this.setupCalendarClickOutside();

    if (this.input) {
      this.input.disabled = this.disabled;
      this.input.readOnly = this.readonly;
      this.input.required = this.required;

      if (this.invalid) {
        this.input.setAttribute('aria-invalid', 'true');
        this.input.classList.add('input--invalid');
      }
    }
  }

  private parseInitialValue() {
    if (this.value) {
      const date = this.parseDate(this.value);
      if (date) {
        this.selectedDate = date;
        this.viewDate = new Date(date);
        this.inputValue = this.formatDate(date);
      } else {
        this.inputValue = this.value;
      }
    }
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    if (this.format === 'mmmm dd, yyyy') {
      const monthNameRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/;
      const match = dateString.match(monthNameRegex);
      if (match) {
        const [, monthName, day, year] = match;
        const monthIndex = this.monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex >= 0) {
          const date = new Date(parseInt(year), monthIndex, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      return null;
    }

    // Detect ISO date format (yyyy-mm-dd) and parse manually to avoid UTC issues
    const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoMatch = dateString.match(isoDateRegex);
    if (isoMatch) {
      const [, year, month, day] = isoMatch.map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try manual parsing based on format
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
        if (!isNaN(date.getTime())) {
          return date;
        }
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

  private getFormattedValue(): string {
    return this.selectedDate ? this.formatDate(this.selectedDate) : this.value;
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

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(html`<div class="day day--empty"></div>`);
    }

    // Days of the month
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
          ?disabled="${isDisabled(date)}"
          aria-label="${this.formatDate(date)}"
        >
          ${day}
        </button>
      `);
    }

    return days;
  }

  private updateInputValue() {
    if (this.input && document.activeElement !== this.input) {
      const displayValue = this.getFormattedValue();
      this.input.value = displayValue;
      this.inputValue = displayValue;
    }
    this.updateClearButton();
  }

  private isCompleteDate(value: string): boolean {
    if (this.format === 'mmmm dd, yyyy') {
      return /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(value);
    }
    
    const separators = (value.match(/[\/\-]/g) || []).length;
    return separators >= 2 && value.length >= 8;
  }

  private updateClearButton() {
    if (this.clearButton && this.clearable) {
      const shouldShow = this.selectedDate && !this.disabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  private updateCalendarGrid() {
    // Trigger full re-render instead of manual DOM manipulation
    this.renderContent();
  }

  private setupCalendarClickOutside() {
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node) && this.showCalendar) {
        this.close();
      }
    });
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.inputValue = input.value;

    const date = this.parseDate(input.value);
    if (date && this.isCompleteDate(input.value)) {
      this.selectedDate = date;
      this.viewDate = new Date(date);
      if (this.showCalendar) {
        this.updateCalendarGrid();
      }
    }

    this.updateClearButton();
    this.dispatchInputEvent();
  }

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const date = this.parseDate(input.value);
    if (date) {
      this.selectedDate = date;
      this.value = this.formatDate(date);
      this.inputValue = this.value;
      if (this.input) {
        this.input.value = this.value;
      }
    } else if (input.value) {
      this.selectedDate = null;
      this.value = input.value;
      this.inputValue = input.value;
    } else {
      this.selectedDate = null;
      this.value = '';
      this.inputValue = '';
    }

    this.updateClearButton();
    this.dispatchChangeEvent();
  }

  private handleFocus(e: Event) {
    this.dispatchFocusEvent();
  }

  private handleInputClick(e: Event) {
    if (!this.showCalendar && !this.disabled && !this.readonly) {
      this.open();
    }
  }

  private handleBlur(e: Event) {
    this.dispatchBlurEvent();
  }

  private handleCalendarToggle(e: Event) {
    if (this.showCalendar) {
      this.close();
    } else {
      this.open();
    }
  }

  private handleClear(e: Event) {
    this.clear();
  }

  private handleCalendarClick(e: Event) {
    e.stopPropagation();
    const target = e.target as HTMLElement;

    if (target.closest('[data-date]')) {
      const dateString = target.closest('[data-date]')?.getAttribute('data-date');
      if (dateString) {
        // Parse as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        this.selectDate(date);
      }
    } else if (target.closest('[data-nav]')) {
      const nav = target.closest('[data-nav]')?.getAttribute('data-nav');
      this.handleNavigation(nav!);
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.showCalendar) {
        this.open();
      }
    } else if (e.key === 'Escape' && this.showCalendar) {
      this.close();
      this.focus();
    }
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
        this.goToToday();
        break;
    }
  }

  @watch('value')
  handleValueChange() {
    const date = this.parseDate(this.value);
    this.selectedDate = date;
    if (date) {
      this.viewDate = new Date(date);
    }
    this.updateInputValue();
    if (this.showCalendar) {
      this.updateCalendarGrid();
    }
  }

  // Manual DOM manipulation required since Snice is imperative
  @watch('show-calendar')
  handleShowCalendarChange() {
    console.log('showCalendar changed:', this.calendar);
    if (this.calendar) {
      if (this.showCalendar) {
        this.calendar.removeAttribute('hidden');
        this.dispatchOpenEvent();
        // Focus selected date or first available date for accessibility
        setTimeout(() => {
          (this.selectedDayButton || this.firstDayButton)?.focus();
        }, 100);
      } else {
        this.calendar.setAttribute('hidden', '');
        this.dispatchCloseEvent();
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    if (this.calendarToggle) {
      this.calendarToggle.disabled = this.disabled;
    }
    this.updateClearButton();
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.input) {
      this.input.readOnly = this.readonly;
    }
    this.updateClearButton();
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
      this.input.classList.toggle('input--invalid', this.invalid);
    }
  }

  @watch('format')
  handleFormatChange() {
    this.updateInputValue();
  }

  @dispatch('@snice/datepicker-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, datePicker: this };
  }

  @dispatch('@snice/datepicker-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { 
      value: this.value,
      date: this.selectedDate,
      formatted: this.selectedDate ? this.formatDate(this.selectedDate) : '',
      iso: this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : '',
      datePicker: this 
    };
  }

  @dispatch('@snice/datepicker-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { datePicker: this };
  }

  @dispatch('@snice/datepicker-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { datePicker: this };
  }

  @dispatch('@snice/datepicker-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { datePicker: this };
  }

  @dispatch('@snice/datepicker-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { datePicker: this };
  }

  @dispatch('@snice/datepicker-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return { datePicker: this };
  }

  @dispatch('@snice/datepicker-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(date: Date) {
    return { 
      date,
      formatted: this.formatDate(date),
      iso: date.toISOString().split('T')[0],
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
    this.selectedDate = null;
    this.value = '';
    this.updateInputValue();
    this.dispatchClearEvent();
    this.dispatchChangeEvent();
    this.focus();
  }

  open() {
    if (!this.disabled && !this.readonly) {
      this.showCalendar = true;
      if (this.selectedDate) {
        this.viewDate = new Date(this.selectedDate);
      }
      this.updateCalendarGrid();
      
      if (this.calendar) {
        this.calendar.removeAttribute('hidden');
      }
      this.dispatchOpenEvent();
    }
  }

  close() {
    this.showCalendar = false;
    
    if (this.calendar) {
      this.calendar.setAttribute('hidden', '');
    }
    this.dispatchCloseEvent();
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.value = this.formatDate(date);
    this.viewDate = new Date(date);
    this.updateInputValue();
    this.updateCalendarGrid();
    this.dispatchSelectEvent(date);
    this.dispatchChangeEvent();
    this.close();
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