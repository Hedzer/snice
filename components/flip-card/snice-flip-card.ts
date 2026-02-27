import { element, property, dispatch, render, styles, watch, html, css as cssTag } from 'snice';
import cssContent from './snice-flip-card.css?inline';
import type { FlipDirection, FlipSide, SniceFlipCardElement } from './snice-flip-card.types';

@element('snice-flip-card')
export class SniceFlipCard extends HTMLElement implements SniceFlipCardElement {
  @property({ type: Boolean })
  flipped = false;

  @property({ type: Boolean, attribute: 'click-to-flip' })
  clickToFlip = true;

  @property()
  direction: FlipDirection = 'horizontal';

  @property({ type: Number })
  duration = 600;

  @dispatch('flip-change', { bubbles: true, composed: true })
  private emitFlipChange() {
    return { flipped: this.flipped, side: (this.flipped ? 'back' : 'front') as FlipSide };
  }

  @watch('duration')
  onDurationChange(_old: number, val: number) {
    this.style.setProperty('--flip-duration', `${val}ms`);
  }

  flip() {
    this.flipped = !this.flipped;
    this.emitFlipChange();
  }

  flipTo(side: FlipSide) {
    const shouldFlip = side === 'back';
    if (this.flipped !== shouldFlip) {
      this.flipped = shouldFlip;
      this.emitFlipChange();
    }
  }

  private handleClick() {
    if (this.clickToFlip) {
      this.flip();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.clickToFlip && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.flip();
    }
  }

  @render()
  template() {
    const tabindex = this.clickToFlip ? '0' : '-1';
    return html`
      <div part="base" class="flip-card"
           tabindex="${tabindex}"
           role="button"
           aria-label="${this.flipped ? 'Flip card, showing back' : 'Flip card, showing front'}"
           @click=${this.handleClick}
           @keydown=${this.handleKeydown}>
        <div part="front" class="front">
          <slot name="front"></slot>
        </div>
        <div part="back" class="back">
          <slot name="back"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
