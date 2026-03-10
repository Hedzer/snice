import { page } from '../router';
import { render, styles, html, css, context, observe, dispose } from 'snice';
import type { Placard, Context } from 'snice';
import type { Principal } from '../types/auth';
import { isAuthenticated } from '../guards/auth';
import type { NotificationsDaemon } from '../daemons/notifications';

const placard: Placard = {
  name: 'dashboard',
  title: 'Dashboard',
  icon: '\ud83d\udcca',
  show: true,
  order: 1
};

@page({ tag: 'dashboard-page', routes: ['/', '/dashboard'], guards: [isAuthenticated], placard })
export class DashboardPage extends HTMLElement {
  userName = '';
  notificationCount = 0;
  isCompact = false;
  private unsubscribe: (() => void) | null = null;

  @context()
  handleContext(ctx: Context) {
    const principal = ctx.application.principal as Principal | undefined;
    this.userName = principal?.user?.name || 'User';

    const daemon = ctx.application.notifications as NotificationsDaemon;
    if (daemon && !this.unsubscribe) {
      this.unsubscribe = daemon.subscribe(() => {
        this.notificationCount++;
      });
    }
  }

  @dispose()
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  @observe('media:(max-width: 768px)')
  handleMediaChange(matches: boolean) {
    this.isCompact = matches;
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <div class="welcome">
          <h1>Welcome, ${this.userName}!</h1>
          <p class="subtitle">This is your dashboard</p>
        </div>

        <div class="stats">
          <snice-card class="stat-card">
            <span class="stat-value">4</span>
            <span class="stat-label">Active Pages</span>
          </snice-card>
          <snice-card class="stat-card">
            <span class="stat-value">${this.notificationCount}</span>
            <span class="stat-label">Notifications</span>
          </snice-card>
          <snice-card class="stat-card">
            <span class="stat-value">3</span>
            <span class="stat-label">Middleware</span>
          </snice-card>
        </div>

        <div class="grid">
          <snice-card>
            <h3>Features</h3>
            <ul>
              <li>JWT Authentication</li>
              <li>Protected Routes with Guards</li>
              <li>Middleware Pattern</li>
              <li>Service Worker (PWA)</li>
              <li>Live Notifications</li>
              <li>Controllers + Request/Response</li>
              <li>Theme Switching</li>
              <li>Debounced Search</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>Architecture</h3>
            <ul>
              <li><strong>Pages:</strong> Route orchestrators</li>
              <li><strong>Components:</strong> Reusable UI</li>
              <li><strong>Controllers:</strong> Behavior modules</li>
              <li><strong>Services:</strong> Business logic</li>
              <li><strong>Middleware:</strong> Fetch interceptors</li>
              <li><strong>Daemons:</strong> Lifecycle classes</li>
              <li><strong>Guards:</strong> Route protection</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>Decorators Used</h3>
            <ul>
              <li><code>@page</code> - Route pages</li>
              <li><code>@element</code> - Custom elements</li>
              <li><code>@controller</code> - Behavior modules</li>
              <li><code>@context</code> - Global state</li>
              <li><code>@observe</code> - DOM observers</li>
              <li><code>@watch</code> - Property watchers</li>
              <li><code>@on</code> / <code>@dispatch</code> - Events</li>
              <li><code>@request</code> / <code>@respond</code> - Communication</li>
            </ul>
          </snice-card>

          <snice-card>
            <h3>Explore</h3>
            <p>Check out the other pages:</p>
            <div class="links">
              <a href="#/data">
                <snice-button variant="secondary">Browse Data</snice-button>
              </a>
              <a href="#/settings">
                <snice-button variant="secondary">Settings</snice-button>
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

      .welcome {
        margin-bottom: 2rem;
      }

      h1 {
        color: var(--primary-color);
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: var(--text-light);
        margin: 0;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        padding: 1.25rem;
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-label {
        display: block;
        font-size: 0.8125rem;
        color: var(--text-light);
        margin-top: 0.25rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

      code {
        background: var(--bg-secondary);
        padding: 0.125rem 0.375rem;
        border-radius: var(--radius-sm);
        font-size: 0.8125rem;
      }

      p {
        color: var(--text-light);
        margin: 0 0 0.5rem 0;
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

      .links snice-button {
        width: 100%;
      }

      @media (max-width: 640px) {
        .stats {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}
