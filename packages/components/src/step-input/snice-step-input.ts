import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-step-input.css?inline';
import type { StepInputSize, SniceStepInputElement } from './snice-step-input.types';
import { FormLabelAssociation } from '../form-label-association';
import {
  applyElementInternalsFormValue,
  applyElementInternalsValidity,
  findFormOwner,
  hasValidityError,
  normalizeSteppedValue
} from '../form-control-validity';

@element('snice-step-input', { formAssociated: true, delegatesFocus: true })
export class SniceStepInput extends HTMLElement implements SniceStepInputElement {
  internals!: ElementInternals;
  private dirtyValue = false;
  private customValidationMessage = '';
  private readonly labelAssociation: FormLabelAssociation;

  @state()
  private valueState = 0;

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : this.input,
      () => 'Number input'
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
    this.syncValidity();
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

  @property()
  name = '';

  @query('.step-input__input')
  input?: HTMLInputElement;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  @render()
  renderContent() {
    const classes = `step-input step-input--${this.size}${this.constraintInvalid ? ' step-input--invalid' : ''}`;
    // The boundary cue sits on the highest value the lattice can actually
    // hold: when the range's width is not a whole number of steps, the raw
    // maximum is not a value this control can ever hold.
    const reachableMax = this.max === Infinity ? Infinity : this.roundToStep(this.max);
    const isMinBound = !this.wrap && this.value <= this.min;
    const isMaxBound = !this.wrap && this.value >= reachableMax;
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
          step="${this.effectiveStep}"
          name="${this.name}"
          ?disabled="${this.interactionDisabled}"
          ?readonly="${this.readonly}"
          role="spinbutton"
          aria-valuenow="${this.value}"
          aria-valuemin="${this.min === -Infinity ? '' : this.min}"
          aria-valuemax="${this.max === Infinity ? '' : this.max}"
          aria-invalid="${this.constraintInvalid ? 'true' : 'false'}"
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
    this.syncRenderedValue();
    this.syncFormState();
  }

  private syncRenderedValue() {
    if (this.input && this.input.value !== String(this.value)) {
      this.input.value = String(this.value);
    }
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
    if (input) {
      input.value = String(this.value);
      input.min = this.min === -Infinity ? '' : String(this.min);
      input.max = this.max === Infinity ? '' : String(this.max);
      input.step = String(this.effectiveStep);
      input.disabled = this.interactionDisabled;
      input.readOnly = this.readonly;
      input.setCustomValidity(this.customValidationMessage);
    }
    const barred = this.interactionDisabled || this.readonly;
    // Direct entry and property assignment are normalized before becoming the
    // component value, so min/max/step cannot leave a latent native mismatch.
    const flags: ValidityStateFlags = barred ? {} : {
      customError: Boolean(this.customValidationMessage)
    };
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage || input?.validationMessage ||
      (hasError ? 'Please enter a valid number.' : '');
    this.constraintInvalid = hasError;
    input?.setAttribute('aria-invalid', String(hasError));
    applyElementInternalsValidity(this.internals, flags, message, input);
  }

  private get effectiveStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  private roundToStep(val: number): number {
    return normalizeSteppedValue(val, this.min, this.max, this.effectiveStep);
  }

  increment() {
    if (this.interactionDisabled || this.readonly) return;
    const oldValue = this.value;
    const candidate = this.value + this.effectiveStep;
    let newValue: number;

    if (this.max !== Infinity && candidate > this.max) {
      // The boundary target is seated on the lattice BEFORE the change guard,
      // so a target the lattice would snap straight back to the current value
      // neither moves the value nor announces a change.
      newValue = this.roundToStep(this.wrap && this.min !== -Infinity ? this.min : this.max);
    } else {
      newValue = this.roundToStep(candidate);
    }

    if (newValue !== oldValue) {
      this.value = newValue;
      this.emitValueChange(oldValue);
    }
  }

  decrement() {
    if (this.interactionDisabled || this.readonly) return;
    const oldValue = this.value;
    const candidate = this.value - this.effectiveStep;
    let newValue: number;

    if (this.min !== -Infinity && candidate < this.min) {
      newValue = this.roundToStep(this.wrap && this.max !== Infinity ? this.max : this.min);
    } else {
      newValue = this.roundToStep(candidate);
    }

    if (newValue !== oldValue) {
      this.value = newValue;
      this.emitValueChange(oldValue);
    }
  }

  focus() {
    if (!this.interactionDisabled) this.input?.focus();
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
    this.syncFormState();
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

  @watch('disabled', 'readonly', 'formDisabled')
  handleValidationEligibilityChange() {
    this.syncValidity();
  }

  @watch('name')
  handleNameChange() {
    if (this.input) this.input.name = this.name;
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private emitValueChange(oldValue: number) {
    return { value: this.value, oldValue, component: this };
  }

  /** Native-compatible control type. @public */
  get type(): 'number' {
    return 'number';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input!.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this number input currently participates in validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with the host. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity(): boolean {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.input?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string): void {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }

  @dispose()
  private cleanup() {
    this.labelAssociation.disconnect();
  }
}
