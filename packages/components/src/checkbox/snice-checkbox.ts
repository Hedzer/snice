import { element, property, state, query, watch, dispatch, ready, render, styles, html, css, on } from 'snice';
import cssContent from './snice-checkbox.css?inline';
import type { CheckboxSize, SniceCheckboxElement } from './snice-checkbox.types';

@element('snice-checkbox', { formAssociated: true })
export class SniceCheckbox extends HTMLElement implements SniceCheckboxElement {
  internals!: ElementInternals;

  private dirtyCheckedness = false;
  private pendingUserChange = false;
  private forwardingHostActivation = false;
  private customValidationMessage = '';

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
   * Live checkedness. Every assignment makes the state dirty, just like
   * `HTMLInputElement.checked`, without changing the authored reset default.
   * @public
   */
  get checked(): boolean {
    return this.checkedState;
  }

  set checked(value: boolean) {
    this.setCheckedness(Boolean(value), true);
  }

  // The checked content attribute is the reset default, exposed through the
  // native-compatible `defaultChecked` property.
  @property({ type: Boolean, attribute: 'checked' })
  defaultChecked = false;

  @property({ type: Boolean,  })
  indeterminate = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

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

  @render()
  render() {
    const interactionDisabled = this.disabled || this.formDisabled || this.loading;
    const wrapperClasses = `checkbox-wrapper${interactionDisabled ? ' checkbox-wrapper--disabled' : ''}${this.loading ? ' checkbox-wrapper--loading' : ''}`;
    const checkboxClasses = `checkbox checkbox--${this.size}${this.invalid ? ' checkbox--invalid' : ''}${this.indeterminate ? ' checkbox--indeterminate' : ''}${this.loading ? ' checkbox--loading' : ''}`;
    const labelClasses = `checkbox-label checkbox-label--${this.size}${this.required ? ' checkbox-label--required' : ''}`;

    return html/*html*/`
      <label class="${wrapperClasses}">
        <input
          type="checkbox"
          class="checkbox-input"
          .checked=${this.checked}
          .indeterminate=${this.indeterminate}
          .disabled=${interactionDisabled}
          .required=${this.required}
          .name=${this.name}
          .value=${this.value}
          aria-invalid="${this.invalid ? 'true' : 'false'}"
          aria-checked="${this.indeterminate ? 'mixed' : this.checked}"
          part="input"
          @click=${this.handleInternalClick}
          @input=${this.handleInternalInput}
          @change=${this.handleInternalChange}
        />

        <span class="${checkboxClasses}" part="checkbox">
          <if ${!this.loading}>
            <svg class="checkbox-icon checkbox-icon--check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>

            <svg class="checkbox-icon checkbox-icon--indeterminate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </if>
          <if ${this.loading}>
            <span class="checkbox-spinner" part="spinner"></span>
          </if>
        </span>

        <if ${this.label}>
          <span class="${labelClasses}" part="label">
            ${this.label}
          </span>
        </if>
      </label>
    `;
  }

