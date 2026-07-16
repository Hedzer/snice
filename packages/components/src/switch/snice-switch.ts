import { element, property, state, query, on, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-switch.css?inline';
import type { SwitchSize, SniceSwitchElement } from './snice-switch.types';

@element('snice-switch', { formAssociated: true })
export class SniceSwitch extends HTMLElement implements SniceSwitchElement {
  internals!: ElementInternals;
  private dirtyCheckedness = false;

  @state()
  private checkedState = false;

  @state()
  private formDisabled = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  /**
   * Live checkedness. Assignments do not rewrite the authored default.
   * @public
   */
  get checked(): boolean {
    return this.checkedState;
  }

  set checked(value: boolean) {
    this.setCheckedness(Boolean(value), true);
  }

  /** The `checked` content attribute and form-reset default. */
  @property({ type: Boolean, attribute: 'checked' })
  defaultChecked = false;

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyCheckedness = false;
    this.setCheckedness(this.defaultChecked, false);
    this.syncFormState();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (state === 'checked') this.setCheckedness(true, true);
    else if (state === 'unchecked') this.setCheckedness(false, true);
    this.syncFormState();
  }

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  size: SwitchSize = 'medium';

  @property({  })
  name = '';

  @property({  })
  value = 'on';

  @property({  })
  label = '';

  @property({  attribute: 'label-on' })
  labelOn = '';

  @property({  attribute: 'label-off' })
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

  private inputId = `snice-switch-${Math.random().toString(36).slice(2, 10)}`;
  private labelId = `${this.inputId}-label`;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  @render()
  render() {
    const wrapperClasses = `switch-wrapper${this.interactionDisabled ? ' switch-wrapper--disabled' : ''}${this.loading ? ' switch-wrapper--loading' : ''}`;
    const trackClasses = `switch-track switch-track--${this.size}${this.invalid ? ' switch-track--invalid' : ''}${this.loading ? ' switch-track--loading' : ''}`;
    const labelClasses = `switch-label switch-label--${this.size}${this.required ? ' switch-label--required' : ''}`;

    return html/*html*/`
      <label class="${wrapperClasses}" for="${this.inputId}">
        <input
          id="${this.inputId}"
          type="checkbox"
          class="switch-input"
          ?checked="${this.checked}"
          ?disabled="${this.interactionDisabled}"
          ?required="${this.required}"
          name="${this.name}"
          value="${this.value}"
          aria-invalid="${this.invalid}"
          aria-checked="${this.checked}"
          aria-labelledby="${this.label ? this.labelId : ''}"
          role="switch"
          part="input"
        />

        <span class="${trackClasses}" part="track">
          <span class="switch-thumb" part="thumb">
            <if ${this.loading}>
              <span class="switch-spinner" part="spinner"></span>
            </if>
          </span>
          <if ${this.labelOn || this.labelOff}>
            <span class="switch-state-label switch-state-label--on">${this.labelOn}</span>
            <span class="switch-state-label switch-state-label--off">${this.labelOff}</span>
          </if>
        </span>

        <if ${this.label}>
          <span class="${labelClasses}" part="label" id="${this.labelId}">
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
    if (Object.prototype.hasOwnProperty.call(this, 'checked')) {
      const checked = Boolean((this as { checked: unknown }).checked);
      delete (this as Partial<{ checked: unknown }>).checked;
      this.checked = checked;
    } else if (!this.dirtyCheckedness) {
      this.setCheckedness(this.defaultChecked, false);
    }

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

    this.syncFormState();

    // Update state labels if provided
    this.updateStateLabels();
  }

  private setCheckedness(checked: boolean, dirty: boolean) {
    if (dirty) this.dirtyCheckedness = true;
    this.checkedState = checked;
  }

  private syncFormState() {
    this.internals?.setFormValue(
      this.checked ? this.value : null,
      this.checked ? 'checked' : 'unchecked'
    );
  }

  @on('change')
  handleChange(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.switch-input')) return;

    const input = target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchChangeEvent();
  }

  @on('click')
  handleClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.switch-input')) return;

    // Allow click to propagate for label association
    e.stopPropagation();
  }

  @watch('checkedState')
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
      this.input.setAttribute('aria-checked', String(this.checked));
    }
    this.syncFormState();
  }

  @watch('disabled', 'loading', 'formDisabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.interactionDisabled;
    }
    if (this.wrapper) {
      this.wrapper.classList.toggle('switch-wrapper--disabled', this.interactionDisabled);
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
    this.syncFormState();
  }

  @watch('defaultChecked')
  handleDefaultCheckedChange() {
    if (!this.dirtyCheckedness) this.setCheckedness(this.defaultChecked, false);
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

  @dispatch('switch-change', { bubbles: true, composed: true })
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
