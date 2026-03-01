import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-color-picker.css?inline';
import type { ColorPickerSize, ColorPickerFormat, SniceColorPickerElement } from './snice-color-picker.types';

@element('snice-color-picker', { formAssociated: true })
export class SniceColorPicker extends HTMLElement implements SniceColorPickerElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  size: ColorPickerSize = 'medium';

  @property({  })
  value = '#000000';

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

  @render()
  render() {
    const wrapperClasses = ['color-picker-wrapper'].filter(Boolean).join(' ');
    const swatchClasses = [
      'color-swatch',
      `color-swatch--${this.size}`,
      this.disabled ? 'color-swatch--disabled' : '',
      this.invalid ? 'color-swatch--invalid' : '',
      this.loading ? 'color-swatch--loading' : ''
    ].filter(Boolean).join(' ');
    const inputClasses = [
      'color-input',
      `color-input--${this.size}`,
      this.invalid ? 'color-input--invalid' : '',
      this.loading ? 'color-input--loading' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');

    const displayValue = this.formatColor(this.value, this.format);

    return html/*html*/`
      <div class="${wrapperClasses}">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="picker-container">
          <div
            class="${swatchClasses}"
            @click=${this.handleSwatchClick}
            tabindex="${this.disabled || this.loading ? -1 : 0}"
            role="button"
            aria-label="Choose color"
            @keydown=${this.handleSwatchKeyDown}
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
                ?disabled="${this.disabled || this.loading}"
                ?required="${this.required}"
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
            ?disabled="${this.disabled}"
            name="${this.name || ''}"
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

  private renderPreset(color: string) {
    const isSelected = this.toHex(this.value).toLowerCase() === this.toHex(color).toLowerCase();
    const classes = ['preset', isSelected ? 'preset--selected' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div
        class="${classes}"
        style="background-color: ${color}"
        @click=${() => this.handlePresetClick(color)}
        tabindex="0"
        role="button"
        aria-label="Select ${color}"
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
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }

    this.normalizeValue();
  }

  private handleSwatchClick() {
    if (!this.disabled) {
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
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchInputEvent();
    this.dispatchChangeEvent();
  }

  private handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const color = this.parseColor(input.value);
    if (color) {
      this.value = color;
      this.dispatchInputEvent();
      this.dispatchChangeEvent();
    }
  }

  private handlePresetClick(color: string) {
    if (!this.disabled) {
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

  private normalizeValue() {
    // Ensure value is a valid hex color
    if (!this.value.startsWith('#')) {
      this.value = '#000000';
    }
  }

  private toHex(color: string): string {
    if (color.startsWith('#')) {
      return color;
    }
    if (color.startsWith('rgb')) {
      return this.rgbToHex(color);
    }
    if (color.startsWith('hsl')) {
      return this.hslToHex(color);
    }
    return color;
  }

  private formatColor(color: string, format: ColorPickerFormat): string {
    const hex = this.toHex(color);

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
    if (value.startsWith('rgb')) {
      return this.rgbToHex(value);
    }

    // HSL color
    if (value.startsWith('hsl')) {
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

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';

    const r = parseInt(match[0]).toString(16).padStart(2, '0');
    const g = parseInt(match[1]).toString(16).padStart(2, '0');
    const b = parseInt(match[2]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
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

  private hslToHex(hsl: string): string {
    const match = hsl.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';

    const h = parseInt(match[0]) / 360;
    const s = parseInt(match[1]) / 100;
    const l = parseInt(match[2]) / 100;

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

  @watch('value')
  handleValueChange() {
    this.normalizeValue();

    if (this.input) {
      this.input.value = this.formatColor(this.value, this.format);
    }

    if (this.nativeInput) {
      this.nativeInput.value = this.toHex(this.value);
    }

    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('format')
  handleFormatChange() {
    if (this.input) {
      this.input.value = this.formatColor(this.value, this.format);
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
    if (this.nativeInput) {
      this.nativeInput.disabled = this.disabled;
    }
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
    this.input?.focus() || this.swatch?.focus();
  }

  blur() {
    this.input?.blur();
    this.swatch?.blur();
  }
}
