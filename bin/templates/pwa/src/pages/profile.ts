import { page } from '../router';
import { render, styles, html, css, context } from 'snice';
import type { Placard, Context } from 'snice';
import type { Principal, User } from '../types/auth';
import { authGuard } from '../guards/auth';
import { logout } from '../services/auth';

const placard: Placard = {
  name: 'profile',
  title: 'Profile',
  icon: '👤',
  show: true,
  order: 2
};

@page({ tag: 'profile-page', routes: ['/profile'], guards: [authGuard], placard })
export class ProfilePage extends HTMLElement {
  user: User | null = null;
  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const principal = ctx.application.principal as Principal | undefined;
    this.user = principal?.user || null;
  }

  async handleLogout() {
    await logout();

    // Update context to reflect logged out state
    if (this.ctx && this.ctx.application.principal) {
      const principal = this.ctx.application.principal as Principal;
      principal.user = null;
      principal.isAuthenticated = false;
    }

    window.location.href = '#/login';
  }

  @render()
  renderContent() {
    if (!this.user) {
      return html`<div class="container"><snice-spinner></snice-spinner></div>`;
    }

    return html`
      <div class="container">
        <snice-card class="profile-card">
          <div class="header">
            <snice-avatar
              src="${this.user.avatar}"
              name="${this.user.name}"
              size="large"
            ></snice-avatar>
            <h1>${this.user.name}</h1>
            <p class="email">${this.user.email}</p>
          </div>

          <div class="section">
            <h3>Account Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">User ID:</span>
                <span class="value">${this.user.id}</span>
              </div>
              <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">${this.user.email}</span>
              </div>
              <div class="info-item">
                <span class="label">Name:</span>
                <span class="value">${this.user.name}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Session</h3>
            <p>You are currently logged in with JWT authentication.</p>
            <snice-button
              variant="danger"
              @click=${this.handleLogout}
            >
              Sign Out
            </snice-button>
          </div>
        </snice-card>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .profile-card {
        padding: 2rem;
      }

      .header {
        text-align: center;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border-color);
      }

      snice-avatar {
        margin-bottom: 1rem;
      }

      h1 {
        margin: 0 0 0.5rem 0;
        color: var(--primary-color);
      }

      .email {
        margin: 0;
        color: var(--text-light);
      }

      .section {
        padding-top: 2rem;
      }

      h3 {
        margin: 0 0 1rem 0;
        color: var(--primary-color);
      }

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .label {
        font-weight: 600;
        color: var(--text-color);
      }

      .value {
        color: var(--text-light);
      }

      .section p {
        margin: 0 0 1rem 0;
        color: var(--text-light);
      }
    `;
  }
}
