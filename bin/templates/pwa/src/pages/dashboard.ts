import { page } from '../router';
import { render, styles, html, css, context } from 'snice';
import type { Placard, Context } from 'snice';
import type { Principal } from '../types/auth';
import { authGuard } from '../guards/auth';

const placard: Placard = {
  name: 'dashboard',
  title: 'Dashboard',
  icon: '📊',
  show: true,
  order: 1
};

@page({ tag: 'dashboard-page', routes: ['/', '/dashboard'], guards: [authGuard], placard })
export class DashboardPage extends HTMLElement {
  userName = '';

  @context()
  handleContext(ctx: Context) {
    const principal = ctx.application.principal as Principal | undefined;
    this.userName = principal?.user?.name || 'User';
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <h1>Welcome, ${this.userName}!</h1>
        <p class="subtitle">This is your dashboard</p>

        <div class="grid">
          <snice-card>
            <h3>⚡ Features</h3>
            <ul>
              <li>JWT Authentication</li>
              <li>Protected Routes</li>
              <li>Middleware Pattern</li>
              <li>Service Worker</li>
              <li>Live Notifications</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>🛠️ Architecture</h3>
            <ul>
              <li><strong>Utils:</strong> Pure functions</li>
              <li><strong>Services:</strong> Business logic</li>
              <li><strong>Middleware:</strong> Fetch interceptors</li>
              <li><strong>Daemons:</strong> Lifecycle classes</li>
              <li><strong>Guards:</strong> Route protection</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>📦 What's Included</h3>
            <ul>
              <li>TypeScript configuration</li>
              <li>Vite + SWC setup</li>
              <li>PWA manifest</li>
              <li>Mock authentication</li>
              <li>WebSocket daemon example</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>🚀 Get Started</h3>
            <p>Check out the other pages:</p>
            <div class="links">
              <a href="#/profile">
                <snice-button variant="secondary">View Profile</snice-button>
              </a>
              <a href="#/notifications">
                <snice-button variant="secondary">Notifications</snice-button>
              </a>
            </div>
          </snice-card>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        color: var(--primary-color);
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: var(--text-light);
        margin: 0 0 2rem 0;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      snice-card {
        padding: 1.5rem;
      }

      h3 {
        margin: 0 0 1rem 0;
        color: var(--primary-color);
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      li {
        margin: 0.5rem 0;
        color: var(--text-color);
      }

      .links {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .links a {
        text-decoration: none;
      }

      snice-button {
        width: 100%;
      }
    `;
  }
}
