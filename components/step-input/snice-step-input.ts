import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-step-input.css?inline';
import type { StepInputSize, SniceStepInputElement } from './snice-step-input.types';

@element('snice-step-input')
export class SniceStepInput extends HTMLElement implements SniceStepInputElement {
  @property({ type: Number })
  value = 0;

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

  @render()
  renderContent() {
    const classes = `step-input step-input--${this.size}`;
    const isMinBound = !this.wrap && this.value <= this.min;
    const isMaxBound = !this.wrap && this.value >= this.max;
    const disableDec = this.disabled || (!this.wrap && isMinBound);
    const disableInc = this.disabled || (!this.wrap && isMaxBound);

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
          ?disabled="${this.disabled}"
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
    this.clampValue();
  }

  private clampValue() {
    if (this.min !== -Infinity && this.value < this.min) {
      this.value = this.min;
    }
    if (this.max !== Infinity && this.value > this.max) {
      this.value = this.max;
    }
  }

  private roundToStep(val: number): number {
    const inv = 1 / this.step;
    return Math.round(val * inv) / inv;
  }

  increment() {
    if (this.disabled || this.readonly) return;
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
    if (this.disabled || this.readonly) return;
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

  @watch('value')
  handleValueChange() {
    this.clampValue();
    if (this.input && this.input.value !== String(this.value)) {
      this.input.value = String(this.value);
    }
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private emitValueChange(oldValue: number) {
    return { value: this.value, oldValue, component: this };
  }
}
