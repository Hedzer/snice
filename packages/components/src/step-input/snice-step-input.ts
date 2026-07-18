import { element, property, state, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-step-input.css?inline';
import type { StepInputSize, SniceStepInputElement } from './snice-step-input.types';

@element('snice-step-input', { formAssociated: true })
export class SniceStepInput extends HTMLElement implements SniceStepInputElement {
  internals!: ElementInternals;
  private dirtyValue = false;

  @state()
  private valueState = 0;

  @state()
  private formDisabled = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
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
    this.syncFormValue();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    const value = Number(state);
    if (!Number.isNaN(value)) this.setValue(value, true);
  }

  @property({ type: Number })
  min = -Infinity;

  @property({ type: Number })
  max = Infinity;

  @property({ type: Number })
  step = 1;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  readonly = false;

  @property()
  size: StepInputSize = 'medium';

  @property({ type: Boolean })
  wrap = false;

  @query('.step-input__input')
  input?: HTMLInputElement;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  @render()
  renderContent() {
    const classes = `step-input step-input--${this.size}`;
    const isMinBound = !this.wrap && this.value <= this.min;
    const isMaxBound = !this.wrap && this.value >= this.max;
    const disableDec = this.interactionDisabled || (!this.wrap && isMinBound);
    const disableInc = this.interactionDisabled || (!this.wrap && isMaxBound);

    return html/*html*/`
      <div class="${classes}" part="base">
        <button
          class="step-input__button step-input__button--decrement"
          type="button"
          part="decrement-button"
          aria-label="Decrease value"
          ?disabled="${disableDec}"
          tabindex="-1"
          @click=${this.handleDecrement}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        <input
          class="step-input__input"
          type="number"
          part="input"
          .value="${String(this.value)}"
          min="${this.min === -Infinity ? '' : this.min}"
          max="${this.max === Infinity ? '' : this.max}"
          step="${this.step}"
          ?disabled="${this.interactionDisabled}"
          ?readonly="${this.readonly}"
          role="spinbutton"
          aria-valuenow="${this.value}"
          aria-valuemin="${this.min === -Infinity ? '' : this.min}"
          aria-valuemax="${this.max === Infinity ? '' : this.max}"
          @change=${this.handleInputChange}
          @keydown=${this.handleKeyDown}
        />

        <button
          class="step-input__button step-input__button--increment"
          type="button"
          part="increment-button"
          aria-label="Increase value"
          ?disabled="${disableInc}"
          tabindex="-1"
          @click=${this.handleIncrement}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    `;
  }

  @styles()
  componentStyles() {
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
    this.syncFormValue();
  }

  private applyDefaultValue() {
    this.setValue(this.defaultValue, false);
  }

  private setValue(value: unknown, dirty: boolean) {
    if (dirty) this.dirtyValue = true;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    this.valueState = this.normalizeValue(parsed);
    this.syncRenderedValue();
    this.syncFormValue();
  }

  private syncRenderedValue() {
    if (this.input && this.input.value !== String(this.value)) {
      this.input.value = String(this.value);
    }
  }

  private normalizeValue(value: number): number {
    let normalized = value;
    if (this.min !== -Infinity) normalized = Math.max(this.min, normalized);
    if (this.max !== Infinity) normalized = Math.min(this.max, normalized);
    return this.roundToStep(normalized);
  }

  private clampValue(dirty = this.dirtyValue) {
    this.setValue(this.value, dirty);
  }

  private syncFormValue() {
    const value = String(this.value);
    this.internals?.setFormValue(value, value);
  }

  private roundToStep(val: number): number {
    const inv = 1 / this.step;
    return Math.round(val * inv) / inv;
  }

  increment() {
    if (this.interactionDisabled || this.readonly) return;
    const oldValue = this.value;
    let newValue = this.roundToStep(this.value + this.step);

    if (this.max !== Infinity && newValue > this.max) {
      newValue = this.wrap && this.min !== -Infinity ? this.min : this.max;
    }

    if (newValue !== oldValue) {
      this.value = newValue;
      this.emitValueChange(oldValue);
    }
  }

  decrement() {
    if (this.interactionDisabled || this.readonly) return;
    const oldValue = this.value;
    let newValue = this.roundToStep(this.value - this.step);

    if (this.min !== -Infinity && newValue < this.min) {
      newValue = this.wrap && this.max !== Infinity ? this.max : this.min;
    }

    if (newValue !== oldValue) {
      this.value = newValue;
      this.emitValueChange(oldValue);
    }
  }

  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  private handleIncrement() {
    this.increment();
  }

  private handleDecrement() {
    this.decrement();
  }

  private handleInputChange(e: Event) {
    if (this.readonly) return;
    const input = e.target as HTMLInputElement;
    const parsed = parseFloat(input.value);
    if (!isNaN(parsed)) {
      const oldValue = this.value;
      let newValue = this.roundToStep(parsed);
      if (this.min !== -Infinity) newValue = Math.max(this.min, newValue);
      if (this.max !== Infinity) newValue = Math.min(this.max, newValue);
      if (newValue !== oldValue) {
        this.value = newValue;
        this.emitValueChange(oldValue);
      } else {
        // Reset input display to current value
        input.value = String(this.value);
      }
    } else {
      // Invalid input, reset
      input.value = String(this.value);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.decrement();
    }
  }

  @watch('valueState')
  handleValueChange() {
    this.syncRenderedValue();
    this.syncFormValue();
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('min', 'max', 'step')
  handleConstraintsChange() {
    this.clampValue(this.dirtyValue);
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private emitValueChange(oldValue: number) {
    return { value: this.value, oldValue, component: this };
  }
}
