import { element, property, watch, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-divider.css?inline';
import type { DividerOrientation, DividerVariant, DividerAlign, DividerSpacing, SniceDividerElement } from './snice-divider.types';

@element('snice-divider')
export class SniceDivider extends HTMLElement implements SniceDividerElement {
  @property({  })
  orientation: DividerOrientation = 'horizontal';

  @property({  })
  variant: DividerVariant = 'solid';

  @property({  })
  spacing: DividerSpacing = 'medium';

  @property({  })
  align: DividerAlign = 'center';

  @property({  })
  text = '';

  @property({ attribute: 'text-background',  })
  textBackground = '';

  @property({  })
  color = '';

  @property({ type: Boolean,  })
  capped = false;

  @render()
  render() {
    if (this.text && this.orientation === 'horizontal') {
      return html/*html*/`
        <div class="divider-container" role="separator" aria-orientation="${this.orientation}">
          <div class="divider divider--before"></div>
          <span class="divider-text">${this.text}</span>
          <div class="divider divider--after"></div>
        </div>
      `;
    }
    return html/*html*/`<div class="divider" role="separator" aria-orientation="${this.orientation}"></div>`;
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
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