import { element, property, query, watch, render, styles, html, css, ready, on } from 'snice';
import cssContent from './snice-checkbox.css?inline';
import type { CheckboxSize, SniceCheckboxElement } from './snice-checkbox.types';

@element('snice-checkbox')
export class SniceCheckbox extends HTMLElement implements SniceCheckboxElement {
  @property({ type: Boolean,  })
  checked = false;

  @property({ type: Boolean,  })
  indeterminate = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  size: CheckboxSize = 'medium';

  @property({  })
  name = '';

  @property({  })
  value = 'on';

  @property({  })
  label = '';

  @query('.checkbox-input')
  input?: HTMLInputElement;

  @query('.checkbox')
  checkbox?: HTMLElement;

  @query('.checkbox-label')
  labelElement?: HTMLElement;

  @query('.checkbox-wrapper')
  wrapper?: HTMLElement;

  @on('click')
  handleCheckboxClick() {
    if (!this.disabled && !this.loading) {
      this.toggle();
    }
  }

  @render()
  render() {
    const wrapperClasses = `checkbox-wrapper${this.disabled ? ' checkbox-wrapper--disabled' : ''}${this.loading ? ' checkbox-wrapper--loading' : ''}`;
    const checkboxClasses = `checkbox checkbox--${this.size}${this.invalid ? ' checkbox--invalid' : ''}${this.indeterminate ? ' checkbox--indeterminate' : ''}${this.loading ? ' checkbox--loading' : ''}`;
    const labelClasses = `checkbox-label checkbox-label--${this.size}${this.required ? ' checkbox-label--required' : ''}`;

    return html/*html*/`
      <label class="${wrapperClasses}" @change="${(e: Event) => this.handleInternalChange(e)}">
        <input
          type="checkbox"
          class="checkbox-input"
          ?checked="${this.checked}"
          ?disabled="${this.disabled || this.loading}"
          ?required="${this.required}"
          name="${this.name}"
          value="${this.value}"
          aria-invalid="${this.invalid}"
          aria-checked="${this.indeterminate ? 'mixed' : this.checked}"
          part="input"
        />

        <span class="${checkboxClasses}" part="checkbox">
          <if ${!this.loading}>
            <svg class="checkbox-icon checkbox-icon--check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>

            <svg class="checkbox-icon checkbox-icon--indeterminate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </if>
          <if ${this.loading}>
            <span class="checkbox-spinner" part="spinner"></span>
          </if>
        </span>

        <if ${this.label}>
          <span class="${labelClasses}" part="label">
            ${this.label}
          </span>
        </if>
      </label>
    `;
  }

  private handleInternalChange(event: Event) {
    const target = event.target as HTMLInputElement;

    // Only handle change events from the checkbox input
    if (target.type !== 'checkbox') return;

    this.checked = target.checked;
    this.indeterminate = false; // Clear indeterminate on user interaction

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('@snice/change', {
      bubbles: true,
      composed: true,
      detail: {
        checked: this.checked,
        indeterminate: this.indeterminate,
        checkbox: this
      }
    }));
  }

  @watch('checked')
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
    }
  }

  @watch('indeterminate')
  handleIndeterminateChange() {
    if (this.input) {
      this.input.indeterminate = this.indeterminate;
    }
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  click() {
    this.input?.click();
  }

  toggle() {
    this.checked = !this.checked;
    this.indeterminate = false;
    this.dispatchEvent(new CustomEvent('@snice/change', {
      bubbles: true,
      composed: true,
      detail: {
        checked: this.checked,
        indeterminate: this.indeterminate,
        checkbox: this
      }
    }));
  }

  setIndeterminate() {
    this.indeterminate = true;
    this.checked = false;
    this.dispatchEvent(new CustomEvent('@snice/change', {
      bubbles: true,
      composed: true,
      detail: {
        checked: this.checked,
        indeterminate: this.indeterminate,
        checkbox: this
      }
    }));
  }
}