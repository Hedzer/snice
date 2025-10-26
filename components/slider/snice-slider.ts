import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-slider.css?inline';
import type { SliderSize, SliderVariant, SniceSliderElement } from './snice-slider.types';

@element('snice-slider', { formAssociated: true })
export class SniceSlider extends HTMLElement implements SniceSliderElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  size: SliderSize = 'medium';

  @property({  })
  variant: SliderVariant = 'default';

  @property({ type: Number,  })
  value = 0;

  @property({ type: Number,  })
  min = 0;

  @property({ type: Number,  })
  max = 100;

  @property({ type: Number,  })
  step = 1;

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

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'show-value',  })
  showValue = false;

  @property({ type: Boolean, attribute: 'show-ticks',  })
  showTicks = false;

  @property({ type: Boolean,  })
  vertical = false;

  @query('.slider-track')
  track?: HTMLElement;

  @query('.slider-thumb')
  thumb?: HTMLElement;

  @query('.slider-fill')
  fill?: HTMLElement;

  @query('.slider-input')
  input?: HTMLInputElement;

  private isDragging = false;

  @render()
  render() {
    const wrapperClasses = ['slider-wrapper', this.vertical ? 'slider-wrapper--vertical' : ''].filter(Boolean).join(' ');
    const containerClasses = ['slider-container', this.vertical ? 'slider-container--vertical' : ''].filter(Boolean).join(' ');
    const trackClasses = [
      'slider-track',
      `slider-track--${this.size}`,
      this.vertical ? 'slider-track--vertical' : '',
      this.disabled ? 'slider-track--disabled' : ''
    ].filter(Boolean).join(' ');
    const fillClasses = [
      'slider-fill',
      `slider-fill--${this.variant}`,
      this.vertical ? 'slider-fill--vertical' : '',
      this.isDragging ? 'slider-fill--dragging' : ''
    ].filter(Boolean).join(' ');
    const thumbClasses = [
      'slider-thumb',
      `slider-thumb--${this.size}`,
      `slider-thumb--${this.variant}`,
      this.vertical ? 'slider-thumb--vertical' : '',
      this.isDragging ? 'slider-thumb--dragging' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const ticksClasses = ['slider-ticks', this.vertical ? 'slider-ticks--vertical' : ''].filter(Boolean).join(' ');

    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    const fillStyle = this.vertical ? `height: ${percentage}%` : `width: ${percentage}%`;
    const thumbStyle = this.vertical ? `bottom: ${percentage}%` : `left: ${percentage}%`;

    const tickCount = Math.floor((this.max - this.min) / this.step) + 1;
    const ticks = this.showTicks ? Array.from({ length: tickCount }, (_, i) => i) : [];

    return html/*html*/`
      <div class="${wrapperClasses}">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="${containerClasses}">
          <div
            class="${trackClasses}"
            part="track"
            @mousedown=${this.handleTrackMouseDown}
            @touchstart=${this.handleTrackTouchStart}
          >
            <div class="${fillClasses}" style="${fillStyle}" part="fill"></div>
            <div
              class="${thumbClasses}"
              style="${thumbStyle}"
              part="thumb"
              tabindex="${this.disabled ? -1 : 0}"
              role="slider"
              aria-valuemin="${this.min}"
              aria-valuemax="${this.max}"
              aria-valuenow="${this.value}"
              aria-disabled="${this.disabled}"
              @mousedown=${this.handleThumbMouseDown}
              @touchstart=${this.handleThumbTouchStart}
              @keydown=${this.handleKeyDown}
            ></div>

            <if ${this.showTicks}>
              <div class="${ticksClasses}">
                ${ticks.map(() => html`<div class="tick ${this.vertical ? 'tick--vertical' : ''}"></div>`)}
              </div>
            </if>
          </div>

          <if ${this.showValue}>
            <div class="slider-value">${this.value}</div>
          </if>

          <input
            class="slider-input"
            type="range"
            .value="${String(this.value)}"
            min="${this.min}"
            max="${this.max}"
            step="${this.step}"
            name="${this.name || ''}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            aria-hidden="true"
            tabindex="-1"
          />
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
    if (this.internals) {
      this.internals.setFormValue(String(this.value));
    }

    this.clampValue();
  }

  private clampValue() {
    const clamped = Math.max(this.min, Math.min(this.max, this.value));
    const stepped = Math.round(clamped / this.step) * this.step;
    if (stepped !== this.value) {
      this.value = stepped;
    }
  }

  private handleTrackMouseDown(e: MouseEvent) {
    if (this.disabled || this.readonly) return;
    // Click on track - allow transition
    this.updateValueFromEvent(e);
    // Only start dragging if clicking on track (not thumb)
    if ((e.target as HTMLElement).classList.contains('slider-track')) {
      // Don't start dragging for track clicks, just update value with transition
      return;
    }
    this.startDragging();
  }

  private handleTrackTouchStart(e: TouchEvent) {
    if (this.disabled || this.readonly) return;
    this.updateValueFromEvent(e);
    this.startDragging();
  }

  private handleThumbMouseDown(e: MouseEvent) {
    if (this.disabled || this.readonly) return;
    e.stopPropagation();
    this.startDragging();
  }

  private handleThumbTouchStart(e: TouchEvent) {
    if (this.disabled || this.readonly) return;
    e.stopPropagation();
    this.startDragging();
  }

  private startDragging() {
    this.isDragging = true;
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  }

  private stopDragging() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.dispatchChangeEvent();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    this.updateValueFromEvent(e);
  };

  private handleMouseUp = () => {
    this.stopDragging();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) return;
    this.updateValueFromEvent(e);
  };

  private handleTouchEnd = () => {
    this.stopDragging();
  };

  private updateValueFromEvent(e: MouseEvent | TouchEvent) {
    if (!this.track) return;

    const rect = this.track.getBoundingClientRect();
    let position: number;

    if (e instanceof MouseEvent) {
      position = this.vertical
        ? (rect.bottom - e.clientY) / rect.height
        : (e.clientX - rect.left) / rect.width;
    } else {
      const touch = e.touches[0];
      position = this.vertical
        ? (rect.bottom - touch.clientY) / rect.height
        : (touch.clientX - rect.left) / rect.width;
    }

    position = Math.max(0, Math.min(1, position));
    const rawValue = this.min + position * (this.max - this.min);
    const steppedValue = Math.round(rawValue / this.step) * this.step;

    if (steppedValue !== this.value) {
      this.value = steppedValue;
      this.dispatchInputEvent();
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.disabled || this.readonly) return;

    let handled = false;
    const largeStep = this.step * 10;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this.value = Math.max(this.min, this.value - this.step);
        handled = true;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this.value = Math.min(this.max, this.value + this.step);
        handled = true;
        break;
      case 'Home':
        this.value = this.min;
        handled = true;
        break;
      case 'End':
        this.value = this.max;
        handled = true;
        break;
      case 'PageDown':
        this.value = Math.max(this.min, this.value - largeStep);
        handled = true;
        break;
      case 'PageUp':
        this.value = Math.min(this.max, this.value + largeStep);
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.dispatchInputEvent();
      this.dispatchChangeEvent();
    }
  }

  @watch('value')
  handleValueChange() {
    this.clampValue();

    if (this.input && this.input.value !== String(this.value)) {
      this.input.value = String(this.value);
    }

    if (this.internals) {
      this.internals.setFormValue(String(this.value));
    }

    if (this.thumb) {
      const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
      if (this.vertical) {
        this.thumb.style.bottom = `${percentage}%`;
      } else {
        this.thumb.style.left = `${percentage}%`;
      }
    }

    if (this.fill) {
      const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
      if (this.vertical) {
        this.fill.style.height = `${percentage}%`;
      } else {
        this.fill.style.width = `${percentage}%`;
      }
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
  }

  @dispatch('@snice/slider-input', { bubbles: true, composed: true })
  private dispatchInputEvent() {
    return { value: this.value, slider: this };
  }

  @dispatch('@snice/slider-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { value: this.value, slider: this };
  }

  // Public API
  focus() {
    this.thumb?.focus();
  }

  blur() {
    this.thumb?.blur();
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

  disconnectedCallback() {
    this.stopDragging();
  }
}
