import { page } from '../router';
import { render, styles, html, css } from 'snice';

@page({ tag: 'not-found-page', routes: ['/404'] })
export class NotFoundPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>404</h1>
        <p>Page not found</p>
        <snice-button variant="primary">
          <a href="#/" style="color: inherit; text-decoration: none;">Go Home</a>
        </snice-button>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 2rem;
      }

      h1 {
        font-size: 6rem;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.5rem;
        color: var(--text-light);
        margin-bottom: 2rem;
      }
    `;
  }
}