  @ready()
  init() {
    // Property bindings can run before this custom element upgrades. Preserve
    // that value, then remove the own data property so the public accessor is
    // no longer shadowed.
    if (Object.prototype.hasOwnProperty.call(this, 'checked')) {
      const checked = Boolean((this as { checked: unknown }).checked);
      delete (this as Partial<{ checked: unknown }>).checked;
      this.checked = checked;
    }

    this.syncNativeInput();
    this.syncFormState();
  }

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyCheckedness = false;
    this.setCheckedness(this.defaultChecked, false);
    this.syncFormState();
  }

  formDisabledCallback(disabled: boolean) {
    // The callback reports effective disabledness, including a disabled
    // fieldset. It must not overwrite/reflect the authored `disabled` value.
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;

    if (state === 'checked') {
      this.setCheckedness(true, true);
    } else if (state === 'unchecked') {
      this.setCheckedness(false, true);
    }
    this.syncFormState();
  }

  private handleInternalInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const changed = target.checked !== this.checked || target.indeterminate !== this.indeterminate;
    this.pendingUserChange = changed;
    if (!changed) return;

    this.setCheckedness(target.checked, true);
    this.indeterminate = target.indeterminate;
  }

  private handleInternalClick(event: MouseEvent) {
    // An associated external label has already delivered one click to the
    // host. Keep the native input activation, but do not bubble the forwarded
    // implementation click through the host a second time.
    if (this.forwardingHostActivation) event.stopPropagation();
  }

  private handleInternalChange() {
    if (!this.pendingUserChange) return;
    this.pendingUserChange = false;

    // The shadow input's native `input` event is composed and already reaches
    // consumers. Native `change` is not composed, so surface one from the host
    // before the component-specific event.
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchCheckboxChange();
  }

  @on('click')
  private handleHostActivationClick(event: MouseEvent) {
    // Internal input/label activation already follows the browser's native
    // path. A click whose original target is the host comes from an associated
    // external label (or an explicitly dispatched host click) and needs to be
    // forwarded once to the shadow input.
    if (event.composedPath()[0] !== this) return;
    if (this.disabled || this.formDisabled || this.loading) return;

    // Native label activation focuses the control even if a click listener
    // subsequently cancels the checkedness change.
    this.input?.focus();

    // Defer until every listener on the host click has run so preventDefault()
    // can cancel activation before checkedness or events change.
    queueMicrotask(() => {
      if (event.defaultPrevented || this.disabled || this.formDisabled || this.loading) return;
      this.forwardingHostActivation = true;
      try {
        this.input?.click();
      } finally {
        this.forwardingHostActivation = false;
      }
    });
  }

  @watch('defaultChecked')
  handleDefaultCheckedChange() {
    if (!this.dirtyCheckedness) {
      this.setCheckedness(this.defaultChecked, false);
    }
  }

  @watch('checkedState', { immediate: false })
  handleCheckedChange() {
    if (this.input) {
      this.input.checked = this.checked;
    }
    this.syncFormState();
  }

  @watch('indeterminate', { immediate: false })
  handleIndeterminateChange() {
    if (this.input) {
      this.input.indeterminate = this.indeterminate;
    }
  }

  @watch('value', { immediate: false })
  handleValueChange() {
    if (this.input) {
      this.input.value = this.formValue;
    }
    this.syncFormState();
  }

  @watch('required', { immediate: false })
  handleRequiredChange() {
    if (this.input) {
      this.input.required = this.required;
    }
    this.syncValidity();
  }

  @watch('name', { immediate: false })
  handleNameChange() {
    if (this.input) {
      this.input.name = this.name;
    }
  }

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled || this.formDisabled || this.loading;
    }
  }

  @watch('invalid', { immediate: false })
  handleInvalidChange() {
    this.input?.setAttribute('aria-invalid', this.invalid ? 'true' : 'false');
  }

  private setCheckedness(checked: boolean, dirty: boolean) {
    if (dirty) this.dirtyCheckedness = true;
    this.checkedState = checked;
  }

  private get formValue() {
    return String(this.value ?? '');
  }

  private syncNativeInput() {
    if (!this.input) return;
    this.input.checked = this.checked;
    this.input.indeterminate = this.indeterminate;
    this.input.disabled = this.disabled || this.formDisabled || this.loading;
    this.input.required = this.required;
    this.input.name = this.name;
    this.input.value = this.formValue;
    this.input.setCustomValidity(this.customValidationMessage);
  }

  private syncFormState() {
    if (this.internals) {
      this.internals.setFormValue(
        this.checked ? this.formValue : null,
        this.checked ? 'checked' : 'unchecked'
      );
    }
    this.syncValidity();
  }

  private syncValidity() {
    if (this.input) {
      this.input.checked = this.checked;
      this.input.required = this.required;
      this.input.setCustomValidity(this.customValidationMessage);
    }
    if (!this.internals) return;

    const valueMissing = this.required && !this.checked;
    const customError = this.customValidationMessage.length > 0;
    if (!valueMissing && !customError) {
      this.internals.setValidity({});
      return;
    }

    const message = this.customValidationMessage
      || this.input?.validationMessage
      || 'Please check this box.';
    if (this.input) {
      this.internals.setValidity({ valueMissing, customError }, message, this.input);
    } else {
      this.internals.setValidity({ valueMissing, customError }, message);
    }
  }

  @dispatch('checkbox-change', { bubbles: true, composed: true })
  private dispatchCheckboxChange() {
    return {
      checked: this.checked,
      indeterminate: this.indeterminate,
      checkbox: this
    };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  focus() {
    this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  click() {
    if (this.disabled || this.formDisabled || this.loading) return;
    this.input?.click();
  }

  toggle() {
    this.click();
  }

  setIndeterminate() {
    this.indeterminate = true;
  }

  /** Native-compatible control type. @public */
  get type(): 'checkbox' {
    return 'checkbox' as const;
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? null;
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input!.validity;
  }

  /** Current localized validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this checkbox participates in constraint validation. @public */
  get willValidate(): boolean {
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with this checkbox. @public */
  get labels(): NodeList | null {
    return this.internals?.labels ?? this.input?.labels ?? null;
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
}
