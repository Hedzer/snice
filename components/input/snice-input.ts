import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-input.css?inline';
import type { InputType, InputSize, InputVariant, SniceInputElement } from './snice-input.types';

@element('snice-input', { formAssociated: true })
export class SniceInput extends HTMLElement implements SniceInputElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  type: InputType = 'text';

  @property({  })
  size: InputSize = 'medium';

  @property({  })
  variant: InputVariant = 'outlined';

  @property({  })
  value = '';

  @property({  })
  placeholder = '';

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
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({ type: Boolean,  })
  clearable = false;

  @property({ type: Boolean,  })
  password = false;

  @property({  })
  min = '';

  @property({  })
  max = '';

  @property({  })
  step = '';

  @property({  })
  pattern = '';

  @property({ type: Number,  })
  maxlength = -1;

  @property({ type: Number,  })
  minlength = -1;

  @property({  })
  autocomplete = '';

  @property({  })
  name = '';

  @property({ attribute: 'prefix-icon',  })
  prefixIcon = '';

  @property({ attribute: 'suffix-icon',  })
  suffixIcon = '';

  @query('.input')
  input?: HTMLInputElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  @query('.password-toggle')
  passwordToggle?: HTMLButtonElement;

  private showPassword = false;

  @render()
  render() {
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      this.invalid ? 'input--invalid' : '',
      this.prefixIcon ? 'input--with-prefix-icon' : '',
      this.suffixIcon || (this.type === 'password' && this.password) ? 'input--with-suffix-icon' : '',
      this.clearable ? 'input--clearable' : ''
    ].filter(Boolean).join(' ');

    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const clearButtonClasses = ['clear-button', this.suffixIcon || (this.type === 'password' && this.password) ? 'clear-button--with-suffix' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="input-wrapper">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="input-container">
          <if ${this.prefixIcon}>
            <span class="icon icon--prefix">${this.prefixIcon}</span>
          </if>

          <input
            class="${inputClasses}"
            type="${this.type}"
            value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            ?required="${this.required}"
            min="${this.min || ''}"
            max="${this.max || ''}"
            step="${this.step || ''}"
            pattern="${this.pattern || ''}"
            maxlength="${this.maxlength > 0 ? this.maxlength : ''}"
            minlength="${this.minlength > 0 ? this.minlength : ''}"
            autocomplete="${this.autocomplete || ''}"
            name="${this.name || ''}"
            part="input"
            @input=${this.handleInput}
            @change=${this.handleChange}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          />

          <button
            class="${clearButtonClasses}"
            type="button"
            aria-label="Clear"
            tabindex="-1"
            part="clear"
            style="display: none;"
            @click=${this.handleClear}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <if ${this.type === 'password' && this.password}>
            <button
              class="password-toggle"
              type="button"
              aria-label="Show password"
              tabindex="-1"
              part="password-toggle"
              @click=${this.handlePasswordToggle}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" class="password-icon password-icon--hidden">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
              </svg>
              <svg viewBox="0 0 24 24" width="18" height="18" class="password-icon password-icon--visible" style="display: none;">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
              </svg>
            </button>
          </if>
          <if ${!(this.type === 'password' && this.password) && this.suffixIcon}>
            <span class="icon icon--suffix">${this.suffixIcon}</span>
          </if>
        </div>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default>
            <span class="helper-text" part="helper-text">&nbsp;</span>
          </default>
        </case>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    // Set initial form value
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }

    // Set initial clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.disabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
    
    // Set initial invalid state
    if (this.input && this.invalid) {
      this.input.setAttribute('aria-invalid', 'true');
      this.input.classList.add('input--invalid');
    }
    
    // Set initial input properties that may not be properly set via attributes
    if (this.input) {
      // Number input constraints
      if (this.type === 'number') {
        if (this.min) this.input.min = this.min;
        if (this.max) this.input.max = this.max;
        if (this.step) this.input.step = this.step;
      }
      
      // Text constraints
      if (this.maxlength > 0) this.input.maxLength = this.maxlength;
      if (this.minlength > 0) this.input.minLength = this.minlength;
      
      // Other properties
      if (this.pattern) this.input.pattern = this.pattern;
      if (this.placeholder) this.input.placeholder = this.placeholder;
      if (this.value) this.input.value = this.value;
      this.input.disabled = this.disabled;
      this.input.readOnly = this.readonly;
      this.input.required = this.required;
    }
  }

  handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchInputEvent();
  }

  handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchChangeEvent();
  }

  handleFocus(e: Event) {
    this.dispatchFocusEvent();
  }

  handleBlur(e: Event) {
    this.dispatchBlurEvent();
  }

  handleClear(e: Event) {
    this.clear();
  }

  handlePasswordToggle(e: Event) {
    this.showPassword = !this.showPassword;
    if (this.input) {
      this.input.type = this.showPassword ? 'text' : 'password';
    }
    if (this.passwordToggle) {
      const hiddenIcon = this.passwordToggle.querySelector('.password-icon--hidden') as HTMLElement;
      const visibleIcon = this.passwordToggle.querySelector('.password-icon--visible') as HTMLElement;
      if (hiddenIcon && visibleIcon) {
        hiddenIcon.style.display = this.showPassword ? 'none' : '';
        visibleIcon.style.display = this.showPassword ? '' : 'none';
        this.passwordToggle.setAttribute('aria-label', this.showPassword ? 'Hide password' : 'Show password');
      }
    }
  }

  @watch('value')
  handleValueChange() {
    // Only update input.value if it's different to avoid unnecessary DOM updates
    if (this.input && this.input.value !== this.value) {
      this.input.value = this.value;
    }
    // Update form value
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
    // Show/hide clear button based on value
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.disabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      this.input.setAttribute('aria-invalid', String(this.invalid));
      if (this.invalid) {
        this.input.classList.add('input--invalid');
      } else {
        this.input.classList.remove('input--invalid');
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    // Update clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.disabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('readonly') 
  handleReadonlyChange() {
    if (this.input) {
      this.input.readOnly = this.readonly;
    }
    // Update clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.disabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('placeholder')
  handlePlaceholderChange() {
    if (this.input) {
      this.input.placeholder = this.placeholder;
    }
  }

  @watch('min')
  handleMinChange() {
    if (this.input && this.type === 'number') {
      this.input.min = this.min;
    }
  }

  @watch('max')
  handleMaxChange() {
    if (this.input && this.type === 'number') {
      this.input.max = this.max;
    }
  }

  @watch('step')
  handleStepChange() {
    if (this.input && this.type === 'number') {
      this.input.step = this.step;
    }
  }

  @watch('maxlength')
  handleMaxLengthChange() {
    if (this.input && this.maxlength > 0) {
      this.input.maxLength = this.maxlength;
    }
  }

  @watch('minlength')
  handleMinLengthChange() {
    if (this.input && this.minlength > 0) {
      this.input.minLength = this.minlength;
    }
  }

  @watch('pattern')
  handlePatternChange() {
    if (this.input) {
      this.input.pattern = this.pattern;
    }
  }

  @watch('type')
  handleTypeChange() {
    if (this.input && this.type !== 'password') {
      // Don't change type for password fields (handled by toggle)
      this.input.type = this.type;
    }
  }

  @watch('label')
  handleLabelChange() {
    const labelEl = this.shadowRoot?.querySelector('.label');
    if (labelEl) {
      labelEl.textContent = this.label;
      // Show/hide the label wrapper
      const wrapper = labelEl.parentElement;
      if (wrapper) {
        wrapper.style.display = this.label ? '' : 'none';
      }
    }
  }

  @dispatch('@snice/input-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, input: this };
  }

  @dispatch('@snice/input-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, input: this };
  }

  @dispatch('@snice/input-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { input: this };
  }

  @dispatch('@snice/input-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { input: this };
  }

  @dispatch('@snice/input-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return { input: this };
  }

  // Public API
  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  select() {
    this.input?.select();
  }

  clear() {
    this.value = '';
    if (this.input) {
      this.input.value = '';
    }
    this.dispatchClearEvent();
    this.dispatchInputEvent();
    this.dispatchChangeEvent();
    this.focus();
  }

  checkValidity() {
    return this.input?.checkValidity() ?? true;
  }

  reportValidity() {
    return this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string) {
    this.input?.setCustomValidity(message);
  }
}