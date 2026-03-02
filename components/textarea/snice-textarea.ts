import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-textarea.css?inline';
import type { TextareaSize, TextareaVariant, TextareaResize, SniceTextareaElement } from './snice-textarea.types';

@element('snice-textarea', { formAssociated: true })
export class SniceTextarea extends HTMLElement implements SniceTextareaElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  size: TextareaSize = 'medium';

  @property({  })
  variant: TextareaVariant = 'outlined';

  @property({  })
  resize: TextareaResize = 'vertical';

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

  @render()
  render() {
    const textareaClasses = [
      'textarea',
      `textarea--${this.size}`,
      `textarea--${this.variant}`,
      `textarea--resize-${this.resize}`,
      this.invalid ? 'textarea--invalid' : '',
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
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="textarea-container">
          <textarea
            class="${textareaClasses}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled || this.loading}"
            ?readonly="${this.readonly}"
            ?required="${this.required}"
            rows="${this.rows}"
            cols="${this.cols > 0 ? this.cols : ''}"
            maxlength="${this.maxlength > 0 ? this.maxlength : ''}"
            minlength="${this.minlength > 0 ? this.minlength : ''}"
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
            <span class="error-text" part="error-text">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text">${this.helperText}</span>
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
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }

    if (this.textarea && this.invalid) {
      this.textarea.setAttribute('aria-invalid', 'true');
      this.textarea.classList.add('textarea--invalid');
    }

    if (this.textarea) {
      if (this.maxlength > 0) this.textarea.maxLength = this.maxlength;
      if (this.minlength > 0) this.textarea.minLength = this.minlength;
      if (this.placeholder) this.textarea.placeholder = this.placeholder;
      if (this.value) this.textarea.value = this.value;
      this.textarea.disabled = this.disabled || this.loading;
      this.textarea.readOnly = this.readonly;
      this.textarea.required = this.required;

      if (this.autoGrow) {
        this.adjustHeight();
      }
    }
  }

  handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    if (this.autoGrow) {
      this.adjustHeight();
    }

    this.dispatchInputEvent();
  }

  handleChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
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

  @watch('value')
  handleValueChange() {
    if (this.textarea && this.textarea.value !== this.value) {
      this.textarea.value = this.value;

      if (this.autoGrow) {
        this.adjustHeight();
      }
    }

    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('invalid')
  handleInvalidChange() {
    if (this.textarea) {
      this.textarea.setAttribute('aria-invalid', String(this.invalid));
      if (this.invalid) {
        this.textarea.classList.add('textarea--invalid');
      } else {
        this.textarea.classList.remove('textarea--invalid');
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.textarea) {
      this.textarea.disabled = this.disabled || this.loading;
    }
  }

  @watch('readonly')
  handleReadonlyChange() {
    if (this.textarea) {
      this.textarea.readOnly = this.readonly;
    }
  }

  @watch('loading')
  handleLoadingChange() {
    if (this.textarea) {
      this.textarea.disabled = this.disabled || this.loading;
    }
  }

  @watch('placeholder')
  handlePlaceholderChange() {
    if (this.textarea) {
      this.textarea.placeholder = this.placeholder;
    }
  }

  @watch('maxlength')
  handleMaxLengthChange() {
    if (this.textarea && this.maxlength > 0) {
      this.textarea.maxLength = this.maxlength;
    }
  }

  @watch('minlength')
  handleMinLengthChange() {
    if (this.textarea && this.minlength > 0) {
      this.textarea.minLength = this.minlength;
    }
  }

  @watch('rows')
  handleRowsChange() {
    if (this.textarea) {
      this.textarea.rows = this.rows;
    }
  }

  @watch('autoGrow')
  handleAutoGrowChange() {
    if (this.autoGrow && this.textarea) {
      this.adjustHeight();
    }
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

  checkValidity() {
    return this.textarea?.checkValidity() ?? true;
  }

  reportValidity() {
    return this.textarea?.reportValidity() ?? true;
  }

  setCustomValidity(message: string) {
    this.textarea?.setCustomValidity(message);
  }
}
