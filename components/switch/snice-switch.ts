import { element, property, query, on, watch, dispatch, ready } from 'snice';
import css from './snice-switch.css?inline';
import type { SwitchSize, SniceSwitchElement } from './snice-switch.types';

@element('snice-switch')
export class SniceSwitch extends HTMLElement implements SniceSwitchElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ reflect: true })
  size: SwitchSize = 'medium';

  @property({ reflect: true })
  name = '';

  @property({ reflect: true })
  value = 'on';

  @property({ reflect: true })
  label = '';

  @property({ reflect: true, attribute: 'label-on' })
  labelOn = '';

  @property({ reflect: true, attribute: 'label-off' })
  labelOff = '';

  @query('.switch-input')
  input?: HTMLInputElement;

  @query('.switch-track')
  track?: HTMLElement;

  @query('.switch-label')
  labelElement?: HTMLElement;

  @query('.switch-wrapper')
  wrapper?: HTMLElement;

  @query('.switch-state-label--on')
  onLabel?: HTMLElement;

  @query('.switch-state-label--off')
  offLabel?: HTMLElement;

  html() {
    return /*html*/`
      <label class="switch-wrapper ${this.disabled ? 'switch-wrapper--disabled' : ''}">
        <input
          type="checkbox"
          class="switch-input"
          ${this.checked ? 'checked' : ''}
          ${this.disabled ? 'disabled' : ''}
          ${this.required ? 'required' : ''}
          ${this.name ? `name="${this.name}"` : ''}
          ${this.value ? `value="${this.value}"` : ''}
          aria-invalid="${this.invalid}"
          aria-checked="${this.checked}"
          role="switch"
          part="input"
        />
        
        <span class="switch-track 
          switch-track--${this.size}
          ${this.invalid ? 'switch-track--invalid' : ''}"
          part="track">
          <span class="switch-thumb" part="thumb"></span>
          ${this.labelOn || this.labelOff ? /*html*/`
            <span class="switch-state-label switch-state-label--on">${this.labelOn}</span>
            <span class="switch-state-label switch-state-label--off">${this.labelOff}</span>
          ` : ''}
        </span>
        
        ${this.label ? /*html*/`
          <span class="switch-label switch-label--${this.size} ${this.required ? 'switch-label--required' : ''}" part="label">
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
    
    // Update state labels if provided
    this.updateStateLabels();
  }

  @on('change', '.switch-input')
  handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.checked = target.checked;
    this.dispatchChangeEvent();
  }

  @on('click', '.switch-input')
  handleClick(e: Event) {
    // Allow click to propagate for label association
    e.stopPropagation();
  }

  @watch('checked')
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
      this.input.setAttribute('aria-checked', String(this.checked));
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    if (this.wrapper) {
      this.wrapper.classList.toggle('switch-wrapper--disabled', this.disabled);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
    }
    if (this.track) {
      this.track.classList.toggle('switch-track--invalid', this.invalid);
    }
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) {
      this.input.required = this.required;
    }
    if (this.labelElement) {
      this.labelElement.classList.toggle('switch-label--required', this.required);
    }
  }

  @watch('label')
  handleLabelChange() {
    if (this.labelElement) {
      this.labelElement.textContent = this.label;
      this.labelElement.style.display = this.label ? '' : 'none';
    }
  }

  @watch('labelOn', 'labelOff')
  handleStateLabelChange() {
    this.updateStateLabels();
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

  private updateStateLabels() {
    if (this.onLabel) {
      this.onLabel.textContent = this.labelOn;
      this.onLabel.style.display = this.labelOn ? '' : 'none';
    }
    if (this.offLabel) {
      this.offLabel.textContent = this.labelOff;
      this.offLabel.style.display = this.labelOff ? '' : 'none';
    }
  }

  @dispatch('@snice/switch-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return {
      checked: this.checked,
      switch: this
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
    this.dispatchChangeEvent();
  }
}