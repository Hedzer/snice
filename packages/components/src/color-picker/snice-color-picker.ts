import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-color-picker.css?inline';
import type { ColorPickerSize, ColorPickerFormat, SniceColorPickerElement } from './snice-color-picker.types';
import { FormLabelAssociation } from '../form-label-association';
import { applyElementInternalsValidity, findFormOwner, hasValidityError } from '../form-control-validity';

@element('snice-color-picker', { formAssociated: true, delegatesFocus: true })
export class SniceColorPicker extends HTMLElement implements SniceColorPickerElement {
  internals!: ElementInternals;
  private dirtyValue = false;
  private customValidationMessage = '';
  private validationInput?: HTMLInputElement;
  private readonly descriptionId = `snice-color-picker-desc-${Math.random().toString(36).slice(2, 10)}`;
  private readonly labelAssociation: FormLabelAssociation;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : (this.showInput ? this.input : this.swatch),
      () => this.label || 'Color',
      name => this.syncCompositeAccessibleNames(name)
    );
  }

  @state()
  private valueState = '#000000';

  /**
   * Live color. Assignments do not rewrite the authored reset default.
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
  defaultValue = '#000000';

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
  }

  formDisabledCallback(disabled: boolean) {
    // Inherited fieldset state must not rewrite the authored `disabled` state.
    this.formDisabled = disabled;
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state === 'string') this.setValue(state, true);
  }

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  @property({  })
  size: ColorPickerSize = 'medium';

  @property({  })
  format: ColorPickerFormat = 'hex';

  @property({  })
  label = '';

  @property({ attribute: 'helper-text',  })
  helperText = '';

  @property({ attribute: 'error-text',  })
  errorText = '';

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'show-input',  })
  showInput = true;

  @property({ type: Boolean, attribute: 'show-presets',  })
  showPresets = false;

  @property({ attribute: false, type: Array,  })
  presets: string[] = [
    '#000000', '#ffffff', '#f87171', '#fb923c', '#fbbf24',
    '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
    '#f472b6', '#fb7185'
  ];

  @query('.color-input')
  input?: HTMLInputElement;

  @query('.native-input')
  nativeInput?: HTMLInputElement;

  @query('.color-swatch')
  swatch?: HTMLElement;

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  @render()
  render() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const interactionDisabled = this.interactionDisabled;
    const wrapperClasses = ['color-picker-wrapper'].filter(Boolean).join(' ');
    const swatchClasses = [
      'color-swatch',
      `color-swatch--${this.size}`,
      interactionDisabled ? 'color-swatch--disabled' : '',
      displayedInvalid ? 'color-swatch--invalid' : '',
      this.loading ? 'color-swatch--loading' : ''
    ].filter(Boolean).join(' ');
    const inputClasses = [
      'color-input',
      `color-input--${this.size}`,
      displayedInvalid ? 'color-input--invalid' : '',
      this.loading ? 'color-input--loading' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');

    const displayValue = this.formatColor(this.value, this.format);
    const accessibleName = this.labelAssociation.accessibleName;
    const describedBy = this.errorText || this.helperText ? this.descriptionId : '';

    return html/*html*/`
      <div class="${wrapperClasses}" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" @click=${() => this.focus()}>
            ${this.label}
          </label>
        </if>

        <div class="picker-container">
          <div
            class="${swatchClasses}"
            @click=${this.handleSwatchClick}
            tabindex="${interactionDisabled ? -1 : 0}"
            role="button"
            aria-label="${this.showInput ? `${accessibleName} color chooser` : accessibleName}"
            aria-describedby="${this.showInput ? '' : describedBy}"
            aria-disabled="${interactionDisabled ? 'true' : 'false'}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
            @keydown=${this.handleSwatchKeyDown}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          >
            <div class="swatch-inner" style="background-color: ${this.value}"></div>
            <if ${this.loading}>
              <span class="swatch-spinner" part="spinner"></span>
            </if>
          </div>

          <if ${this.showInput}>
            <div class="color-input-wrapper">
              <input
                class="${inputClasses}"
                type="text"
                .value="${displayValue}"
                ?disabled="${interactionDisabled}"
                ?required="${this.required}"
                aria-label="${accessibleName}"
                aria-describedby="${describedBy}"
                aria-invalid="${displayedInvalid ? 'true' : 'false'}"
                placeholder="${this.format === 'hex' ? '#000000' : this.format === 'rgb' ? 'rgb(0,0,0)' : 'hsl(0,0%,0%)'}"
                @input=${this.handleInputChange}
                @change=${this.handleInputChange}
                @focus=${this.handleFocus}
                @blur=${this.handleBlur}
              />
            </div>
          </if>

          <input
            class="native-input"
            type="color"
            .value="${this.toHex(this.value)}"
            ?disabled="${interactionDisabled}"
            @input=${this.handleNativeChange}
            @change=${this.handleNativeChange}
            aria-hidden="true"
            tabindex="-1"
          />
        </div>

        <if ${this.showPresets}>
          <div class="presets">
            ${this.presets.map(preset => this.renderPreset(preset))}
          </div>
        </if>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span id="${this.descriptionId}" class="error-text" part="error-text" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span id="${this.descriptionId}" class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default>
            <span class="helper-text" part="helper-text">&nbsp;</span>
          </default>
        </case>
      </div>
    `;
  }

  private renderPreset(color: string) {
    const currentColor = this.parseColor(this.value);
    const presetColor = this.parseColor(color);
    const isSelected = Boolean(currentColor && presetColor && currentColor.toLowerCase() === presetColor.toLowerCase());
    const classes = [
      'preset',
      isSelected ? 'preset--selected' : '',
      this.interactionDisabled ? 'preset--disabled' : ''
    ].filter(Boolean).join(' ');
    const accessibleName = this.labelAssociation.accessibleName;

    return html/*html*/`
      <div
        class="${classes}"
        style="background-color: ${color}"
        data-color="${color}"
        @click=${() => this.handlePresetClick(color)}
        tabindex="${this.interactionDisabled ? -1 : 0}"
        role="button"
        aria-label="Set ${accessibleName} to ${color}"
        aria-disabled="${this.interactionDisabled ? 'true' : 'false'}"
        @keydown=${(e: KeyboardEvent) => this.handlePresetKeyDown(e, color)}
      ></div>
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
    this.syncFormState();
    this.labelAssociation.connect();
  }

  @reconnect()
  private onReconnect() {
    this.labelAssociation.connect();
  }

  @dispose()
  private cleanup() {
    this.labelAssociation.disconnect();
  }

  private handleSwatchClick() {
    if (!this.interactionDisabled) {
      this.nativeInput?.click();
    }
  }

  private handleSwatchKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleSwatchClick();
    }
  }

  private handleNativeChange(e: Event) {
    if (this.interactionDisabled) return;
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchInputEvent();
    this.dispatchChangeEvent();
  }

  private handleInputChange(e: Event) {
    if (this.interactionDisabled) return;
    const input = e.target as HTMLInputElement;
    // Preserve malformed editable text so badInput, FormData, and correction
    // all describe the same customer-visible value. Valid RGB/HSL text is
    // canonicalized to hex by setValue().
    this.value = input.value;
    this.dispatchInputEvent();
    this.dispatchChangeEvent();
  }

  private handlePresetClick(color: string) {
    if (!this.interactionDisabled) {
      this.value = color;
      this.dispatchInputEvent();
      this.dispatchChangeEvent();
    }
  }

  private handlePresetKeyDown(e: KeyboardEvent, color: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handlePresetClick(color);
    }
  }

  private handleFocus() {
    this.dispatchFocusEvent();
  }

  private handleBlur() {
    this.dispatchBlurEvent();
  }

  private applyDefaultValue() {
    this.setValue(this.defaultValue, false);
  }

  private setValue(value: unknown, dirty: boolean) {
    if (dirty) this.dirtyValue = true;
    const candidate = String(value ?? '').trim();
    this.valueState = this.parseColor(candidate) ?? candidate;
    this.syncRenderedValue();
    this.syncFormState();
  }

  private syncRenderedValue() {
    if (this.input) this.input.value = this.formatColor(this.value, this.format);
    if (this.nativeInput) this.nativeInput.value = this.toHex(this.value);
  }

  private syncFormValue() {
    this.internals?.setFormValue(this.value, this.value);
  }

  private syncFormState() {
    this.syncFormValue();
    this.syncValidity();
  }

  private syncValidity() {
    const barred = this.interactionDisabled;
    const badInput = !barred && this.value !== '' && this.parseColor(this.value) === null;
    const valueMissing = !barred && this.required && this.value === '';
    const flags: ValidityStateFlags = barred ? {} : {
      badInput,
      customError: Boolean(this.customValidationMessage),
      valueMissing
    };
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage ||
      (valueMissing ? 'Please select a color.' : '') ||
      (badInput ? 'Please enter a valid color.' : '');
    this.constraintInvalid = hasError;
    this.validationProxy.setCustomValidity(hasError ? message : '');
    const displayedInvalid = this.invalid || hasError;
    const anchor = this.showInput ? this.input : this.swatch;

    this.input?.setCustomValidity(hasError ? message : '');
    this.input?.setAttribute('aria-invalid', String(displayedInvalid));
    this.input?.classList.toggle('color-input--invalid', displayedInvalid);
    this.swatch?.setAttribute('aria-invalid', String(displayedInvalid));
    this.swatch?.classList.toggle('color-swatch--invalid', displayedInvalid);
    applyElementInternalsValidity(this.internals, flags, message, anchor);
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) this.validationInput = document.createElement('input');
    return this.validationInput;
  }

  private toHex(color: string): string {
    return this.parseColor(color) ?? '#000000';
  }

  private formatColor(color: string, format: ColorPickerFormat): string {
    const hex = this.parseColor(color);
    if (!hex) return color;

    switch (format) {
      case 'hex':
        return hex;
      case 'rgb':
        return this.hexToRgb(hex);
      case 'hsl':
        return this.hexToHsl(hex);
      default:
        return hex;
    }
  }

  private parseColor(value: string): string | null {
    value = value.trim();

    // Hex color
    if (value.startsWith('#')) {
      if (/^#[0-9A-F]{6}$/i.test(value)) {
        return value;
      }
      return null;
    }

    // RGB color
    if (/^rgb\(/i.test(value)) {
      return this.rgbToHex(value);
    }

    // HSL color
    if (/^hsl\(/i.test(value)) {
      return this.hslToHex(value);
    }

    return null;
  }

  private hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private rgbToHex(rgb: string): string | null {
    const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(rgb);
    if (!match) return null;
    const channels = match.slice(1).map(Number);
    if (channels.some(channel => channel < 0 || channel > 255)) return null;
    return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  private hexToHsl(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  private hslToHex(hsl: string): string | null {
    const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
    const match = new RegExp(
      `^hsl\\(\\s*(${number})\\s*,\\s*(${number})%\\s*,\\s*(${number})%\\s*\\)$`,
      'i'
    ).exec(hsl);
    if (!match) return null;

    const rawHue = Number(match[1]);
    const saturation = Number(match[2]);
    const lightness = Number(match[3]);
    if (![rawHue, saturation, lightness].every(Number.isFinite) ||
        saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) {
      return null;
    }

    const h = ((rawHue % 360) + 360) % 360 / 360;
    const s = saturation / 100;
    const l = lightness / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  @watch('valueState')
  handleValueChange() {
    this.syncRenderedValue();
    this.syncFormState();
  }

  @watch('defaultValue')
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('format')
  handleFormatChange() {
    this.syncRenderedValue();
  }

  @watch('showInput')
  handlePrimaryTargetChange() {
    queueMicrotask(() => {
      const rendered = (this as unknown as { readonly rendered: Promise<void> }).rendered;
      void rendered.then(() => {
        if (!this.isConnected) return;
        this.syncValidity();
        this.labelAssociation.sync();
      });
    });
  }

  @watch('disabled', 'loading', 'formDisabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.interactionDisabled;
    }
    if (this.nativeInput) {
      this.nativeInput.disabled = this.interactionDisabled;
    }
    this.syncValidity();
  }

  @watch('required')
  handleRequiredChange() {
    if (this.input) this.input.required = this.required;
    this.syncValidity();
  }

  @watch('invalid')
  handleInvalidChange() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    this.input?.setAttribute('aria-invalid', String(displayedInvalid));
    this.input?.classList.toggle('color-input--invalid', displayedInvalid);
    this.swatch?.setAttribute('aria-invalid', String(displayedInvalid));
    this.swatch?.classList.toggle('color-swatch--invalid', displayedInvalid);
  }

  private syncCompositeAccessibleNames(name: string) {
    this.input?.setAttribute('aria-label', name);
    this.swatch?.setAttribute('aria-label', this.showInput ? `${name} color chooser` : name);
    this.shadowRoot?.querySelectorAll<HTMLElement>('[data-color]').forEach(preset => {
      preset.setAttribute('aria-label', `Set ${name} to ${preset.dataset.color}`);
    });
  }

  @dispatch('color-picker-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, colorPicker: this };
  }

  @dispatch('color-picker-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, colorPicker: this };
  }

  @dispatch('color-picker-focus', { bubbles: true, composed: true })
  private dispatchFocusEvent() {
    return { colorPicker: this };
  }

  @dispatch('color-picker-blur', { bubbles: true, composed: true })
  private dispatchBlurEvent() {
    return { colorPicker: this };
  }

  // Public API
  focus() {
    if (this.interactionDisabled) return;
    if (this.showInput) {
      this.input?.focus();
    } else {
      this.swatch?.focus();
    }
  }

  blur() {
    this.input?.blur();
    this.swatch?.blur();
  }

  /** Native-compatible control type. @public */
  get type(): 'color' {
    return 'color';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.validationProxy.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.validationProxy.validationMessage;
  }

  /** Whether this color picker currently participates in validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? true;
  }

  /** Labels associated through wrapping `<label>` or explicit `for`/`id`. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity(): boolean {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.validationProxy.checkValidity();
  }

  reportValidity(): boolean {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.validationProxy.reportValidity();
  }

  setCustomValidity(message: string): void {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }
}
