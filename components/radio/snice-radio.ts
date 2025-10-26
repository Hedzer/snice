import { element, property, query, on, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-radio.css?inline';
import type { RadioSize, SniceRadioElement } from './snice-radio.types';

@element('snice-radio')
export class SniceRadio extends HTMLElement implements SniceRadioElement {
  private _isUpdatingGroup = false;

  @property({ type: Boolean,  })
  checked = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  size: RadioSize = 'medium';

  @property({  })
  name = '';

  @property({  })
  value = '';

  @property({  })
  label = '';

  @query('.radio-input')
  input?: HTMLInputElement;

  @query('.radio')
  radio?: HTMLElement;

  @query('.radio-label')
  labelElement?: HTMLElement;

  @query('.radio-wrapper')
  wrapper?: HTMLElement;

  @render()
  render() {
    const wrapperClasses = `radio-wrapper${this.disabled ? ' radio-wrapper--disabled' : ''}`;
    const radioClasses = `radio radio--${this.size}${this.invalid ? ' radio--invalid' : ''}`;
    const labelClasses = `radio-label radio-label--${this.size}${this.required ? ' radio-label--required' : ''}`;

    return html/*html*/`
      <label class="${wrapperClasses}">
        <input
          type="radio"
          class="radio-input"
          ?checked="${this.checked}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          name="${this.name}"
          value="${this.value}"
          aria-invalid="${this.invalid}"
          part="input"
        />

        <span class="${radioClasses}" part="radio">
          <span class="radio-dot" part="dot"></span>
        </span>

        <if ${this.label}>
          <span class="${labelClasses}" part="label">
            ${this.label}
          </span>
        </if>
      </label>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
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

  @on('click')
  handleClick(e: Event) {
    // Don't handle if disabled
    if (this.disabled) return;

    // Set this radio as checked
    if (!this.checked) {
      this.checked = true;
      this.dispatchChangeEvent();
    }
  }


  @watch('checked')
  handleCheckedChange(oldValue: boolean, newValue: boolean) {
    if (this.input) {
      this.input.checked = this.checked;
    }

    // Skip if we're in the middle of updating the group (prevent infinite loops)
    if (this._isUpdatingGroup) {
      return;
    }

    // Only uncheck others when transitioning from false to true
    if (newValue === true && oldValue === false && this.name) {
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

  private uncheckOthersInGroup(except?: SniceRadio) {
    if (!this.name) return;

    const exceptElement = except || this;

    // Find all radios with the same name and uncheck them
    const radios = document.querySelectorAll(`snice-radio[name="${this.name}"]`) as NodeListOf<SniceRadio>;

    radios.forEach(radio => {
      if (radio !== exceptElement && radio.checked) {
        // Set flag to prevent recursive watch handler calls
        radio._isUpdatingGroup = true;
        radio.checked = false;
        radio._isUpdatingGroup = false;
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