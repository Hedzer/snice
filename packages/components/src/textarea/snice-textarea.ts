import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css, nothing } from 'snice';
import cssContent from './snice-textarea.css?inline';
import type { TextareaSize, TextareaVariant, TextareaResize, SniceTextareaElement } from './snice-textarea.types';
import { applyElementInternalsFormValue, applyElementInternalsValidity, findFormOwner, hasValidityError, validityFlagsFrom } from '../form-control-validity';
import { FormLabelAssociation } from '../form-label-association';

@element('snice-textarea', { formAssociated: true, delegatesFocus: true })
export class SniceTextarea extends HTMLElement implements SniceTextareaElement {
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
      () => this.interactionDisabled ? undefined : this.textarea,
      () => this.label || 'Textarea'
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

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state === 'string') this.setValue(state, true);
  }

  @property({  })
  size: TextareaSize = 'medium';

  @property({  })
  variant: TextareaVariant = 'outlined';

  @property({  })
  resize: TextareaResize = 'vertical';

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

  @property({ type: Number,  })
  rows = 3;

  @property({ type: Number,  })
  cols = -1;

  @property({ type: Number,  })
  maxlength = -1;

  @property({ type: Number,  })
  minlength = -1;

  @property({  })
  autocomplete = '';

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'auto-grow',  })
  autoGrow = false;

  @query('.textarea')
  textarea?: HTMLTextAreaElement;

  private inputId = `snice-textarea-${Math.random().toString(36).slice(2, 10)}`;
  private descId = `${this.inputId}-desc`;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  @render()
  render() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const accessibleName = this.labelAssociation.accessibleName;
    const textareaClasses = [
      'textarea',
      `textarea--${this.size}`,
      `textarea--${this.variant}`,
      `textarea--resize-${this.resize}`,
      displayedInvalid ? 'textarea--invalid' : '',
      this.loading ? 'textarea--loading' : ''
    ].filter(Boolean).join(' ');

    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');

    const showCharCount = this.maxlength > 0;
    const charCount = this.value.length;
    const charCountExceeded = this.maxlength > 0 && charCount > this.maxlength;
    const charCountClasses = ['character-count', charCountExceeded ? 'character-count--exceeded' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="textarea-wrapper">
        <if ${this.label}>
          <label class="${labelClasses}" for="${this.inputId}">
            ${this.label}
          </label>
        </if>

        <div class="textarea-container">
          <textarea
            class="${textareaClasses}"
            id="${this.inputId}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.interactionDisabled}"
            ?readonly="${this.readonly}"
            ?required="${this.required}"
            aria-label="${accessibleName}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
            aria-describedby="${(this.errorText || this.helperText) ? this.descId : ''}"
            rows="${this.rows}"
            cols=${this.cols > 0 ? this.cols : nothing}
            maxlength=${this.maxlength > 0 ? this.maxlength : nothing}
            minlength=${this.minlength > 0 ? this.minlength : nothing}
            autocomplete="${this.autocomplete || ''}"
            name="${this.name || ''}"
            part="textarea"
            @input=${this.handleInput}
            @change=${this.handleChange}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          ></textarea>

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>
        </div>

        <if ${showCharCount}>
          <div class="${charCountClasses}">
            ${charCount} / ${this.maxlength}
          </div>
        </if>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text" id="${this.descId}" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text" id="${this.descId}">${this.helperText}</span>
          </when>
          <default></default>
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
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
      this.value = String(value ?? '');
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }
    this.syncFormValue();

    if (this.textarea && this.invalid) {
      this.textarea.setAttribute('aria-invalid', 'true');
      this.textarea.classList.add('textarea--invalid');
    }

    if (this.textarea) {
      if (this.maxlength > 0) this.textarea.maxLength = this.maxlength;
      if (this.minlength > 0) this.textarea.minLength = this.minlength;
      if (this.placeholder) this.textarea.placeholder = this.placeholder;
      if (this.value) this.textarea.value = this.value;
      this.textarea.disabled = this.interactionDisabled;
      this.textarea.readOnly = this.readonly;
      this.textarea.required = this.required;

      if (this.autoGrow) {
        this.adjustHeight();
      }
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
    const textarea = this.textarea;
    if (!textarea) {
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

    if (textarea.value !== this.value) textarea.value = this.value;
    textarea.disabled = this.interactionDisabled;
    textarea.readOnly = this.readonly;
    textarea.required = this.required;
    if (this.maxlength > 0) textarea.maxLength = this.maxlength;
    else textarea.removeAttribute('maxlength');
    if (this.minlength > 0) textarea.minLength = this.minlength;
    else textarea.removeAttribute('minlength');
    textarea.setCustomValidity(this.customValidationMessage);

    const barred = this.interactionDisabled || this.readonly;
    const flags = barred ? {} : validityFlagsFrom(textarea.validity, {
      tooLong: this.userEditedValue && this.maxlength > 0 && this.value.length > this.maxlength,
      tooShort: this.userEditedValue && this.minlength > 0 && this.value.length > 0 && this.value.length < this.minlength
    });
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage || textarea.validationMessage ||
      (hasError ? 'Please enter a valid value.' : '');
    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;
    textarea.setAttribute('aria-invalid', String(displayedInvalid));
    textarea.classList.toggle('textarea--invalid', displayedInvalid);
    applyElementInternalsValidity(this.internals, flags, message, textarea);
  }

  handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.setValue(textarea.value, true, true);

    if (this.autoGrow) {
      this.adjustHeight();
    }

    this.dispatchInputEvent();
  }

  handleChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.setValue(textarea.value, true, true);
    this.dispatchChangeEvent();
  }

  handleFocus(e: Event) {
    this.dispatchFocusEvent();
  }

  handleBlur(e: Event) {
    this.dispatchBlurEvent();
  }

  private adjustHeight() {
    if (!this.textarea) return;

    this.textarea.style.height = 'auto';
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  @watch('valueState')
  handleValueChange() {
    if (this.textarea && this.textarea.value !== this.value) {
      this.textarea.value = this.value;

      if (this.autoGrow) {
        this.adjustHeight();
      }
    }

    this.syncFormState();
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.textarea) {
      const displayedInvalid = this.invalid || this.constraintInvalid;
      this.textarea.setAttribute('aria-invalid', String(displayedInvalid));
      this.textarea.classList.toggle('textarea--invalid', displayedInvalid);
    }
  }

  @watch('disabled', 'loading', 'formDisabled')
  handleDisabledChange() {
    if (this.textarea) {
      this.textarea.disabled = this.interactionDisabled;
    }
    this.syncValidity();
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.textarea) {
      this.textarea.readOnly = this.readonly;
    }
    this.syncValidity();
  }

  @watch('placeholder')
  handlePlaceholderChange() {
    if (this.textarea) {
      this.textarea.placeholder = this.placeholder;
    }
  }

  @watch('label')
  handleLabelChange() {
    this.labelAssociation.sync();
  }

  @watch('maxlength')
  handleMaxLengthChange() {
    if (this.textarea) {
      if (this.maxlength > 0) this.textarea.maxLength = this.maxlength;
      else this.textarea.removeAttribute('maxlength');
    }
    this.syncValidity();
  }

  @watch('minlength')
  handleMinLengthChange() {
    if (this.textarea) {
      if (this.minlength > 0) this.textarea.minLength = this.minlength;
      else this.textarea.removeAttribute('minlength');
    }
    this.syncValidity();
  }

  @watch('rows')
  handleRowsChange() {
    if (this.textarea) {
      this.textarea.rows = this.rows;
    }
  }

  @watch('required')
  handleRequiredChange() {
    if (this.textarea) this.textarea.required = this.required;
    this.syncValidity();
  }

  @watch('autoGrow')
  handleAutoGrowChange() {
    if (this.autoGrow && this.textarea) {
      this.adjustHeight();
    }
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @dispatch('textarea-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, textarea: this };
  }

  @dispatch('textarea-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, textarea: this };
  }

  @dispatch('textarea-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { textarea: this };
  }

  @dispatch('textarea-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { textarea: this };
  }

  // Public API
  focus() {
    this.textarea?.focus();
  }

  blur() {
    this.textarea?.blur();
  }

  select() {
    this.textarea?.select();
  }

  /** Native-compatible control type. @public */
  get type(): 'textarea' {
    return 'textarea';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current native constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.textarea!.validity;
  }

  /** Current localized validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.textarea?.validationMessage ?? '';
  }

  /** Whether this textarea currently participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.textarea?.willValidate ?? false;
  }

  /** Labels associated through wrapping `<label>` or explicit `for`/`id`. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity() {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.textarea?.checkValidity() ?? true;
  }

  reportValidity() {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.textarea?.reportValidity() ?? true;
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
