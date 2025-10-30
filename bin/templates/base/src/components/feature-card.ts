import { element, property, render, styles, html, css } from 'snice';

@element('feature-card')
export class FeatureCard extends HTMLElement {
  @property() icon = '✨';
  @property() title = '';
  @property() description = '';

  @render()
  renderContent() {
    return html/*html*/`
      <div class="card">
        <div class="card__icon">${this.icon}</div>
        <h3 class="card__title">${this.title}</h3>
        <p class="card__description">${this.description}</p>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      :host {
        display: block;
      }

      .card {
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .card__icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .card__title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--text-color, #333);
      }

      .card__description {
        margin: 0;
        color: var(--text-light, #666);
        line-height: 1.6;
      }
    `;
  }
}
