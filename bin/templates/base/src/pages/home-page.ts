import { page } from '../router';
import { render, styles, html, css } from 'snice';
import type { Placard } from 'snice';

const placard: Placard = {
  name: 'home',
  title: 'Home',
  icon: '🏠',
  show: true,
  order: 1
};

@page({ tag: 'home-page', routes: ['/'], placard })
export class HomePage extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="container">
        <h1>Welcome to {{projectName}}</h1>
        <p>Built with Snice</p>

        <div class="features">
          <feature-card
            icon="⚡"
            title="Fast & Lightweight"
            description="No virtual DOM overhead. Direct DOM updates with differential rendering.">
          </feature-card>

          <feature-card
            icon="🎨"
            title="Type-Safe"
            description="Full TypeScript support with decorators for clean, maintainable code.">
          </feature-card>

          <feature-card
            icon="🔧"
            title="Web Standards"
            description="Built on native Web Components. Works everywhere, no framework lock-in.">
          </feature-card>
        </div>

        <snice-card class="demo-section">
          <h2>Interactive Counter Demo</h2>
          <p>This counter persists its state using a controller:</p>
          <counter-button controller="counter"></counter-button>
        </snice-card>

        <div class="nav">
          <snice-button variant="primary" size="medium">
            <a href="#/about" style="color: inherit; text-decoration: none;">Learn More</a>
          </snice-button>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .container {
        padding: 3rem;
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
      }
      
      h1 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 2.5rem;
      }
      
      h2 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
      
      p {
        color: var(--text-light);
        margin-bottom: 2rem;
      }
      
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin: 3rem 0;
      }

      .demo-section {
        margin: 3rem 0;
        text-align: center;
      }

      .demo-section h2 {
        margin-top: 0;
      }

      .nav {
        margin-top: 3rem;
      }
    `;
  }
}