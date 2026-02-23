import { element, property, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-testimonial.css?inline';
import type { TestimonialVariant, SniceTestimonialElement } from './snice-testimonial.types';

@element('snice-testimonial')
export class SniceTestimonial extends HTMLElement implements SniceTestimonialElement {
  @property()
  quote = '';

  @property()
  author = '';

  @property()
  avatar = '';

  @property()
  role = '';

  @property()
  company = '';

  @property({ type: Number })
  rating = 0;

  @property()
  variant: TestimonialVariant = 'card';

  private renderStars() {
    if (this.rating <= 0) return html``;
    const filled = Math.round(this.rating);
    const stars = Array.from({ length: 5 }, (_, i) =>
      i < filled ? '\u2605' : '\u2606'
    );
    return html`<div class="stars">${stars.join('')}</div>`;
  }

  private renderAvatar() {
    if (!this.avatar) return html``;
    return html`<img class="avatar" src="${this.avatar}" alt="${this.author}" />`;
  }

  private renderRole() {
    const parts: string[] = [];
    if (this.role) parts.push(this.role);
    if (this.company) parts.push(this.company);
    if (parts.length === 0) return html``;
    return html`<div class="author-role">${parts.join(' at ')}</div>`;
  }

  @render()
  template() {
    return html`
      <div class="testimonial">
        <div class="quote-icon">\u201C</div>
        ${this.renderStars()}
        <div class="quote">${this.quote}</div>
        <div class="author-info">
          ${this.renderAvatar()}
          <div>
            <div class="author-name">${this.author}</div>
            ${this.renderRole()}
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
