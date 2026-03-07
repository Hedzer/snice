import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-time-picker.css?inline';
import type { TimePickerFormat, TimePickerStep, TimePickerVariant, TimePickerSize, SniceTimePickerElement } from './snice-time-picker.types';

@element('snice-time-picker', { formAssociated: true })
export class SniceTimePicker extends HTMLElement implements SniceTimePickerElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property()
  value = '';

  @property()
  format: TimePickerFormat = '24h';

  @property({ type: Number })
  step: TimePickerStep = 15;

  @property({ attribute: 'min-time' })
  minTime = '';

  @property({ attribute: 'max-time' })
  maxTime = '';

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
  variant: TimePickerVariant = 'dropdown';

  @property()
  size: TimePickerSize = 'medium';

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  clearable = false;

  @property({ type: Boolean, attribute: 'show-dropdown' })
  private showDropdown = false;

  @query('.input')
  input?: HTMLInputElement;

  @query('.dropdown')
  dropdown?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private period: 'AM' | 'PM' = 'AM';

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  renderContent() {
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const isInline = this.variant === 'inline';
    const inputClasses = [
      'input',
      `input--${this.size}`,
      this.invalid ? 'input--invalid' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');
    const isDisabledOrLoading = this.disabled || this.loading;

    return html/*html*/`
      <div class="time-picker-wrapper" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" part="label">${this.label}</label>
        </if>

        <if ${!isInline}>
          <div class="input-container">
            <input
              class="${inputClasses}"
              type="text"
              value="${this.getFormattedValue()}"
              placeholder="${this.placeholder || this.getPlaceholder()}"
              ?disabled=${isDisabledOrLoading}
              ?readonly=${this.readonly}
              ?required=${this.required}
              name="${this.name || ''}"
              part="input"
              autocomplete="off"
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
              @click=${this.handleInputClick}
              @keydown=${this.handleKeydown}
              @input=${this.handleInputChange}
            />

            <button
              class="clock-toggle"
              type="button"
              aria-label="Open time picker"
              tabindex="-1"
              part="toggle"
              ?disabled=${isDisabledOrLoading}
              @click=${this.handleToggle}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
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

            <if ${this.loading}>
              <span class="spinner" part="spinner"></span>
            </if>
          </div>
        </if>

        <div class="dropdown ${isInline ? 'dropdown--inline' : ''}" part="dropdown" popover="manual" ?hidden=${!isInline && !this.showDropdown}>
          ${this.renderTimeSelectors()}
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

  private renderTimeSelectors() {
    const hourOptions = this.getHourOptions();
    const minuteOptions = this.getMinuteOptions();
    const secondOptions = this.getSecondOptions();

    return html/*html*/`
      <div class="selectors">
        <div class="selector-column" part="hours">
          <div class="selector-label">Hr</div>
          <div class="selector-list" @click=${(e: Event) => this.handleHourClick(e)}>
            ${hourOptions.map(h => {
              const isSelected = h.value === this.hours;
              return html`
                <button
                  class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                  type="button"
                  data-hour="${h.value}"
                  ?disabled=${h.disabled}
                >${h.label}</button>
              `;
            })}
          </div>
        </div>

        <div class="selector-column" part="minutes">
          <div class="selector-label">Min</div>
          <div class="selector-list" @click=${(e: Event) => this.handleMinuteClick(e)}>
            ${minuteOptions.map(m => {
              const isSelected = m.value === this.minutes;
              return html`
                <button
                  class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                  type="button"
                  data-minute="${m.value}"
                  ?disabled=${m.disabled}
                >${m.label}</button>
              `;
            })}
          </div>
        </div>

        <if ${this.showSeconds}>
          <div class="selector-column" part="seconds">
            <div class="selector-label">Sec</div>
            <div class="selector-list" @click=${(e: Event) => this.handleSecondClick(e)}>
              ${secondOptions.map(s => {
                const isSelected = s.value === this.seconds;
                return html`
                  <button
                    class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                    type="button"
                    data-second="${s.value}"
                  >${s.label}</button>
                `;
              })}
            </div>
          </div>
        </if>

        <if ${this.format === '12h'}>
          <div class="selector-column selector-column--period" part="period">
            <div class="selector-label">Period</div>
            <div class="selector-list">
              <button
                class="selector-item ${this.period === 'AM' ? 'selector-item--selected' : ''}"
                type="button"
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="selector-item ${this.period === 'PM' ? 'selector-item--selected' : ''}"
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
    queueMicrotask(() => this.updateClearButton());
  }

  private parseValue() {
    if (!this.value) return;

    const parts = this.value.split(':');
    if (parts.length >= 2) {
      this.hours = parseInt(parts[0], 10) || 0;
      this.minutes = parseInt(parts[1], 10) || 0;
      this.seconds = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;

      if (this.format === '12h') {
        if (this.hours >= 12) {
          this.period = 'PM';
          if (this.hours > 12) this.hours -= 12;
        } else {
          this.period = 'AM';
          if (this.hours === 0) this.hours = 12;
        }
      }
    }
  }

  private getFormattedValue(): string {
    if (!this.value) return '';

    if (this.format === '12h') {
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
    if (this.format === '12h') {
      return this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM';
    }
    return this.showSeconds ? 'HH:MM:SS' : 'HH:MM';
  }

  private get24HourValue(): string {
    let h = this.hours;
    if (this.format === '12h') {
      if (this.period === 'AM' && h === 12) h = 0;
      else if (this.period === 'PM' && h !== 12) h += 12;
    }
    const base = `${h.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}`;
    if (this.showSeconds) {
      return `${base}:${this.seconds.toString().padStart(2, '0')}`;
    }
    return base;
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  private isTimeInRange(hours: number, minutes: number): boolean {
    const timeMinutes = hours * 60 + minutes;
    if (this.minTime) {
      const minMinutes = this.timeToMinutes(this.minTime);
      if (timeMinutes < minMinutes) return false;
    }
    if (this.maxTime) {
      const maxMinutes = this.timeToMinutes(this.maxTime);
      if (timeMinutes > maxMinutes) return false;
    }
    return true;
  }

  private getHourOptions() {
    const options = [];
    const max = this.format === '12h' ? 12 : 23;
    const start = this.format === '12h' ? 1 : 0;

    for (let h = start; h <= max; h++) {
      let actual24h = h;
      if (this.format === '12h') {
        if (this.period === 'AM' && h === 12) actual24h = 0;
        else if (this.period === 'PM' && h !== 12) actual24h = h + 12;
        else actual24h = h;
      }

      const disabled = !this.isTimeInRange(actual24h, 0) && !this.isTimeInRange(actual24h, 59);
      const label = this.format === '12h' ? String(h) : h.toString().padStart(2, '0');

      options.push({ value: h, label, disabled });
    }
    return options;
  }

  private getMinuteOptions() {
    const options = [];
    for (let m = 0; m < 60; m += this.step) {
      let actualHour = this.hours;
      if (this.format === '12h') {
        if (this.period === 'AM' && actualHour === 12) actualHour = 0;
        else if (this.period === 'PM' && actualHour !== 12) actualHour += 12;
      }
      const disabled = !this.isTimeInRange(actualHour, m);
      options.push({ value: m, label: m.toString().padStart(2, '0'), disabled });
    }
    return options;
  }

  private getSecondOptions() {
    const options = [];
    for (let s = 0; s < 60; s += this.step) {
      options.push({ value: s, label: s.toString().padStart(2, '0'), disabled: false });
    }
    return options;
  }

  private handleHourClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-hour]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.hours = parseInt(target.getAttribute('data-hour')!, 10);
    this.updateValue();
  }

  private handleMinuteClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-minute]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.minutes = parseInt(target.getAttribute('data-minute')!, 10);
    this.updateValue();
  }

  private handleSecondClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-second]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.seconds = parseInt(target.getAttribute('data-second')!, 10);
    this.updateValue();
  }

  private setPeriod(period: 'AM' | 'PM') {
    this.period = period;
    this.updateValue();
  }

  private updateValue() {
    this.value = this.get24HourValue();
    if (this.input) {
      this.input.value = this.getFormattedValue();
    }
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
    this.updateClearButton();
    this.emitTimeChange();
  }

  private handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const parsed = this.parseTimeString(input.value);
    if (parsed) {
      this.hours = parsed.hours;
      this.minutes = parsed.minutes;
      this.seconds = parsed.seconds;
      this.period = parsed.period;
      this.value = this.get24HourValue();
      if (this.internals) {
        this.internals.setFormValue(this.value);
      }
      this.emitTimeChange();
    }
  }

  private parseTimeString(str: string): { hours: number; minutes: number; seconds: number; period: 'AM' | 'PM' } | null {
    str = str.trim();
    const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (match12) {
      return {
        hours: parseInt(match12[1], 10),
        minutes: parseInt(match12[2], 10),
        seconds: match12[3] ? parseInt(match12[3], 10) : 0,
        period: match12[4].toUpperCase() as 'AM' | 'PM',
      };
    }
    const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      return {
        hours: h,
        minutes: parseInt(match24[2], 10),
        seconds: match24[3] ? parseInt(match24[3], 10) : 0,
        period: h >= 12 ? 'PM' : 'AM',
      };
    }
    return null;
  }

  private handleFocus() {
    this.emitFocus();
  }

  private handleBlur() {
    this.emitBlur();
  }

  private handleInputClick() {
    if (!this.showDropdown && !this.disabled && !this.readonly) {
      this.open();
    }
  }

  private handleToggle() {
    if (this.showDropdown) {
      this.close();
    } else {
      this.open();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.showDropdown) {
      this.close();
      this.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!this.showDropdown) {
        e.preventDefault();
        this.open();
      }
    }
  }

  private setupClickOutside() {
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node) && this.showDropdown) {
        this.close();
      }
    });
  }

  @watch('value')
  handleValueChange() {
    this.parseValue();
    if (this.input) {
      this.input.value = this.getFormattedValue();
    }
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('show-dropdown')
  handleShowDropdownChange() {
    if (this.dropdown) {
      if (this.showDropdown) {
        this.dropdown.removeAttribute('hidden');
        this.positionDropdown();
        this.dropdown.classList.add('dropdown--open');
        if (typeof this.dropdown.showPopover === 'function') {
          this.dropdown.showPopover();
        }
        this.emitOpen();
        // Scroll selected items into view
        queueMicrotask(() => this.scrollSelectedIntoView());
      } else {
        this.dropdown.classList.remove('dropdown--open');
        if (typeof this.dropdown.hidePopover === 'function') {
          this.dropdown.hidePopover();
        }
        this.dropdown.setAttribute('hidden', '');
        this.emitClose();
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
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

  private scrollSelectedIntoView() {
    const selectedItems = this.shadowRoot?.querySelectorAll('.selector-item--selected');
    selectedItems?.forEach(item => {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  @dispatch('time-change', { bubbles: true, composed: true })
  private emitTimeChange() {
    let h = this.hours;
    if (this.format === '12h') {
      if (this.period === 'AM' && h === 12) h = 0;
      else if (this.period === 'PM' && h !== 12) h += 12;
    }
    return {
      value: this.value,
      hours: h,
      minutes: this.minutes,
      seconds: this.seconds,
      formatted: this.getFormattedValue(),
      timePicker: this,
    };
  }

  @dispatch('timepicker-focus', { bubbles: true, composed: true })
  private emitFocus() {
    return { timePicker: this };
  }

  @dispatch('timepicker-blur', { bubbles: true, composed: true })
  private emitBlur() {
    return { timePicker: this };
  }

  @dispatch('timepicker-open', { bubbles: true, composed: true })
  private emitOpen() {
    return { timePicker: this };
  }

  @dispatch('timepicker-close', { bubbles: true, composed: true })
  private emitClose() {
    return { timePicker: this };
  }

  @dispatch('timepicker-clear', { bubbles: true, composed: true })
  private emitClear() {
    return { timePicker: this };
  }

  private handleClear(e: Event) {
    e.stopPropagation();
    this.clear();
  }

  private updateClearButton() {
    if (!this.clearButton || !this.clearable) return;
    const shouldShow = this.value && !this.disabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
  }

  // Public API

  open() {
    if (!this.disabled && !this.readonly && this.variant === 'dropdown') {
      this.showDropdown = true;
      if (this.dropdown) {
        this.dropdown.removeAttribute('hidden');
        this.positionDropdown();
        this.dropdown.classList.add('dropdown--open');
        if (typeof this.dropdown.showPopover === 'function') {
          this.dropdown.showPopover();
        }
      }
      this.emitOpen();
    }
  }

  close() {
    this.showDropdown = false;
    if (this.dropdown) {
      this.dropdown.classList.remove('dropdown--open');
      if (typeof this.dropdown.hidePopover === 'function') {
        this.dropdown.hidePopover();
      }
      this.dropdown.setAttribute('hidden', '');
    }
    this.emitClose();
  }

  private positionDropdown() {
    if (!this.dropdown || CSS.supports('position-anchor', '--a')) return;
    const container = this.shadowRoot?.querySelector('.input-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.dropdown.style.top = `${rect.bottom + 2}px`;
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.minWidth = `${rect.width}px`;
  }

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  clear() {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.period = 'AM';
    this.value = '';
    if (this.input) {
      this.input.value = '';
    }
    this.updateClearButton();
    this.emitClear();
    this.emitTimeChange();
    this.focus();
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
