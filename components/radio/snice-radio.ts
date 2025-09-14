import { element, property, query, on, watch, dispatch, ready } from 'snice';
import css from './snice-radio.css?inline';
import type { RadioSize, SniceRadioElement } from './snice-radio.types';

@element('snice-radio')
export class SniceRadio extends HTMLElement implements SniceRadioElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ reflect: true })
  size: RadioSize = 'medium';

  @property({ reflect: true })
  name = '';

  @property({ reflect: true })
  value = '';

  @property({ reflect: true })
  label = '';

  @query('.radio-input')
  input?: HTMLInputElement;

  @query('.radio')
  radio?: HTMLElement;

  @query('.radio-label')
  labelElement?: HTMLElement;

  @query('.radio-wrapper')
  wrapper?: HTMLElement;

  html() {
    return /*html*/`
      <label class="radio-wrapper ${this.disabled ? 'radio-wrapper--disabled' : ''}">
        <input
          type="radio"
          class="radio-input"
          ${this.checked ? 'checked' : ''}
          ${this.disabled ? 'disabled' : ''}
          ${this.required ? 'required' : ''}
          ${this.name ? `name="${this.name}"` : ''}
          ${this.value ? `value="${this.value}"` : ''}
          aria-invalid="${this.invalid}"
          part="input"
        />
        
        <span class="radio 
          radio--${this.size}
          ${this.invalid ? 'radio--invalid' : ''}"
          part="radio">
          <span class="radio-dot" part="dot"></span>
        </span>
        
        ${this.label ? /*html*/`
          <span class="radio-label radio-label--${this.size} ${this.required ? 'radio-label--required' : ''}" part="label">
            ${this.label}
          </span>
        ` : ''}
      </label>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    // Set initial states
    if (this.input) {
      this.input.checked = this.checked;
      
      // Set form value
      if (this.name) {
        this.input.name = this.name;
      }
      if (this.value) {
        this.input.value = this.value;
      }
    }
  }

  @on('change', '.radio-input')
  handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const wasChecked = this.checked;
    this.checked = target.checked;
    
    // If this radio was just checked, uncheck others in the same group
    if (this.checked && !wasChecked && this.name) {
      this.uncheckOthersInGroup();
    }
    
    this.dispatchChangeEvent();
  }

  @on('click', '.radio-input')
  handleClick(e: Event) {
    // Allow click to propagate for label association
    e.stopPropagation();
  }

  @watch('checked')
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
    }
    
    // If checked, uncheck others in the same group
    if (this.checked && this.name) {
      this.uncheckOthersInGroup();
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    if (this.wrapper) {
      this.wrapper.classList.toggle('radio-wrapper--disabled', this.disabled);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
    }
    if (this.radio) {
      this.radio.classList.toggle('radio--invalid', this.invalid);
    }
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) {
      this.input.required = this.required;
    }
    if (this.labelElement) {
      this.labelElement.classList.toggle('radio-label--required', this.required);
    }
  }

  @watch('label')
  handleLabelChange() {
    if (this.labelElement) {
      this.labelElement.textContent = this.label;
      this.labelElement.style.display = this.label ? '' : 'none';
    }
  }

  @watch('name')
  handleNameChange() {
    if (this.input) {
      this.input.name = this.name;
    }
  }

  @watch('value')
  handleValueChange() {
    if (this.input) {
      this.input.value = this.value;
    }
  }

  private uncheckOthersInGroup() {
    if (!this.name) return;
    
    // Find all radios with the same name
    const radios = document.querySelectorAll(`snice-radio[name="${this.name}"]`) as NodeListOf<SniceRadio>;
    radios.forEach(radio => {
      if (radio !== this && radio.checked) {
        radio.checked = false;
      }
    });
  }

  @dispatch('@snice/radio-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return {
      checked: this.checked,
      value: this.value,
      radio: this
    };
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

  select() {
    if (!this.checked) {
      this.checked = true;
      this.dispatchChangeEvent();
    }
  }
}