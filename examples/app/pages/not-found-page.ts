import { page } from '../router';
import { render, styles, html, css } from 'snice';

@page({ tag: 'not-found-page', routes: ['/404'] })
export class NotFoundPage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <app-nav></app-nav>
      <div class="container">
        <div class="error-content">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist.</p>
          <a href="#/" class="home-link">Go Home</a>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
      }
      
      .error-content {
        text-align: center;
        background: white;
        padding: 3rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .error-content h1 {
        font-size: 6rem;
        color: #667eea;
        margin: 0;
      }
      
      .error-content h2 {
        color: #333;
        margin: 1rem 0;
      }
      
      .error-content p {
        color: #666;
        margin-bottom: 2rem;
      }
      
      .home-link {
        display: inline-block;
        padding: 0.75rem 2rem;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
      }
      
      .home-link:hover {
        background: #5a67d8;
      }
    `;
  }
}