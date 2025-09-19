import { element, property, query, on, watch, dispatch, ready } from 'snice';
import css from './snice-checkbox.css?inline';
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

  html() {
    return /*html*/`
      <label class="checkbox-wrapper ${this.disabled ? 'checkbox-wrapper--disabled' : ''}">
        <input
          type="checkbox"
          class="checkbox-input"
          ${this.checked ? 'checked' : ''}
          ${this.disabled ? 'disabled' : ''}
          ${this.required ? 'required' : ''}
          ${this.name ? `name="${this.name}"` : ''}
          ${this.value ? `value="${this.value}"` : ''}
          aria-invalid="${this.invalid}"
          aria-checked="${this.indeterminate ? 'mixed' : this.checked}"
          part="input"
        />
        
        <span class="checkbox 
          checkbox--${this.size}
          ${this.invalid ? 'checkbox--invalid' : ''}
          ${this.indeterminate ? 'checkbox--indeterminate' : ''}"
          part="checkbox">
          
          <svg class="checkbox-icon checkbox-icon--check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          
          <svg class="checkbox-icon checkbox-icon--indeterminate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </span>
        
        ${this.label ? /*html*/`
          <span class="checkbox-label checkbox-label--${this.size} ${this.required ? 'checkbox-label--required' : ''}" part="label">
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
      this.input.indeterminate = this.indeterminate;
      
      // Set form value
      if (this.name) {
        this.input.name = this.name;
      }
      if (this.value) {
        this.input.value = this.value;
      }
    }
    
    // Update visual state
    this.updateCheckboxState();
  }

  @on('change', '.checkbox-input')
  handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.checked = target.checked;
    this.indeterminate = false; // Clear indeterminate on user interaction
    this.dispatchChangeEvent();
  }

  @on('click', '.checkbox-input')
  handleClick(e: Event) {
    // Allow click to propagate for label association
    e.stopPropagation();
  }

  @watch('checked')
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
    }
    this.updateCheckboxState();
  }

  @watch('indeterminate')
  handleIndeterminateChange() {
    if (this.input) {
      this.input.indeterminate = this.indeterminate;
    }
    this.updateCheckboxState();
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    if (this.wrapper) {
      this.wrapper.classList.toggle('checkbox-wrapper--disabled', this.disabled);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
    }
    if (this.checkbox) {
      this.checkbox.classList.toggle('checkbox--invalid', this.invalid);
    }
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) {
      this.input.required = this.required;
    }
    if (this.labelElement) {
      this.labelElement.classList.toggle('checkbox-label--required', this.required);
    }
  }

  @watch('label')
  handleLabelChange() {
    if (this.labelElement) {
      this.labelElement.textContent = this.label;
      this.labelElement.style.display = this.label ? '' : 'none';
    }
  }

  private updateCheckboxState() {
    if (this.checkbox) {
      // Update indeterminate state
      this.checkbox.classList.toggle('checkbox--indeterminate', this.indeterminate);
      
      // Update aria-checked
      if (this.input) {
        this.input.setAttribute('aria-checked', this.indeterminate ? 'mixed' : String(this.checked));
      }
    }
  }

  @dispatch('@snice/checkbox-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return {
      checked: this.checked,
      indeterminate: this.indeterminate,
      checkbox: this
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

  toggle() {
    this.checked = !this.checked;
    this.indeterminate = false;
    this.dispatchChangeEvent();
  }

  setIndeterminate() {
    this.indeterminate = true;
    this.checked = false;
    this.dispatchChangeEvent();
  }
}