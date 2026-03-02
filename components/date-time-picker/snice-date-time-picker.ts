import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-date-time-picker.css?inline';
import type { DateTimePickerVariant, DateTimePickerTimeFormat, SniceDateTimePickerElement } from './snice-date-time-picker.types';

@element('snice-date-time-picker', { formAssociated: true })
export class SniceDateTimePicker extends HTMLElement implements SniceDateTimePickerElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property()
  value = '';

  @property({ attribute: 'date-format' })
  dateFormat = 'yyyy-mm-dd';

  @property({ attribute: 'time-format' })
  timeFormat: DateTimePickerTimeFormat = '24h';

  @property()
  min = '';

  @property()
  max = '';

  @property({ type: Boolean, attribute: 'show-seconds' })
  showSeconds = false;

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

  @query('.panel')
  panel?: HTMLElement;

  // Internal state
  private selectedDate: Date | null = null;
  private viewDate = new Date();
  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private period: 'AM' | 'PM' = 'AM';

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
    const isInline = this.variant === 'inline';

    return html/*html*/`
      <div class="datetime-wrapper" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" part="label">${this.label}</label>
        </if>

        <if ${!isInline}>
          <div class="input-container">
            <input
              class="input ${this.invalid ? 'input--invalid' : ''}"
              type="text"
              value="${this.getDisplayValue()}"
              placeholder="${this.placeholder || this.getPlaceholder()}"
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              name="${this.name || ''}"
              part="input"
              autocomplete="off"
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
              ?disabled=${this.disabled}
              @click=${this.handleToggle}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </if>

        <div class="panel ${isInline ? 'panel--inline' : ''}" part="panel" ?hidden=${!isInline && !this.showPanel}>
          <div class="panel-calendar" part="calendar">
            ${this.renderCalendar()}
          </div>
          <div class="panel-time" part="time">
            ${this.renderTimeSelectors()}
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

  private renderCalendar() {
    return html/*html*/`
      <div class="calendar-header">
        <button class="nav-button" type="button" aria-label="Previous month" @click=${this.prevMonth}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
          </svg>
        </button>

        <div class="calendar-title">
          ${this.monthNames[this.viewDate.getMonth()]} ${this.viewDate.getFullYear()}
        </div>

        <button class="nav-button" type="button" aria-label="Next month" @click=${this.nextMonth}>
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

      <div class="calendar-footer">
        <button class="today-button" type="button" @click=${this.goToToday}>Today</button>
      </div>
    `;
  }

  private renderTimeSelectors() {
    const hourMax = this.timeFormat === '12h' ? 12 : 23;
    const hourStart = this.timeFormat === '12h' ? 1 : 0;

    return html/*html*/`
      <div class="time-header">Time</div>
      <div class="time-selectors">
        <div class="time-column">
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
                >${this.timeFormat === '12h' ? String(h) : h.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <div class="time-column">
          <label class="time-label">Min</label>
          <div class="time-list" @click=${(e: Event) => this.handleMinuteClick(e)}>
            ${Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
              const isSelected = m === this.minutes;
              return html`
                <button
                  class="time-item ${isSelected ? 'time-item--selected' : ''}"
                  type="button"
                  data-minute="${m}"
                >${m.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <if ${this.showSeconds}>
          <div class="time-column">
            <label class="time-label">Sec</label>
            <div class="time-list" @click=${(e: Event) => this.handleSecondClick(e)}>
              ${Array.from({ length: 12 }, (_, i) => i * 5).map(s => {
                const isSelected = s === this.seconds;
                return html`
                  <button
                    class="time-item ${isSelected ? 'time-item--selected' : ''}"
                    type="button"
                    data-second="${s}"
                  >${s.toString().padStart(2, '0')}</button>
                `;
              })}
            </div>
          </div>
        </if>

        <if ${this.timeFormat === '12h'}>
          <div class="time-column time-column--period">
            <label class="time-label">Period</label>
            <div class="time-list">
              <button
                class="time-item ${this.period === 'AM' ? 'time-item--selected' : ''}"
                type="button"
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="time-item ${this.period === 'PM' ? 'time-item--selected' : ''}"
                type="button"
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
    this.parseValue();
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
    this.setupClickOutside();
  }

  private parseValue() {
    if (!this.value) return;

    // Try to parse as ISO datetime (YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS)
    const match = this.value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
      this.selectedDate = new Date(
        parseInt(yearStr, 10),
        parseInt(monthStr, 10) - 1,
        parseInt(dayStr, 10)
      );
      this.viewDate = new Date(this.selectedDate);
      this.hours = parseInt(hourStr, 10);
      this.minutes = parseInt(minuteStr, 10);
      this.seconds = secondStr ? parseInt(secondStr, 10) : 0;

      if (this.timeFormat === '12h') {
        if (this.hours >= 12) {
          this.period = 'PM';
        } else {
          this.period = 'AM';
        }
      }
    }
  }

  private getDisplayValue(): string {
    if (!this.selectedDate) return this.value;

    const datePart = this.formatDatePart(this.selectedDate);
    const timePart = this.formatTimePart();
    return `${datePart} ${timePart}`;
  }

  private formatDatePart(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');

    switch (this.dateFormat) {
      case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
      case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
      case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
      case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
      case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
      case 'yyyy-mm-dd':
      default: return `${yyyy}-${mm}-${dd}`;
    }
  }

  private formatTimePart(): string {
    if (this.timeFormat === '12h') {
      const displayHour = this.hours === 0 ? 12 : this.hours > 12 ? this.hours - 12 : this.hours;
      const period = this.hours >= 12 ? 'PM' : 'AM';
      const base = `${displayHour}:${this.minutes.toString().padStart(2, '0')}`;
      if (this.showSeconds) {
        return `${base}:${this.seconds.toString().padStart(2, '0')} ${period}`;
      }
      return `${base} ${period}`;
    }

    const base = `${this.hours.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}`;
    if (this.showSeconds) {
      return `${base}:${this.seconds.toString().padStart(2, '0')}`;
    }
    return base;
  }

  private getPlaceholder(): string {
    const datePh = this.dateFormat.toUpperCase();
    const timePh = this.timeFormat === '12h'
      ? (this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM')
      : (this.showSeconds ? 'HH:MM:SS' : 'HH:MM');
    return `${datePh} ${timePh}`;
  }

  private getISOValue(): string {
    if (!this.selectedDate) return '';
    const yyyy = this.selectedDate.getFullYear().toString();
    const mm = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = this.selectedDate.getDate().toString().padStart(2, '0');
    const hh = this.hours.toString().padStart(2, '0');
    const mi = this.minutes.toString().padStart(2, '0');
    const ss = this.seconds.toString().padStart(2, '0');

    if (this.showSeconds) {
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    }
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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

    const isDisabled = (date: Date) => {
      if (this.min) {
        const minDate = new Date(this.min);
        if (date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
      }
      if (this.max) {
        const maxDate = new Date(this.max);
        if (date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
      }
      return false;
    };

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
        >${day}</button>
      `);
    }

    return days;
  }

  // Event handlers

  private handleFocus() {
    this.emitFocus();
  }

  private handleBlur() {
    this.emitBlur();
  }

  private handleInputClick() {
    if (!this.showPanel && !this.disabled && !this.readonly) {
      this.open();
    }
  }

  private handleToggle() {
    if (this.showPanel) {
      this.close();
    } else {
      this.open();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.showPanel) {
      this.close();
      this.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && !this.showPanel) {
      e.preventDefault();
      this.open();
    }
  }

  private handleDayClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-date]');
    if (!target || (target as HTMLButtonElement).disabled) return;

    const dateStr = target.getAttribute('data-date')!;
    const [year, month, day] = dateStr.split('-').map(Number);
    this.selectedDate = new Date(year, month - 1, day);
    this.viewDate = new Date(this.selectedDate);
    this.updateValue();
  }

  private handleHourClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-hour]');
    if (!target) return;
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
    const target = (e.target as HTMLElement).closest('[data-minute]');
    if (!target) return;
    this.minutes = parseInt(target.getAttribute('data-minute')!, 10);
    this.updateValue();
  }

  private handleSecondClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-second]');
    if (!target) return;
    this.seconds = parseInt(target.getAttribute('data-second')!, 10);
    this.updateValue();
  }

  private setPeriod(period: 'AM' | 'PM') {
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
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.renderContent();
  }

  private nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.renderContent();
  }

  private goToToday() {
    const today = new Date();
    this.selectedDate = today;
    this.viewDate = new Date(today);
    this.updateValue();
  }

  private updateValue() {
    this.value = this.getISOValue();
    if (this.input) {
      this.input.value = this.getDisplayValue();
    }
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
    this.emitDateTimeChange();
    this.renderContent();
  }

  private setupClickOutside() {
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node) && this.showPanel) {
        this.close();
      }
    });
  }

  // Watchers

  @watch('value')
  handleValueChange() {
    this.parseValue();
    if (this.input) {
      this.input.value = this.getDisplayValue();
    }
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('show-panel')
  handleShowPanelChange() {
    if (this.panel) {
      if (this.showPanel) {
        this.panel.removeAttribute('hidden');
        this.emitOpen();
      } else {
        this.panel.setAttribute('hidden', '');
        this.emitClose();
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
      this.input.classList.toggle('input--invalid', this.invalid);
    }
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
    if (!this.disabled && !this.readonly && this.variant === 'dropdown') {
      this.showPanel = true;
      if (this.panel) {
        this.panel.removeAttribute('hidden');
      }
      this.emitOpen();
    }
  }

  close() {
    this.showPanel = false;
    if (this.panel) {
      this.panel.setAttribute('hidden', '');
    }
    this.emitClose();
  }

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }
}
