import { element, property, dispatch, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-rating.css?inline';
import type { RatingPrecision, RatingSize, SniceRatingElement } from './snice-rating.types';

@element('snice-rating')
export class SniceRating extends HTMLElement implements SniceRatingElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 5;

  @property()
  icon = '\u2605';

  @property()
  size: RatingSize = 'medium';

  @property({ type: Boolean })
  readonly = false;

  @property()
  precision: RatingPrecision = 'full';

  @dispatch('rating-change', { bubbles: true, composed: true })
  private emitRatingChange() {
    return { value: this.value };
  }

  private handleClick(index: number, event: MouseEvent) {
    if (this.readonly) return;

    if (this.precision === 'half') {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const isLeftHalf = (event.clientX - rect.left) < rect.width / 2;
      this.value = isLeftHalf ? index + 0.5 : index + 1;
    } else {
      this.value = index + 1;
    }

    this.emitRatingChange();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.readonly) return;

    const step = this.precision === 'half' ? 0.5 : 1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.value = Math.min(this.max, this.value + step);
      this.emitRatingChange();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.value = Math.max(0, this.value - step);
      this.emitRatingChange();
    }
  }

  private getStarFill(index: number): number {
    const diff = this.value - index;
    if (diff >= 1) return 100;
    if (diff <= 0) return 0;
    return Math.round(diff * 100);
  }

  @render()
  template() {
    const stars = Array.from({ length: this.max }, (_, i) => {
      const fill = this.getStarFill(i);
      return html`
        <span class="star"
              role="radio"
              aria-checked="${fill > 0 ? 'true' : 'false'}"
              aria-label="${`${i + 1} of ${this.max}`}"
              @click=${(e: MouseEvent) => this.handleClick(i, e)}>
          <span class="star-empty">${this.icon}</span>
          <span class="star-full" style="width: ${fill}%">${this.icon}</span>
        </span>
      `;
    });

    return html`
      <div class="rating"
           role="radiogroup"
           aria-label="Rating"
           tabindex="${this.readonly ? '-1' : '0'}"
           @keydown=${this.handleKeydown}>
        ${stars}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
