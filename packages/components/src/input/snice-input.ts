import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-input.css?inline';
import type { InputType, InputSize, InputVariant, SniceInputElement } from './snice-input.types';
import { applyElementInternalsFormValue, applyElementInternalsValidity, findFormOwner, hasValidityError, validityFlagsFrom } from '../form-control-validity';
import { FormLabelAssociation } from '../form-label-association';

@element('snice-input', { formAssociated: true, delegatesFocus: true })
export class SniceInput extends HTMLElement implements SniceInputElement {
  internals!: ElementInternals;
  private dirtyValue = false;
  private userEditedValue = false;

  @state()
  private valueState = '';

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
      () => this.interactionDisabled ? undefined : this.input,
      () => this.label || 'Input'
    );
  }

  /**
   * Live value. Assignments do not rewrite the authored reset default.
   * @public
   */
  get value(): string {
    return this.valueState;
  }

  set value(value: string) {
    this.setValue(value, true);
  }

  /** The `value` content attribute and form-reset default. */
  @property({ attribute: 'value' })
  defaultValue = '';

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  /**
   * Form-associated lifecycle callback: invoked when the fieldset or form
   * disables the element.
   */
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state === 'string') this.setValue(state, true);
  }

  @property({  })
  type: InputType = 'text';

  @property({  })
  size: InputSize = 'medium';

  @property({  })
  variant: InputVariant = 'outlined';

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
  loading = false;

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

  @property({  })
  align: 'top' | 'center' | 'bottom' | '' = '';

  @property({ attribute: 'label-align',  })
  labelAlign: 'left' | 'center' | 'right' = 'left';

  @property({ type: Boolean,  })
  stretch = false;

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
  // Stable per-instance ids for label + aria-describedby wiring.
  private inputId = `snice-input-${Math.random().toString(36).slice(2, 10)}`;
  private descId = `${this.inputId}-desc`;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  @render()
  render() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const accessibleName = this.labelAssociation.accessibleName;
    const inputClasses = [
      'input',
      `input--${this.size}`,
      `input--${this.variant}`,
      displayedInvalid ? 'input--invalid' : '',
      this.loading ? 'input--loading' : '',
      this.prefixIcon ? 'input--with-prefix-icon' : '',
      this.suffixIcon || (this.type === 'password' && this.password) || this.loading ? 'input--with-suffix-icon' : '',
      this.clearable ? 'input--clearable' : ''
    ].filter(Boolean).join(' ');

    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const clearButtonClasses = ['clear-button', this.suffixIcon || (this.type === 'password' && this.password) ? 'clear-button--with-suffix' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="input-wrapper" part="wrapper">
        <if ${this.label}>
          <label class="${labelClasses}" part="label" for="${this.inputId}">
            ${this.label}
          </label>
        </if>

        <div class="input-container" part="container">
          <span class="icon-slot icon-slot--prefix" part="prefix-icon">
            <slot name="prefix-icon">
              <if ${this.prefixIcon}>
                ${renderIcon(this.prefixIcon, 'icon icon--prefix')}
              </if>
            </slot>
          </span>

          <input
            class="${inputClasses}"
            id="${this.inputId}"
            type="${this.type}"
            value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.interactionDisabled}"
            ?readonly="${this.readonly}"
            ?required="${this.required}"
            aria-label="${accessibleName}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
            aria-describedby="${(this.errorText || this.helperText) ? this.descId : ''}"
            min=${this.min || null}
            max=${this.max || null}
            step=${this.step || null}
            pattern=${this.pattern || null}
            maxlength=${this.maxlength > 0 ? this.maxlength : null}
            minlength=${this.minlength > 0 ? this.minlength : null}
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
            .disabled=${this.interactionDisabled || this.readonly}
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

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>

          <if ${this.type === 'password' && this.password}>
            <button
              class="password-toggle"
              type="button"
              .disabled=${this.interactionDisabled}
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
          <if ${!(this.type === 'password' && this.password)}>
            <span class="icon-slot icon-slot--suffix" part="suffix-icon">
              <slot name="suffix-icon">
                <if ${this.suffixIcon}>
                  ${renderIcon(this.suffixIcon, 'icon icon--suffix')}
                </if>
              </slot>
            </span>
          </if>
        </div>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text" id="${this.descId}" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text" id="${this.descId}">${this.helperText}</span>
          </when>
          <default>
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
    // Preserve a value assigned before custom-element upgrade. The own data
    // property would otherwise shadow the native-compatible accessor.
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
      this.value = String(value ?? '');
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }
    this.syncFormValue();

    // Set initial clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.interactionDisabled && !this.readonly;
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
      this.input.disabled = this.interactionDisabled;
      this.input.readOnly = this.readonly;
      this.input.required = this.required;
    }
    this.syncValidity();
    this.labelAssociation.connect();
  }

  @reconnect()
  private onReconnect() {
    this.labelAssociation.connect();
  }

  private applyDefaultValue() {
    this.setValue(this.defaultValue, false);
  }

  private setValue(value: unknown, dirty: boolean, userEdited = false) {
    if (dirty) this.dirtyValue = true;
    this.userEditedValue = userEdited;
    this.valueState = String(value ?? '');
    this.syncFormState();
  }

  private syncFormValue() {
    applyElementInternalsFormValue(this.internals, this.value, this.value);
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
        : { customError: Boolean(this.customValidationMessage), valueMissing: this.required && !this.value };
      const hasError = hasValidityError(flags);
      this.constraintInvalid = hasError;
      applyElementInternalsValidity(
        this.internals,
        flags,
        this.customValidationMessage || (hasError ? 'Please enter a valid value.' : '')
      );
      return;
    }

    if (input.value !== this.value) input.value = this.value;
    input.type = this.type === 'password' && this.showPassword ? 'text' : this.type;
    input.disabled = this.interactionDisabled;
    input.readOnly = this.readonly;
    input.required = this.required;
    if (this.min) input.min = this.min;
    else input.removeAttribute('min');
    if (this.max) input.max = this.max;
    else input.removeAttribute('max');
    if (this.step) input.step = this.step;
    else input.removeAttribute('step');
    if (this.pattern) input.pattern = this.pattern;
    else input.removeAttribute('pattern');
    if (this.maxlength > 0) input.maxLength = this.maxlength;
    else input.removeAttribute('maxlength');
    if (this.minlength > 0) input.minLength = this.minlength;
    else input.removeAttribute('minlength');
    input.setCustomValidity(this.customValidationMessage);

    const barred = this.interactionDisabled || this.readonly;
    const lengthConstrained = ['text', 'search', 'url', 'tel', 'email', 'password'].includes(this.type);
    const valueSanitizedByNativeType = ['number', 'date', 'time', 'datetime-local'].includes(this.type) &&
      this.value !== '' && input.value === '';
    const flags = barred ? {} : validityFlagsFrom(input.validity, {
      badInput: input.validity.badInput || valueSanitizedByNativeType,
      tooLong: lengthConstrained && this.userEditedValue && this.maxlength > 0 && this.value.length > this.maxlength,
      tooShort: lengthConstrained && this.userEditedValue && this.minlength > 0 && this.value.length > 0 && this.value.length < this.minlength
    });
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage || input.validationMessage ||
      (hasError ? 'Please enter a valid value.' : '');
    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;
    input.setAttribute('aria-invalid', String(displayedInvalid));
    input.classList.toggle('input--invalid', displayedInvalid);
    applyElementInternalsValidity(this.internals, flags, message, input);
  }

  handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setValue(input.value, true, true);
    this.dispatchInputEvent();
  }

  handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setValue(input.value, true, true);
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

  @watch('valueState')
  handleValueChange() {
    // Only update input.value if it's different to avoid unnecessary DOM updates
    if (this.input && this.input.value !== this.value) {
      this.input.value = this.value;
    }
    // Update form value
    this.syncFormState();
    // Show/hide clear button based on value
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.interactionDisabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.input) {
      const displayedInvalid = this.invalid || this.constraintInvalid;
      this.input.setAttribute('aria-invalid', String(displayedInvalid));
      this.input.classList.toggle('input--invalid', displayedInvalid);
    }
  }

  @watch('disabled', 'loading', 'formDisabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.interactionDisabled;
    }
    this.syncValidity();
    // Update clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.interactionDisabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.input) {
      this.input.readOnly = this.readonly;
    }
    this.syncValidity();
    // Update clear button visibility
    if (this.clearButton && this.clearable) {
      const shouldShow = this.value && !this.interactionDisabled && !this.readonly;
      this.clearButton.style.display = shouldShow ? '' : 'none';
      this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
    }
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
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
      if (this.min) this.input.min = this.min;
      else this.input.removeAttribute('min');
    }
    this.syncValidity();
  }

  @watch('max')
  handleMaxChange() {
    if (this.input && this.type === 'number') {
      if (this.max) this.input.max = this.max;
      else this.input.removeAttribute('max');
    }
    this.syncValidity();
  }

  @watch('step')
  handleStepChange() {
    if (this.input && this.type === 'number') {
      if (this.step) this.input.step = this.step;
      else this.input.removeAttribute('step');
    }
    this.syncValidity();
  }

  @watch('maxlength')
  handleMaxLengthChange() {
    if (this.input) {
      if (this.maxlength > 0) this.input.maxLength = this.maxlength;
      else this.input.removeAttribute('maxlength');
    }
    this.syncValidity();
  }

  @watch('minlength')
  handleMinLengthChange() {
    if (this.input) {
      if (this.minlength > 0) this.input.minLength = this.minlength;
      else this.input.removeAttribute('minlength');
    }
    this.syncValidity();
  }

  @watch('pattern')
  handlePatternChange() {
    if (this.input) {
      if (this.pattern) this.input.pattern = this.pattern;
      else this.input.removeAttribute('pattern');
    }
    this.syncValidity();
  }

  @watch('type')
  handleTypeChange() {
    if (this.input && this.type !== 'password') {
      // Don't change type for password fields (handled by toggle)
      this.input.type = this.type;
    }
    this.syncValidity();
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) this.input.required = this.required;
    this.syncValidity();
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
    this.labelAssociation.sync();
  }

  @dispatch('input-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, input: this };
  }

  @dispatch('input-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, input: this };
  }

  @dispatch('input-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { input: this };
  }

  @dispatch('input-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { input: this };
  }

  @dispatch('input-clear', { bubbles: true, composed: true })
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

  /** Whether this input currently participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated through wrapping `<label>` or explicit `for`/`id`. @public */
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
  private cleanup() {
    this.labelAssociation.disconnect();
  }
}
