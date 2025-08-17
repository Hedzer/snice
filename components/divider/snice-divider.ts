import { element, property, watch, query } from '../../src/index';
import css from './snice-divider.css?inline';
import type { DividerOrientation, DividerVariant, DividerAlign, DividerSpacing, SniceDividerElement } from './snice-divider.types';

@element('snice-divider')
export class SniceDivider extends HTMLElement implements SniceDividerElement {
  @property({ reflect: true })
  orientation: DividerOrientation = 'horizontal';

  @property({ reflect: true })
  variant: DividerVariant = 'solid';

  @property({ reflect: true })
  spacing: DividerSpacing = 'medium';

  @property({ reflect: true })
  align: DividerAlign = 'center';

  @property()
  text = '';

  @property({ attribute: 'text-background' })
  textBackground = '';

  @property()
  color = '';

  @property({ type: Boolean, reflect: true })
  capped = false;

  @query('.divider-text')
  textElement?: HTMLElement;

  html() {
    if (this.text && this.orientation === 'horizontal') {
      return /*html*/`
        <div class="divider-container" role="separator" aria-orientation="${this.orientation}">
          <div class="divider divider--before"></div>
          <span class="divider-text">${this.text}</span>
          <div class="divider divider--after"></div>
        </div>
      `;
    }
    return /*html*/`<div class="divider" role="separator" aria-orientation="${this.orientation}"></div>`;
  }

  css() {
    return css;
  }

  @watch('text')
  updateText() {
    if (this.textElement) {
      this.textElement.textContent = this.text;
    }
  }

  @watch('textBackground')
  updateTextBackground() {
    this.style.setProperty('--divider-text-bg', this.textBackground);
  }

  @watch('color')
  updateColor() {
    if (this.color) {
      this.style.setProperty('--divider-color', this.color);
    }
  }
}