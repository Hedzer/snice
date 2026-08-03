import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-slider.css?inline';
import type { SliderSize, SliderVariant, SniceSliderElement } from './snice-slider.types';
import {
  applyElementInternalsFormValue,
  applyElementInternalsValidity,
  findFormOwner,
  hasValidityError,
  normalizeSteppedValue
} from '../form-control-validity';
import { FormLabelAssociation } from '../form-label-association';

@element('snice-slider', { formAssociated: true, delegatesFocus: true })
export class SniceSlider extends HTMLElement implements SniceSliderElement {
  internals!: ElementInternals;
  private dirtyValue = false;

  @state()
  private valueState = 0;

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  private customValidationMessage = '';
  private readonly labelAssociation: FormLabelAssociation;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : this.thumb,
      () => this.label || 'Slider'
    );
  }

  /**
   * Live numeric value. Assignments do not rewrite the authored default.
   * @public
   */
  get value(): number {
    return this.valueState;
  }

  set value(value: number) {
    this.setValue(value, true);
  }

  /** The `value` content attribute and form-reset default. */
  @property({ type: Number, attribute: 'value' })
  defaultValue = 0;

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    if (disabled) this.stopDragging(false);
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    const value = Number(state);
    if (!Number.isNaN(value)) this.setValue(value, true);
  }

  @property({  })
  size: SliderSize = 'medium';

  @property({  })
  variant: SliderVariant = 'default';

  @property({ type: Number,  })
  min = 0;

  @property({ type: Number,  })
  max = 100;

  @property({ type: Number,  })
  step = 1;

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

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'show-value',  })
  showValue = false;

  @property({ type: Boolean, attribute: 'show-ticks',  })
  showTicks = false;

  @property({ type: Boolean,  })
  vertical = false;

  @query('.slider-track')
  track?: HTMLElement;

  @query('.slider-thumb')
  thumb?: HTMLElement;

  @query('.slider-fill')
  fill?: HTMLElement;

  @query('.slider-input')
  input?: HTMLInputElement;

  private isDragging = false;
  private labelId = `snice-slider-label-${Math.random().toString(36).slice(2, 10)}`;
  private descId = `snice-slider-desc-${Math.random().toString(36).slice(2, 10)}`;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  @render()
  render() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const showError = displayedInvalid && Boolean(this.errorText);
    const accessibleName = this.labelAssociation.accessibleName;
    const wrapperClasses = ['slider-wrapper', this.vertical ? 'slider-wrapper--vertical' : ''].filter(Boolean).join(' ');
    const containerClasses = ['slider-container', this.vertical ? 'slider-container--vertical' : ''].filter(Boolean).join(' ');
    const trackClasses = [
      'slider-track',
      `slider-track--${this.size}`,
      this.vertical ? 'slider-track--vertical' : '',
      this.interactionDisabled ? 'slider-track--disabled' : '',
      displayedInvalid ? 'slider-track--invalid' : '',
      this.loading ? 'slider-track--loading' : ''
    ].filter(Boolean).join(' ');
    const fillClasses = [
      'slider-fill',
      `slider-fill--${this.variant}`,
      this.vertical ? 'slider-fill--vertical' : '',
      this.isDragging ? 'slider-fill--dragging' : ''
    ].filter(Boolean).join(' ');
    const thumbClasses = [
      'slider-thumb',
      `slider-thumb--${this.size}`,
      `slider-thumb--${this.variant}`,
      this.vertical ? 'slider-thumb--vertical' : '',
      this.isDragging ? 'slider-thumb--dragging' : '',
      this.loading ? 'slider-thumb--loading' : '',
      displayedInvalid ? 'slider-thumb--invalid' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const ticksClasses = ['slider-ticks', this.vertical ? 'slider-ticks--vertical' : ''].filter(Boolean).join(' ');

    const valueRange = this.max - this.min;
    const percentage = valueRange > 0 ? ((this.value - this.min) / valueRange) * 100 : 0;
    const fillStyle = this.vertical ? `height: ${percentage}%` : `width: ${percentage}%`;
    const thumbStyle = this.vertical ? `bottom: ${percentage}%` : `left: ${percentage}%`;

    const tickCount = Math.max(0, Math.floor((this.max - this.min) / this.effectiveStep) + 1);
    const ticks = this.showTicks ? Array.from({ length: tickCount }, (_, i) => i) : [];

    return html/*html*/`
      <div class="${wrapperClasses}">
        <if ${this.label}>
          <label class="${labelClasses}" id="${this.labelId}">
            ${this.label}
          </label>
        </if>

        <div class="${containerClasses}">
          <div
            class="${trackClasses}"
            part="track"
            @mousedown=${this.handleTrackMouseDown}
            @touchstart=${this.handleTrackTouchStart}
          >
            <div class="${fillClasses}" style="${fillStyle}" part="fill"></div>
            <div
              class="${thumbClasses}"
              style="${thumbStyle}"
              part="thumb"
              tabindex="${this.interactionDisabled ? -1 : 0}"
              role="slider"
              aria-valuemin="${this.min}"
              aria-valuemax="${this.max}"
              aria-valuenow="${this.value}"
              aria-disabled="${this.interactionDisabled}"
              aria-label="${accessibleName}"
              aria-describedby="${(showError || this.helperText) ? this.descId : ''}"
              aria-invalid="${displayedInvalid ? 'true' : 'false'}"
              @mousedown=${this.handleThumbMouseDown}
              @touchstart=${this.handleThumbTouchStart}
              @keydown=${this.handleKeyDown}
            >
              <if ${this.loading}>
                <span class="slider-spinner" part="spinner"></span>
              </if>
            </div>

            <if ${this.showTicks}>
              <div class="${ticksClasses}">
                ${ticks.map(() => html`<div class="tick ${this.vertical ? 'tick--vertical' : ''}"></div>`)}
              </div>
            </if>
          </div>

          <if ${this.showValue}>
            <div class="slider-value">${this.formatDisplayValue(this.value)}</div>
          </if>

          <input
            class="slider-input"
            type="range"
            .value="${String(this.value)}"
            min="${this.min}"
            max="${this.max}"
            step="${this.effectiveStep}"
            name="${this.name || ''}"
            ?disabled="${this.interactionDisabled}"
            ?required="${this.required}"
            aria-hidden="true"
            tabindex="-1"
          />
        </div>

        <case ${showError ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text" id="${this.descId}" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text" id="${this.descId}">${this.helperText}</span>
          </when>
          <default></default>
        </case>
      </div>
    `;
  }

  /**
   * Format the value label so step-math artifacts like 1.9000000000000001
   * don't bleed through to the UI. Decimal precision follows the `step`:
   * integer step = 0 decimals, step 0.1 = 1, step 0.01 = 2, etc., capped
   * at 3 digits.
   */
  private formatDisplayValue(value: number): string {
    const stepStr = String(this.effectiveStep);
    const dot = stepStr.indexOf('.');
    const decimals = dot === -1 ? 0 : Math.min(3, stepStr.length - dot - 1);
    return value.toFixed(decimals);
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = Number((this as { value: unknown }).value);
      delete (this as Partial<{ value: unknown }>).value;
      if (!Number.isNaN(value)) this.value = value;
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }
    this.clampValue(false);
    this.syncFormState();
    this.labelAssociation.connect();
  }

  @reconnect()
  private onReconnect() {
    this.labelAssociation.connect();
  }

  private applyDefaultValue() {
    this.setValue(this.defaultValue, false);
  }

  private setValue(value: unknown, dirty: boolean) {
    if (dirty) this.dirtyValue = true;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    this.valueState = this.normalizeValue(parsed);
    this.syncFormState();
  }

  private get effectiveStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  private normalizeValue(value: number): number {
    return normalizeSteppedValue(value, this.min, this.max, this.effectiveStep);
  }

  private clampValue(dirty = this.dirtyValue) {
    this.setValue(this.value, dirty);
  }

  private syncFormValue() {
    const value = String(this.value);
    applyElementInternalsFormValue(this.internals, value, value);
  }

  private syncFormState() {
    this.syncFormValue();
    this.syncValidity();
  }

  private syncValidity() {
    const input = this.input;
    if (!input) {
      const flags: ValidityStateFlags = this.interactionDisabled || this.readonly
        ? {}
        : { customError: Boolean(this.customValidationMessage) };
      const hasError = hasValidityError(flags);
      this.constraintInvalid = hasError;
      applyElementInternalsValidity(
        this.internals,
        flags,
        this.customValidationMessage || (hasError ? 'Please select a valid value.' : '')
      );
      return;
    }

    input.value = String(this.value);
    input.min = String(this.min);
    input.max = String(this.max);
    input.step = String(this.effectiveStep);
    input.disabled = this.interactionDisabled;
    input.setCustomValidity(this.customValidationMessage);

    const barred = this.interactionDisabled || this.readonly;
    // A range value is always present and normalizeValue keeps it on the
    // min-based step lattice inside the effective bounds. As with a native
    // range input, only an explicit custom error can remain after sanitation.
    const flags: ValidityStateFlags = barred ? {} : {
      customError: Boolean(this.customValidationMessage)
    };
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage || input.validationMessage ||
      (hasError ? 'Please select a valid value.' : '');
    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;
    this.thumb?.setAttribute('aria-invalid', String(displayedInvalid));
    this.thumb?.classList.toggle('slider-thumb--invalid', displayedInvalid);
    this.track?.classList.toggle('slider-track--invalid', displayedInvalid);
    applyElementInternalsValidity(this.internals, flags, message, this.thumb ?? input);
  }

  private handleTrackMouseDown(e: MouseEvent) {
    if (this.interactionDisabled || this.readonly) return;
    // Click on track - allow transition
    this.updateValueFromEvent(e);
    // Only start dragging if clicking on track (not thumb)
    if ((e.target as HTMLElement).classList.contains('slider-track')) {
      // Don't start dragging for track clicks, just update value with transition
      return;
    }
    this.startDragging();
  }

  private handleTrackTouchStart(e: TouchEvent) {
    if (this.interactionDisabled || this.readonly) return;
    this.updateValueFromEvent(e);
    this.startDragging();
  }

  private handleThumbMouseDown(e: MouseEvent) {
    if (this.interactionDisabled || this.readonly) return;
    e.stopPropagation();
    this.startDragging();
  }

  private handleThumbTouchStart(e: TouchEvent) {
    if (this.interactionDisabled || this.readonly) return;
    e.stopPropagation();
    this.startDragging();
  }

  private startDragging() {
    this.isDragging = true;
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  }

  private stopDragging(emit = true) {
    const wasDragging = this.isDragging;
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    if (emit && wasDragging && this.isConnected) this.dispatchChangeEvent();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    if (this.interactionDisabled || this.readonly) {
      this.stopDragging(false);
      return;
    }
    this.updateValueFromEvent(e);
  };

  private handleMouseUp = () => {
    this.stopDragging();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) return;
    if (this.interactionDisabled || this.readonly) {
      this.stopDragging(false);
      return;
    }
    this.updateValueFromEvent(e);
  };

  private handleTouchEnd = () => {
    this.stopDragging();
  };

  private updateValueFromEvent(e: MouseEvent | TouchEvent) {
    if (!this.track || this.interactionDisabled || this.readonly) return;

    const rect = this.track.getBoundingClientRect();
    let position: number;

    if (e instanceof MouseEvent) {
      position = this.vertical
        ? (rect.bottom - e.clientY) / rect.height
        : (e.clientX - rect.left) / rect.width;
    } else {
      const touch = e.touches[0];
      position = this.vertical
        ? (rect.bottom - touch.clientY) / rect.height
        : (touch.clientX - rect.left) / rect.width;
    }

    position = Math.max(0, Math.min(1, position));
    const rawValue = this.min + position * (this.max - this.min);

    if (this.normalizeValue(rawValue) !== this.value) {
      this.value = rawValue;
      this.dispatchInputEvent();
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.interactionDisabled || this.readonly) return;

    let handled = false;
    const largeStep = this.effectiveStep * 10;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this.value = Math.max(this.min, this.value - this.effectiveStep);
        handled = true;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this.value = Math.min(this.max, this.value + this.effectiveStep);
        handled = true;
        break;
      case 'Home':
        this.value = this.min;
        handled = true;
        break;
      case 'End':
        this.value = this.max;
        handled = true;
        break;
      case 'PageDown':
        this.value = Math.max(this.min, this.value - largeStep);
        handled = true;
        break;
      case 'PageUp':
        this.value = Math.min(this.max, this.value + largeStep);
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.dispatchInputEvent();
      this.dispatchChangeEvent();
    }
  }

  @watch('valueState')
  handleValueChange() {
    if (this.input && this.input.value !== String(this.value)) {
      this.input.value = String(this.value);
    }

    this.syncFormState();

    if (this.thumb) {
      const valueRange = this.max - this.min;
      const percentage = valueRange > 0 ? ((this.value - this.min) / valueRange) * 100 : 0;
      if (this.vertical) {
        this.thumb.style.bottom = `${percentage}%`;
      } else {
        this.thumb.style.left = `${percentage}%`;
      }
    }

    if (this.fill) {
      const valueRange = this.max - this.min;
      const percentage = valueRange > 0 ? ((this.value - this.min) / valueRange) * 100 : 0;
      if (this.vertical) {
        this.fill.style.height = `${percentage}%`;
      } else {
        this.fill.style.width = `${percentage}%`;
      }
    }
  }

  @watch('disabled', 'loading', 'formDisabled')
  handleDisabledChange() {
    if (this.interactionDisabled) this.stopDragging(false);
    if (this.input) {
      this.input.disabled = this.interactionDisabled;
    }
    this.syncValidity();
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.readonly) this.stopDragging(false);
    this.syncValidity();
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('min', 'max', 'step')
  handleConstraintsChange() {
    this.clampValue(this.dirtyValue);
    this.syncValidity();
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) this.input.required = this.required;
    this.syncValidity();
  }

  @watch('invalid')
  handleInvalidChange() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    this.thumb?.setAttribute('aria-invalid', String(displayedInvalid));
    this.thumb?.classList.toggle('slider-thumb--invalid', displayedInvalid);
    this.track?.classList.toggle('slider-track--invalid', displayedInvalid);
  }

  @watch('label')
  handleLabelChange() {
    this.labelAssociation.sync();
  }

  @dispatch('slider-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, slider: this };
  }

  @dispatch('slider-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, slider: this };
  }

  // Public API
  focus() {
    if (!this.interactionDisabled) this.thumb?.focus();
  }

  blur() {
    this.thumb?.blur();
  }

  /** Native-compatible control type. @public */
  get type(): 'range' {
    return 'range';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current native constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input!.validity;
  }

  /** Current localized validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this slider currently participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with the host. @public */
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

  @dispose()
  cleanup() {
    this.stopDragging(false);
    this.labelAssociation.disconnect();
  }
}
