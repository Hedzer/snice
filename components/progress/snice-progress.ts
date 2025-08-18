import { element, property, watch, ready, query, dispatch } from '../../src/index';
import css from './snice-progress.css?inline';
import type { ProgressVariant, ProgressSize, ProgressColor, SniceProgressElement } from './snice-progress.types';

@element('snice-progress')
export class SniceProgress extends HTMLElement implements SniceProgressElement {
  @property({ type: Number, reflect: true })
  value = 0;

  @property({ type: Number, reflect: true })
  max = 100;

  @property({ reflect: true })
  variant: ProgressVariant = 'linear';

  @property({ reflect: true })
  size: ProgressSize = 'medium';

  @property({ reflect: true })
  color: ProgressColor = 'primary';

  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  @property({ type: Boolean, attribute: 'show-label', reflect: true })
  showLabel = false;

  @property({ reflect: true })
  label = '';

  @property({ type: Boolean, reflect: true })
  striped = false;

  @property({ type: Boolean, reflect: true })
  animated = false;

  @property({ type: Number, reflect: true })
  thickness = 4;

  @query('.progress__bar')
  progressBar?: HTMLElement;

  @query('.progress__circle-bar')
  circleBar?: SVGCircleElement;

  @query('.progress__label')
  labelElement?: HTMLElement;

  @query('.progress__circle-label')
  circleLabelElement?: HTMLElement;

  private radius = 0;
  private circumference = 0;

  html() {
    if (this.variant === 'circular') {
      return this.renderCircular();
    }
    return this.renderLinear();
  }

  css() {
    return css;
  }

  private renderLinear() {
    const percentage = this.getPercentage();
    const labelText = this.label || `${Math.round(percentage)}%`;
    
    return /*html*/`
      <div class="progress progress--linear ${this.showLabel ? 'progress--with-label' : ''}" 
           role="progressbar" 
           aria-valuenow="${this.value}"
           aria-valuemin="0"
           aria-valuemax="${this.max}"
           aria-label="${labelText}">
        <div class="progress__bar" style="width: ${this.indeterminate ? '' : percentage + '%'}">
          ${this.showLabel ? /*html*/`
            <span class="progress__label">${labelText}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderCircular() {
    const size = this.getSizeValue();
    const strokeWidth = this.thickness;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = this.getPercentage();
    const offset = this.indeterminate ? 0 : circumference - (percentage / 100) * circumference;
    const labelText = this.label || `${Math.round(percentage)}%`;
    
    this.radius = radius;
    this.circumference = circumference;
    
    return /*html*/`
      <div class="progress progress--circular" 
           role="progressbar"
           aria-valuenow="${this.value}"
           aria-valuemin="0"
           aria-valuemax="${this.max}"
           aria-label="${labelText}">
        <svg class="progress__circle" viewBox="0 0 ${size} ${size}">
          <circle
            class="progress__circle-bg"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
          />
          <circle
            class="progress__circle-bar"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        </svg>
        ${this.showLabel && !this.indeterminate ? /*html*/`
          <div class="progress__circle-label">${labelText}</div>
        ` : ''}
      </div>
    `;
  }

  @ready()
  init() {
    this.updateProgress();
  }

  @watch('value', 'max', 'indeterminate')
  handleProgressChange() {
    this.updateProgress();
    this.dispatchProgressChange();
  }

  @watch('variant')
  handleVariantChange() {
    // Re-render when variant changes
    const shadow = this.shadowRoot;
    if (shadow) {
      shadow.innerHTML = '';
      if (this.css) {
        const style = document.createElement('style');
        style.textContent = this.css();
        shadow.appendChild(style);
      }
      const template = document.createElement('template');
      template.innerHTML = this.html();
      shadow.appendChild(template.content.cloneNode(true));
      
      // Re-query elements after re-render
      this.progressBar = shadow.querySelector('.progress__bar') as HTMLElement;
      this.circleBar = shadow.querySelector('.progress__circle-bar') as SVGCircleElement;
      this.labelElement = shadow.querySelector('.progress__label') as HTMLElement;
      this.circleLabelElement = shadow.querySelector('.progress__circle-label') as HTMLElement;
      
      this.updateProgress();
    }
  }

  @watch('showLabel', 'label')
  handleLabelChange() {
    this.updateLabel();
  }

  @watch('thickness')
  handleThicknessChange() {
    if (this.variant === 'circular') {
      this.style.setProperty('--progress-spinner-stroke', `${this.thickness}px`);
      this.handleVariantChange(); // Re-render circular to update stroke
    }
  }

  private updateProgress() {
    const percentage = this.getPercentage();
    
    if (this.variant === 'linear' && this.progressBar) {
      if (!this.indeterminate) {
        this.progressBar.style.width = `${percentage}%`;
      }
      
      // Update ARIA attributes
      this.progressBar.parentElement?.setAttribute('aria-valuenow', String(this.value));
      this.progressBar.parentElement?.setAttribute('aria-valuemax', String(this.max));
    } else if (this.variant === 'circular' && this.circleBar) {
      if (!this.indeterminate) {
        const offset = this.circumference - (percentage / 100) * this.circumference;
        this.circleBar.style.strokeDashoffset = String(offset);
      }
      
      // Update ARIA attributes
      this.circleBar.parentElement?.parentElement?.setAttribute('aria-valuenow', String(this.value));
      this.circleBar.parentElement?.parentElement?.setAttribute('aria-valuemax', String(this.max));
    }
    
    this.updateLabel();
  }

  private updateLabel() {
    const percentage = this.getPercentage();
    const labelText = this.label || `${Math.round(percentage)}%`;
    
    if (this.labelElement) {
      this.labelElement.textContent = labelText;
    }
    if (this.circleLabelElement) {
      this.circleLabelElement.textContent = labelText;
    }
  }

  getPercentage(): number {
    if (this.indeterminate) return 0;
    if (this.max === 0) return 0;
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }

  setProgress(value: number, max?: number) {
    this.value = value;
    if (max !== undefined) {
      this.max = max;
    }
  }

  private getSizeValue(): number {
    switch (this.size) {
      case 'small': return 24;
      case 'large': return 56;
      case 'xl': return 80;
      case 'xxl': return 120;
      case 'xxxl': return 160;
      default: return 40;
    }
  }

  @dispatch('progress-change', { bubbles: true, composed: true })
  private dispatchProgressChange() {
    return {
      value: this.value,
      max: this.max,
      percentage: this.getPercentage(),
      indeterminate: this.indeterminate
    };
  }
}