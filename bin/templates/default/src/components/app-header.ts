import { element, property, render, styles, context, on, dispatch, dispose, html, css, watch, query } from 'snice';
import type { Context } from 'snice';
import type { Principal, User } from '../types/auth';
import type { NotificationsDaemon } from '../daemons/notifications';
import { logout } from '../services/auth';

@element('app-header')
export class AppHeader extends HTMLElement {
  @property() userName = '';
  @property() userAvatar = '';
  @property({ type: Boolean }) authenticated = false;
  @property({ type: Boolean }) menuOpen = false;
  @property({ type: Number }) notificationCount = 0;
  private unsubscribeNotifications: (() => void) | null = null;

  @query('.user-menu') $menu!: HTMLElement;

  @context()
  handleContext(ctx: Context) {
    const principal = ctx.application.principal as Principal | undefined;
    const user = principal?.user;
    this.authenticated = principal?.isAuthenticated || false;
    this.userName = user?.name || '';
    this.userAvatar = user?.avatar || '';

    const daemon = ctx.application.notifications as NotificationsDaemon;
    if (daemon && !this.unsubscribeNotifications) {
      this.unsubscribeNotifications = daemon.subscribe(() => {
        this.notificationCount++;
      });
    }
  }

  @dispose()
  cleanupNotifications() {
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
      this.unsubscribeNotifications = null;
    }
  }

  @watch('menuOpen')
  onMenuToggle() {
    if (this.$menu) {
      this.$menu.style.display = this.menuOpen ? 'block' : 'none';
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  @on('keydown:Escape')
  closeMenu() {
    this.menuOpen = false;
  }

  @dispatch('header-logout')
  async handleLogout() {
    await logout();
    window.location.hash = '#/login';
    return { loggedOut: true };
  }

  @render()
  renderContent() {
    return html`
      <header>
        <div class="brand">
          <a href="#/">{{projectName}}</a>
        </div>

        <if ${this.authenticated}>
          <nav class="nav-links">
            <a href="#/dashboard">Dashboard</a>
            <a href="#/data">Data</a>
            <a href="#/notifications">
              <notification-badge .count=${this.notificationCount}></notification-badge>
              Notifications
            </a>
          </nav>

          <div class="user-section">
            <button class="user-btn" @click=${this.toggleMenu}>
              <if ${this.userAvatar}>
                <snice-avatar
                  src="${this.userAvatar}"
                  name="${this.userName}"
                  size="small"
                ></snice-avatar>
              </if>
              <if ${!this.userAvatar}>
                <snice-avatar
                  name="${this.userName}"
                  size="small"
                ></snice-avatar>
              </if>
              <span class="user-name">${this.userName}</span>
            </button>

            <div class="user-menu" style="display: none">
              <a href="#/profile" @click=${() => this.menuOpen = false}>Profile</a>
              <a href="#/settings" @click=${() => this.menuOpen = false}>Settings</a>
              <snice-divider></snice-divider>
              <button @click=${this.handleLogout}>Sign Out</button>
            </div>
          </div>
        </if>

        <if ${!this.authenticated}>
          <a href="#/login" class="login-link">Sign In</a>
        </if>
      </header>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
        height: 60px;
        background: var(--snice-color-background);
        border-bottom: 1px solid var(--snice-color-border);
      }

      .brand a {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--snice-color-primary);
        text-decoration: none;
      }

      .nav-links {
        display: flex;
        gap: 1.5rem;
        align-items: center;
      }

      .nav-links a {
        color: var(--snice-color-text-secondary);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .nav-links a:hover {
        color: var(--snice-color-primary);
      }

      .user-section {
        position: relative;
      }

      .user-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.375rem 0.5rem;
        border-radius: var(--snice-border-radius-lg);
        color: var(--text-color);
      }

      .user-btn:hover {
        background: var(--bg-secondary);
      }

      .user-name {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .user-menu {
        position: absolute;
        right: 0;
        top: 100%;
        margin-top: 0.5rem;
        min-width: 180px;
        background: var(--snice-color-background);
        border: 1px solid var(--snice-color-border);
        border-radius: var(--snice-border-radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 0.5rem 0;
        z-index: 100;
      }

      .user-menu a,
      .user-menu button {
        display: block;
        width: 100%;
        padding: 0.5rem 1rem;
        color: var(--text-color);
        text-decoration: none;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        font-size: 0.875rem;
      }

      .user-menu a:hover,
      .user-menu button:hover {
        background: var(--bg-secondary);
        color: var(--snice-color-primary);
      }

      .login-link {
        color: var(--snice-color-primary);
        text-decoration: none;
        font-weight: 500;
      }

      @media (max-width: 640px) {
        .nav-links {
          display: none;
        }
        .user-name {
          display: none;
        }
      }
    `;
  }
}
