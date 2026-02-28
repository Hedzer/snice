import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-range-slider.css?inline';
import type { RangeSliderOrientation, SniceRangeSliderElement } from './snice-range-slider.types';

@element('snice-range-slider')
export class SniceRangeSlider extends HTMLElement implements SniceRangeSliderElement {
  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: Number, attribute: 'value-low' })
  valueLow = 0;

  @property({ type: Number, attribute: 'value-high' })
  valueHigh = 100;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean, attribute: 'show-tooltip' })
  showTooltip = false;

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = false;

  @property()
  orientation: RangeSliderOrientation = 'horizontal';

  @query('.range-slider__track')
  track?: HTMLElement;

  @query('.range-slider__thumb--low')
  thumbLow?: HTMLElement;

  @query('.range-slider__thumb--high')
  thumbHigh?: HTMLElement;

  private draggingThumb: 'low' | 'high' | null = null;

  @render()
  renderContent() {
    const isVertical = this.orientation === 'vertical';
    const wrapperClass = `range-slider__wrapper`;
    const containerClass = `range-slider${isVertical ? ' range-slider--vertical' : ''}`;

    const range = this.max - this.min;
    const lowPct = range > 0 ? ((this.valueLow - this.min) / range) * 100 : 0;
    const highPct = range > 0 ? ((this.valueHigh - this.min) / range) * 100 : 100;

    const rangeStyle = isVertical
      ? `bottom: ${lowPct}%; height: ${highPct - lowPct}%`
      : `left: ${lowPct}%; width: ${highPct - lowPct}%`;

    const lowThumbStyle = isVertical ? `bottom: ${lowPct}%` : `left: ${lowPct}%`;
    const highThumbStyle = isVertical ? `bottom: ${highPct}%` : `left: ${highPct}%`;

    const trackClasses = `range-slider__track${this.disabled ? ' range-slider__track--disabled' : ''}`;
    const isDragging = this.draggingThumb !== null;
    const rangeClasses = `range-slider__range${isDragging ? ' range-slider__range--dragging' : ''}`;

    const lowThumbClasses = [
      'range-slider__thumb',
      'range-slider__thumb--low',
      this.disabled ? 'range-slider__thumb--disabled' : '',
      this.draggingThumb === 'low' ? 'range-slider__thumb--dragging' : ''
    ].filter(Boolean).join(' ');

    const highThumbClasses = [
      'range-slider__thumb',
      'range-slider__thumb--high',
      this.disabled ? 'range-slider__thumb--disabled' : '',
      this.draggingThumb === 'high' ? 'range-slider__thumb--dragging' : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${wrapperClass}">
        <div class="${containerClass}">
          <div
            class="${trackClasses}"
            part="track"
            @mousedown=${this.handleTrackMouseDown}
            @touchstart=${this.handleTrackTouchStart}
          >
            <div class="${rangeClasses}" style="${rangeStyle}" part="range"></div>

            <div
              class="${lowThumbClasses}"
              style="${lowThumbStyle}"
              part="thumb-low"
              tabindex="${this.disabled ? -1 : 0}"
              role="slider"
              aria-label="Range minimum"
              aria-valuenow="${this.valueLow}"
              aria-valuemin="${this.min}"
              aria-valuemax="${this.valueHigh}"
              @mousedown=${this.handleLowThumbMouseDown}
              @touchstart=${this.handleLowThumbTouchStart}
              @keydown=${this.handleLowKeyDown}
            >
              <if ${this.showTooltip}>
                <span class="range-slider__tooltip">${this.valueLow}</span>
              </if>
            </div>

            <div
              class="${highThumbClasses}"
              style="${highThumbStyle}"
              part="thumb-high"
              tabindex="${this.disabled ? -1 : 0}"
              role="slider"
              aria-label="Range maximum"
              aria-valuenow="${this.valueHigh}"
              aria-valuemin="${this.valueLow}"
              aria-valuemax="${this.max}"
              @mousedown=${this.handleHighThumbMouseDown}
              @touchstart=${this.handleHighThumbTouchStart}
              @keydown=${this.handleHighKeyDown}
            >
              <if ${this.showTooltip}>
                <span class="range-slider__tooltip">${this.valueHigh}</span>
              </if>
            </div>
          </div>
        </div>

        <if ${this.showLabels}>
          <div class="range-slider__labels">
            <span part="label-min">${this.min}</span>
            <span part="label-max">${this.max}</span>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.clampValues();
  }

  private clampValues() {
    let low = Math.max(this.min, Math.min(this.max, this.valueLow));
    let high = Math.max(this.min, Math.min(this.max, this.valueHigh));
    low = Math.round(low / this.step) * this.step;
    high = Math.round(high / this.step) * this.step;
    if (low > high) low = high;
    if (low !== this.valueLow) this.valueLow = low;
    if (high !== this.valueHigh) this.valueHigh = high;
  }

  private getPositionFromEvent(e: MouseEvent | TouchEvent): number {
    if (!this.track) return 0;
    const rect = this.track.getBoundingClientRect();
    let position: number;

    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

    if (this.orientation === 'vertical') {
      position = (rect.bottom - clientY) / rect.height;
    } else {
      position = (clientX - rect.left) / rect.width;
    }

    return Math.max(0, Math.min(1, position));
  }

  private positionToValue(position: number): number {
    const raw = this.min + position * (this.max - this.min);
    return Math.round(raw / this.step) * this.step;
  }

  private handleTrackMouseDown(e: MouseEvent) {
    if (this.disabled) return;
    const pos = this.getPositionFromEvent(e);
    const val = this.positionToValue(pos);

    // Determine which thumb is closer
    const distLow = Math.abs(val - this.valueLow);
    const distHigh = Math.abs(val - this.valueHigh);

    if (distLow <= distHigh) {
      this.valueLow = Math.min(val, this.valueHigh);
      this.draggingThumb = 'low';
    } else {
      this.valueHigh = Math.max(val, this.valueLow);
      this.draggingThumb = 'high';
    }

    this.emitRangeChange();
    this.startDragging();
  }

  private handleTrackTouchStart(e: TouchEvent) {
    if (this.disabled) return;
    const pos = this.getPositionFromEvent(e);
    const val = this.positionToValue(pos);

    const distLow = Math.abs(val - this.valueLow);
    const distHigh = Math.abs(val - this.valueHigh);

    if (distLow <= distHigh) {
      this.valueLow = Math.min(val, this.valueHigh);
      this.draggingThumb = 'low';
    } else {
      this.valueHigh = Math.max(val, this.valueLow);
      this.draggingThumb = 'high';
    }

    this.emitRangeChange();
    this.startDragging();
  }

  private handleLowThumbMouseDown(e: MouseEvent) {
    if (this.disabled) return;
    e.stopPropagation();
    this.draggingThumb = 'low';
    this.startDragging();
  }

  private handleLowThumbTouchStart(e: TouchEvent) {
    if (this.disabled) return;
    e.stopPropagation();
    this.draggingThumb = 'low';
    this.startDragging();
  }

  private handleHighThumbMouseDown(e: MouseEvent) {
    if (this.disabled) return;
    e.stopPropagation();
    this.draggingThumb = 'high';
    this.startDragging();
  }

  private handleHighThumbTouchStart(e: TouchEvent) {
    if (this.disabled) return;
    e.stopPropagation();
    this.draggingThumb = 'high';
    this.startDragging();
  }

  private startDragging() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  }

  private stopDragging() {
    this.draggingThumb = null;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.emitRangeChange();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.draggingThumb) return;
    this.updateFromEvent(e);
  };

  private handleMouseUp = () => {
    this.stopDragging();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.draggingThumb) return;
    this.updateFromEvent(e);
  };

  private handleTouchEnd = () => {
    this.stopDragging();
  };

  private updateFromEvent(e: MouseEvent | TouchEvent) {
    const pos = this.getPositionFromEvent(e);
    const val = this.positionToValue(pos);

    if (this.draggingThumb === 'low') {
      this.valueLow = Math.min(val, this.valueHigh);
    } else if (this.draggingThumb === 'high') {
      this.valueHigh = Math.max(val, this.valueLow);
    }
    this.emitRangeChange();
  }

  private handleLowKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;
    let handled = false;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this.valueLow = Math.max(this.min, this.valueLow - this.step);
        handled = true;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this.valueLow = Math.min(this.valueHigh, this.valueLow + this.step);
        handled = true;
        break;
      case 'Home':
        this.valueLow = this.min;
        handled = true;
        break;
      case 'End':
        this.valueLow = this.valueHigh;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.emitRangeChange();
    }
  }

  private handleHighKeyDown(e: KeyboardEvent) {
    if (this.disabled) return;
    let handled = false;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this.valueHigh = Math.max(this.valueLow, this.valueHigh - this.step);
        handled = true;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this.valueHigh = Math.min(this.max, this.valueHigh + this.step);
        handled = true;
        break;
      case 'Home':
        this.valueHigh = this.valueLow;
        handled = true;
        break;
      case 'End':
        this.valueHigh = this.max;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.emitRangeChange();
    }
  }

  @watch('valueLow', 'valueHigh')
  handleValuesChange() {
    this.clampValues();
  }

  @dispatch('range-change', { bubbles: true, composed: true })
  private emitRangeChange() {
    return { valueLow: this.valueLow, valueHigh: this.valueHigh, component: this };
  }

  disconnectedCallback() {
    this.stopDragging();
  }
}
