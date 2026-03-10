import { page } from '../router';
import { render, styles, html, css, context, dispatch, observe } from 'snice';
import type { Placard, Context } from 'snice';
import type { Principal, User } from '../types/auth';
import { isAuthenticated } from '../guards/auth';
import { logout } from '../services/auth';

const placard: Placard = {
  name: 'profile',
  title: 'Profile',
  icon: '\ud83d\udc64',
  show: true,
  order: 2
};

@page({ tag: 'profile-page', routes: ['/profile'], guards: [isAuthenticated], placard })
export class ProfilePage extends HTMLElement {
  user: User | null = null;
  private ctx?: Context;
  isMobile = false;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const principal = ctx.application.principal as Principal | undefined;
    this.user = principal?.user || null;
  }

  @observe('media:(max-width: 640px)')
  handleMediaChange(matches: boolean) {
    this.isMobile = matches;
  }

  @dispatch('user-logout')
  async handleLogout() {
    await logout();

    if (this.ctx) {
      this.ctx.update();
    }

    window.location.hash = '#/login';
    return { loggedOut: true };
  }

  @render()
  renderContent() {
    const hasUser = this.user !== null;

    return html`
      <div class="container">
        <case ${hasUser ? 'loaded' : 'loading'}>
          <when value="loading">
            <div class="center"><snice-spinner></snice-spinner></div>
          </when>
          <default>
            <snice-card class="profile-card">
              <div class="profile-header">
                <snice-avatar
                  src="${this.user?.avatar || ''}"
                  name="${this.user?.name || ''}"
                  size="large"
                ></snice-avatar>
                <h1>${this.user?.name}</h1>
                <p class="email">${this.user?.email}</p>
                <div class="header-actions">
                  <a href="#/settings">
                    <snice-button variant="secondary" size="small">Edit Profile</snice-button>
                  </a>
                </div>
              </div>

              <snice-divider></snice-divider>

              <div class="section">
                <h3>Account Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">User ID</span>
                    <span class="value">${this.user?.id}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Email</span>
                    <span class="value">${this.user?.email}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Name</span>
                    <span class="value">${this.user?.name}</span>
                  </div>
                </div>
              </div>

              <snice-divider></snice-divider>

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
          </default>
        </case>
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

      .center {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }

      .profile-card {
        padding: 2rem;
      }

      .profile-header {
        text-align: center;
        padding-bottom: 1.5rem;
      }

      snice-avatar {
        margin-bottom: 1rem;
      }

      h1 {
        margin: 0 0 0.5rem 0;
        color: var(--snice-color-primary);
      }

      .email {
        margin: 0 0 1rem 0;
        color: var(--snice-color-text-secondary);
      }

      .header-actions a {
        text-decoration: none;
      }

      snice-divider {
        margin: 0.5rem 0;
      }

      .section {
        padding-top: 1.5rem;
      }

      h3 {
        margin: 0 0 1rem 0;
        color: var(--snice-color-primary);
      }

      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        background: var(--snice-color-background-secondary);
        border-radius: var(--snice-border-radius-md);
      }

      .label {
        font-weight: 600;
        color: var(--snice-color-text);
      }

      .value {
        color: var(--snice-color-text-secondary);
      }

      .section p {
        margin: 0 0 1rem 0;
        color: var(--snice-color-text-secondary);
      }
    `;
  }
}
