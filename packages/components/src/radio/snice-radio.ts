import { element, property, query, on, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-radio.css?inline';
import type { RadioSize, RadioVariant, SniceRadioElement } from './snice-radio.types';

@element('snice-radio', { formAssociated: true })
export class SniceRadio extends HTMLElement implements SniceRadioElement {
  internals!: ElementInternals;
  private isUpdatingGroup = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  formResetCallback() {
    this.checked = false;
    if (this.internals) {
      this.internals.setFormValue(null);
    }
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  @property({ type: Boolean,  })
  checked = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  variant: RadioVariant = 'default';

  @property({  })
  size: RadioSize = 'medium';

  @property({  })
  name = '';

  @property({  })
  value = '';

  @property({  })
  label = '';

  @property({  })
  description = '';

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
    const isBlock = this.variant === 'block';
    const wrapperClasses = `radio-wrapper${isBlock ? ' radio-wrapper--block' : ''}${this.disabled ? ' radio-wrapper--disabled' : ''}${this.loading ? ' radio-wrapper--loading' : ''}`;
    const radioClasses = `radio radio--${this.size}${this.invalid ? ' radio--invalid' : ''}${this.loading ? ' radio--loading' : ''}`;
    const labelClasses = `radio-label radio-label--${this.size}${this.required ? ' radio-label--required' : ''}`;
    const hasDescription = !!this.description;

    return html/*html*/`
      <label class="${wrapperClasses}">
        <input
          type="radio"
          class="radio-input"
          ?checked="${this.checked}"
          ?disabled="${this.disabled || this.loading}"
          ?required="${this.required}"
          name="${this.name}"
          value="${this.value}"
          aria-invalid="${this.invalid}"
          part="input"
        />

        <span class="${radioClasses}" part="radio">
          <if ${!this.loading}>
            <span class="radio-dot" part="dot"></span>
          </if>
          <if ${this.loading}>
            <span class="radio-spinner" part="spinner"></span>
          </if>
        </span>

        <if ${isBlock}>
          <span class="radio-content" part="content">
            <if ${this.label}>
              <span class="${labelClasses}" part="label">
                ${this.label}
              </span>
            </if>
            <if ${hasDescription}>
              <span class="radio-description" part="description">
                ${this.description}
              </span>
            </if>
          </span>
          <slot name="suffix"></slot>
        </if>

        <if ${!isBlock}>
          <if ${this.label}>
            <span class="${labelClasses}" part="label">
              ${this.label}
            </span>
          </if>
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
    if (this.disabled) return;

    if (!this.checked) {
      this.checked = true;
      this.dispatchChangeEvent();
    }
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (this.disabled || !this.name) return;

    const isArrowKey = e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (!isArrowKey) return;

    e.preventDefault();
    const radios = this.findGroupRadios().filter(r => !r.disabled);
    if (radios.length < 2) return;

    const currentIndex = radios.indexOf(this);
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const nextIndex = forward
      ? (currentIndex + 1) % radios.length
      : (currentIndex - 1 + radios.length) % radios.length;

    const next = radios[nextIndex];
    next.focus();
    next.select();
  }


  @watch('checked')
  handleCheckedChange(oldValue: boolean, newValue: boolean) {
    if (this.input) {
      this.input.checked = this.checked;
    }

    // Skip if we're in the middle of updating the group (prevent infinite loops)
    if (this.isUpdatingGroup) {
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

    // Find all radios with the same name in the correct scope and uncheck them
    this.findGroupRadios().forEach(radio => {
      if (radio !== exceptElement && radio.checked) {
        // Set flag to prevent recursive watch handler calls
        radio.isUpdatingGroup = true;
        radio.checked = false;
        radio.isUpdatingGroup = false;
      }
    });
  }

  /**
   * Find all radios in the same group as this one. Scope rules:
   *   1. If the radio is inside a <form>, only search within that form.
   *   2. Otherwise search within the enclosing root (document or shadow root).
   * This correctly coordinates radios that live inside a web component's
   * shadow DOM (where `document.querySelectorAll` would never find them)
   * and prevents two unrelated forms from cross-contaminating.
   */
  private findGroupRadios(): SniceRadio[] {
    if (!this.name) return [];
    const form = this.closest('form');
    const scope: ParentNode = form
      ?? (this.getRootNode() as unknown as ParentNode)
      ?? document;
    const selector = `snice-radio[name="${CSS.escape(this.name)}"]`;
    return Array.from((scope as any).querySelectorAll(selector) as NodeListOf<SniceRadio>);
  }

  @dispatch('radio-change', { bubbles: true, composed: true })
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