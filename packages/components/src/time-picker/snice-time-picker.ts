import { element, property, state, query, watch, dispatch, ready, dispose, reconnect, render, styles, html, css } from 'snice';
import cssContent from './snice-time-picker.css?inline';
import type { TimePickerFormat, TimePickerStep, TimePickerVariant, TimePickerSize, SniceTimePickerElement } from './snice-time-picker.types';

interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

@element('snice-time-picker', { formAssociated: true })
export class SniceTimePicker extends HTMLElement implements SniceTimePickerElement {
  internals!: ElementInternals;

  private dirtyValue = false;
  private customValidationMessage = '';

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @state()
  private valueState = '';

  @state()
  private formDisabled = false;

  /**
   * Live canonical time value. Assigning it does not rewrite the authored
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

  @query('.input-container')
  inputContainer?: HTMLElement;

  @query('.dropdown')
  dropdown?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  private inputValue = '';
  private selectedParts: TimeParts | null = null;
  private validationInput?: HTMLInputElement;
  private hours = 0;
  private minutes = 0;
  private seconds = 0;
  private period: 'AM' | 'PM' = 'AM';

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  private get effectiveStep(): TimePickerStep {
    return ([1, 5, 10, 15, 30] as number[]).includes(this.step) ? this.step : 15;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  renderContent() {
    const interactionDisabled = this.interactionDisabled;
    const validityInvalid = this.hasValidationError();
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const isInline = this.variant === 'inline';
    const inputClasses = [
      'input',
      `input--${this.size}`,
      this.invalid || validityInvalid ? 'input--invalid' : '',
      this.loading ? 'input--loading' : ''
    ].filter(Boolean).join(' ');

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
              .value=${this.inputValue}
              .placeholder=${this.placeholder || this.getPlaceholder()}
              .disabled=${interactionDisabled}
              .readOnly=${this.readonly}
              .required=${this.required}
              aria-invalid="${this.invalid || validityInvalid ? 'true' : 'false'}"
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
              .disabled=${interactionDisabled || this.readonly}
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
          class="dropdown ${isInline ? 'dropdown--inline' : ''}"
          part="dropdown"
          .popover=${isInline ? null : 'manual'}
          ?hidden=${!isInline && !this.showDropdown}
        >
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
                  .disabled=${h.disabled || this.interactionDisabled || this.readonly}
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
                  .disabled=${m.disabled || this.interactionDisabled || this.readonly}
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
                    .disabled=${s.disabled || this.interactionDisabled || this.readonly}
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
                .disabled=${this.interactionDisabled || this.readonly || !this.periodIntersectsRange('AM')}
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="selector-item ${this.period === 'PM' ? 'selector-item--selected' : ''}"
                type="button"
                .disabled=${this.interactionDisabled || this.readonly || !this.periodIntersectsRange('PM')}
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
    queueMicrotask(() => {
      this.syncNativeInput();
      this.updateClearButton();
    });
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
    if (disabled && this.showDropdown) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    const displayParts = this.parseDisplayValue(state);
    if (displayParts) {
      this.commitTimeState(displayParts, this.toCanonicalTime(displayParts), state, true);
      return;
    }
    this.setValueFromString(state, true);
  }

  private applyDefaultValue() {
    this.setValueFromString(this.defaultValue, false);
  }

  private setValueFromString(value: unknown, dirty: boolean) {
    const candidate = String(value ?? '');
    const parts = this.parseCanonicalTime(candidate);
    const display = parts ? this.formatPartsForDisplay(parts) : candidate;
    this.commitTimeState(parts, candidate, display, dirty);
  }

  private setValueFromInput(inputValue: string, dirty: boolean) {
    const parts = this.parseDisplayValue(inputValue);
    const liveValue = parts ? this.toCanonicalTime(parts) : inputValue;
    this.commitTimeState(parts, liveValue, inputValue, dirty);
  }

  private commitTimeState(
    parts: TimeParts | null,
    liveValue: string,
    inputValue: string,
    dirty: boolean
  ) {
    if (dirty) this.dirtyValue = true;

    this.selectedParts = parts;
    this.inputValue = inputValue;
    this.valueState = liveValue;

    if (parts) {
      this.syncSelectorState(parts);
    } else {
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.period = 'AM';
    }

    this.syncNativeInput();
    this.syncFormState();
    this.updateClearButton();
  }

  private syncSelectorState(parts: TimeParts) {
    this.minutes = parts.minutes;
    this.seconds = parts.seconds;
    this.period = parts.hours >= 12 ? 'PM' : 'AM';
    this.hours = this.format === '12h' ? (parts.hours % 12 || 12) : parts.hours;
  }

  private parseCanonicalTime(value: string): TimeParts | null {
    const match = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    return this.createTimeParts(
      Number(match[1]),
      Number(match[2]),
      match[3] === undefined ? 0 : Number(match[3])
    );
  }

  private parseDisplayValue(value: string): TimeParts | null {
    const candidate = value.trim();
    if (!candidate) return null;

    if (this.format === '12h') {
      const match = candidate.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (!match || (this.showSeconds && match[3] === undefined)) return null;
      const displayHours = Number(match[1]);
      if (displayHours < 1 || displayHours > 12) return null;
      const period = match[4].toUpperCase();
      const hours = displayHours % 12 + (period === 'PM' ? 12 : 0);
      return this.createTimeParts(hours, Number(match[2]), match[3] === undefined ? 0 : Number(match[3]));
    }

    const match = candidate.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match || (this.showSeconds && match[3] === undefined)) return null;
    return this.createTimeParts(
      Number(match[1]),
      Number(match[2]),
      match[3] === undefined ? 0 : Number(match[3])
    );
  }

  private createTimeParts(hours: number, minutes: number, seconds: number): TimeParts | null {
    if (!Number.isInteger(hours) || hours < 0 || hours > 23 ||
        !Number.isInteger(minutes) || minutes < 0 || minutes > 59 ||
        !Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
      return null;
    }
    return { hours, minutes, seconds };
  }

  private formatPartsForDisplay(parts: TimeParts): string {
    const mm = parts.minutes.toString().padStart(2, '0');
    const ss = parts.seconds.toString().padStart(2, '0');

    if (this.format === '12h') {
      const period = parts.hours >= 12 ? 'PM' : 'AM';
      const displayHour = parts.hours % 12 || 12;
      const base = `${displayHour}:${mm}`;
      return this.showSeconds ? `${base}:${ss} ${period}` : `${base} ${period}`;
    }

    const base = `${parts.hours.toString().padStart(2, '0')}:${mm}`;
    return this.showSeconds ? `${base}:${ss}` : base;
  }

  private getFormattedValue(): string {
    return this.selectedParts ? this.formatPartsForDisplay(this.selectedParts) : this.inputValue;
  }

  private getPlaceholder(): string {
    if (this.format === '12h') {
      return this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM';
    }
    return this.showSeconds ? 'HH:MM:SS' : 'HH:MM';
  }

  private get24HourValue(): string {
    let hours = this.hours;
    if (this.format === '12h') {
      hours = hours % 12 + (this.period === 'PM' ? 12 : 0);
    }
    const parts = this.createTimeParts(hours, this.minutes, this.seconds);
    return parts ? this.toCanonicalTime(parts) : '';
  }

  private getCanonicalValue(): string {
    return this.selectedParts ? this.toCanonicalTime(this.selectedParts) : '';
  }

  private toCanonicalTime(parts: TimeParts): string {
    const hh = parts.hours.toString().padStart(2, '0');
    const mm = parts.minutes.toString().padStart(2, '0');
    const ss = parts.seconds.toString().padStart(2, '0');
    return this.showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  }

  private parseConstraint(value: string): TimeParts | null {
    return this.parseCanonicalTime(value);
  }

  private timeKey(parts: TimeParts): number {
    return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
  }

  private intervalIntersectsRange(start: number, end: number): boolean {
    const min = this.parseConstraint(this.minTime);
    const max = this.parseConstraint(this.maxTime);
    return (!min || end >= this.timeKey(min)) && (!max || start <= this.timeKey(max));
  }

  private isTimeInRange(hours: number, minutes: number, seconds = 0): boolean {
    const parts = this.createTimeParts(hours, minutes, seconds);
    if (!parts) return false;
    const key = this.timeKey(parts);
    return this.intervalIntersectsRange(key, key);
  }

  private periodIntersectsRange(period: 'AM' | 'PM'): boolean {
    return period === 'AM'
      ? this.intervalIntersectsRange(0, 11 * 3600 + 59 * 60 + 59)
      : this.intervalIntersectsRange(12 * 3600, 23 * 3600 + 59 * 60 + 59);
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

      const startOfHour = actual24h * 3600;
      const disabled = !this.intervalIntersectsRange(startOfHour, startOfHour + 3599);
      const label = this.format === '12h' ? String(h) : h.toString().padStart(2, '0');

      options.push({ value: h, label, disabled });
    }
    return options;
  }

  private getMinuteOptions() {
    const options = [];
    for (let m = 0; m < 60; m += this.effectiveStep) {
      let actualHour = this.hours;
      if (this.format === '12h') {
        if (this.period === 'AM' && actualHour === 12) actualHour = 0;
        else if (this.period === 'PM' && actualHour !== 12) actualHour += 12;
      }
      const startOfMinute = actualHour * 3600 + m * 60;
      const disabled = !this.intervalIntersectsRange(
        startOfMinute,
        startOfMinute + (this.showSeconds ? 59 : 0)
      );
      options.push({ value: m, label: m.toString().padStart(2, '0'), disabled });
    }
    return options;
  }

  private getSecondOptions() {
    const options = [];
    let actualHour = this.hours;
    if (this.format === '12h') {
      actualHour = actualHour % 12 + (this.period === 'PM' ? 12 : 0);
    }
    for (let s = 0; s < 60; s += this.effectiveStep) {
      options.push({
        value: s,
        label: s.toString().padStart(2, '0'),
        disabled: !this.isTimeInRange(actualHour, this.minutes, s)
      });
    }
    return options;
  }

  private handleHourClick(e: Event) {
    if (this.interactionDisabled || this.readonly) return;
    const target = (e.target as HTMLElement).closest('[data-hour]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    this.hours = parseInt(target.getAttribute('data-hour')!, 10);
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
    if (this.interactionDisabled || this.readonly || !this.periodIntersectsRange(period)) return;
    this.period = period;
    this.updateValue();
  }

  private updateValue() {
    const canonical = this.get24HourValue();
    const parts = this.parseCanonicalTime(canonical);
    if (!parts) return;
    this.commitTimeState(parts, canonical, this.formatPartsForDisplay(parts), true);
    this.emitTimeChange();
    this.renderContent();
  }

  private handleInputChange(e: Event) {
    if (this.interactionDisabled || this.readonly) {
      this.syncNativeInput();
      return;
    }
    const input = e.target as HTMLInputElement;
    this.setValueFromInput(input.value, true);
    if (this.selectedParts) this.emitTimeChange();
  }

  private handleFocus() {
    this.emitFocus();
  }

  private handleBlur() {
    this.emitBlur();
  }

  private handleInputClick() {
    if (!this.showDropdown && !this.interactionDisabled && !this.readonly) {
      this.open();
    }
  }

  private handleToggle() {
    if (this.interactionDisabled || this.readonly) return;
    if (this.showDropdown) {
      this.close();
    } else {
      this.open();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.interactionDisabled || this.readonly) return;
    if (e.key === 'Escape' && this.showDropdown) {
      this.close();
      this.focus();
    } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
      if (!this.showDropdown) {
        e.preventDefault();
        this.open();
      }
    }
  }

  private clickOutsideHandler = (e: MouseEvent) => {
    if (!this.showDropdown) return;
    if (e.composedPath().includes(this)) return;
    this.close();
  };

  private setupClickOutside() {
    document.addEventListener('click', this.clickOutsideHandler);
    window.addEventListener('resize', this.positionDropdownHandler);
    window.addEventListener('scroll', this.positionDropdownHandler, true);
  }

  @reconnect()
  private onReconnect() {
    this.setupClickOutside();
  }

  @dispose()
  private cleanupClickOutside() {
    document.removeEventListener('click', this.clickOutsideHandler);
    window.removeEventListener('resize', this.positionDropdownHandler);
    window.removeEventListener('scroll', this.positionDropdownHandler, true);
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('show-dropdown')
  handleShowDropdownChange() {
    if (this.dropdown) {
      if (this.showDropdown) {
        this.dropdown.removeAttribute('hidden');
        this.dropdown.classList.add('dropdown--open');
        if (typeof this.dropdown.showPopover === 'function') {
          this.dropdown.showPopover();
        }
        this.positionDropdown();
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

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    if (this.interactionDisabled && this.showDropdown) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('readonly', { immediate: false })
  handleReadonlyChange() {
    if (this.readonly && this.showDropdown) this.close();
    this.syncNativeInput();
    this.syncValidity();
    this.updateClearButton();
  }

  @watch('name', 'required', 'minTime', 'maxTime', 'step', { immediate: false })
  handleFormConstraintChange() {
    this.syncNativeInput();
    this.syncFormState();
  }

  @watch('format', { immediate: false })
  handleFormatChange() {
    if (this.selectedParts) {
      this.syncSelectorState(this.selectedParts);
      this.inputValue = this.formatPartsForDisplay(this.selectedParts);
    }
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
      this.validationInput.type = 'time';
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
    const canonical = this.getCanonicalValue();
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

    const parts = this.selectedParts
      ? { ...this.selectedParts, seconds: this.showSeconds ? this.selectedParts.seconds : 0 }
      : null;
    const min = this.parseConstraint(this.minTime);
    const max = this.parseConstraint(this.maxTime);
    const valueKey = parts ? this.timeKey(parts) : null;
    const stepMismatch = Boolean(parts) && (
      parts!.minutes % this.effectiveStep !== 0 ||
      (this.showSeconds && parts!.seconds % this.effectiveStep !== 0)
    );

    return {
      badInput: Boolean(this.inputValue) && !this.selectedParts,
      customError: Boolean(this.customValidationMessage),
      patternMismatch: false,
      rangeOverflow: valueKey !== null && Boolean(max) && valueKey > this.timeKey(max!),
      rangeUnderflow: valueKey !== null && Boolean(min) && valueKey < this.timeKey(min!),
      stepMismatch,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: this.required && !this.getCanonicalValue()
    };
  }

  private hasValidationError(): boolean {
    return Object.values(this.getValidityFlags()).some(Boolean);
  }

  private syncValidity() {
    const flags = this.getValidityFlags();
    const hasError = Object.values(flags).some(Boolean);
    const message = this.customValidationMessage ||
      (flags.badInput ? 'Please enter a valid time.' : '') ||
      (flags.rangeUnderflow ? `Time must be ${this.minTime} or later.` : '') ||
      (flags.rangeOverflow ? `Time must be ${this.maxTime} or earlier.` : '') ||
      (flags.stepMismatch
        ? `Time must use ${this.effectiveStep}-minute${this.showSeconds ? ' and second' : ''} increments.`
        : '') ||
      (flags.valueMissing ? 'Please select a time.' : '') ||
      (hasError ? 'Please enter a valid time.' : '');

    const proxy = this.validationProxy;
    proxy.disabled = this.interactionDisabled;
    proxy.readOnly = this.readonly;
    proxy.required = this.required;
    proxy.value = this.getCanonicalValue();
    proxy.min = this.minTime;
    proxy.max = this.maxTime;
    proxy.step = 'any';
    proxy.setCustomValidity(hasError ? message : '');

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

  private scrollSelectedIntoView() {
    const selectedItems = this.shadowRoot?.querySelectorAll('.selector-item--selected');
    selectedItems?.forEach(item => {
      item.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
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
    if (this.interactionDisabled || this.readonly) return;
    this.clear();
  }

  private updateClearButton() {
    if (!this.clearButton || !this.clearable) return;
    const shouldShow = Boolean(this.inputValue) && !this.interactionDisabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
  }

  // Public API

  open() {
    if (!this.interactionDisabled && !this.readonly && this.variant === 'dropdown') {
      this.showDropdown = true;
      if (this.dropdown) {
        this.dropdown.removeAttribute('hidden');
        this.dropdown.classList.add('dropdown--open');
        if (typeof this.dropdown.showPopover === 'function') {
          this.dropdown.showPopover();
        }
        this.positionDropdown();
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
    if (!this.dropdown) return;
    const container = this.inputContainer;
    if (!container) return;
    const anchor = container.getBoundingClientRect();
    const popup = this.dropdown.getBoundingClientRect();
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

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
    this.dropdown.style.minWidth = `${anchor.width}px`;
  }

  private positionDropdownHandler = () => {
    if (this.showDropdown) this.positionDropdown();
  };

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  clear() {
    this.commitTimeState(null, '', '', true);
    this.emitClear();
    this.emitTimeChange();
    this.focus();
  }

  /** Native-compatible control type. @public */
  get type(): 'time' {
    return 'time' as const;
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
    return this.internals?.labels ?? this.input?.labels ?? null;
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
