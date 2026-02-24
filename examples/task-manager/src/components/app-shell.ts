import { layout, render, styles, context, property, on, html, css } from 'snice';
import type { Layout, Placard, Context, AppContext } from 'snice';
import type { AppContext as MyAppContext } from '../router';
import type { Principal } from '../types/auth';
import { logout } from '../services/auth';

@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  @property() currentRoute = '';
  placards: Placard[] = [];
  private ctx?: Context;
  private user: { name: string; role: string } | null = null;
  private theme: 'light' | 'dark' = 'light';

  update(app: AppContext, placards: Placard[], route: string, params: Record<string, string>) {
    const myApp = app as unknown as MyAppContext;
    this.placards = placards.filter((p) => p.show !== false);
    this.currentRoute = route;
    const principal = myApp.principal as Principal;
    this.user = principal.user ? { name: principal.user.name, role: principal.user.role } : null;
    this.theme = myApp.theme || 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const myApp = ctx.application as unknown as MyAppContext;
    this.theme = myApp.theme || 'light';
    const principal = myApp.principal as Principal;
    this.user = principal.user ? { name: principal.user.name, role: principal.user.role } : null;
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  @on('click', '.logout-btn')
  handleLogout() {
    logout();
    if (this.ctx) {
      const myApp = this.ctx.application as unknown as MyAppContext;
      myApp.principal.user = null;
      myApp.principal.isAuthenticated = false;
      this.ctx.update();
    }
    window.location.hash = '#/login';
  }

  @on('click', '.theme-toggle')
  toggleTheme() {
    if (!this.ctx) return;
    const myApp = this.ctx.application as unknown as MyAppContext;
    myApp.theme = myApp.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('task-manager-theme', myApp.theme);
    this.ctx.update();
  }

  @render()
  renderContent() {
    const isLoggedIn = this.user !== null;
    return html`
      <if ${isLoggedIn}>
        <header class="header">
          <div class="header__left">
            <a href="/#/board" class="logo">
              <span class="logo__icon">&#9776;</span>
              <span class="logo__text">TaskFlow</span>
            </a>
            <nav class="nav">
              ${this.placards.map(
                (p) => html`
                  <a
                    key=${p.name}
                    href="/#/${p.name}"
                    class="nav__link ${this.currentRoute === '/' + p.name ? 'nav__link--active' : ''}"
                  >
                    <if ${!!p.icon}><span class="nav__icon">${p.icon}</span></if>
                    ${p.title}
                  </a>
                `
              )}
            </nav>
          </div>
          <div class="header__right">
            <button class="theme-toggle" title="Toggle theme">
              ${this.theme === 'light' ? '\u263E' : '\u2600'}
            </button>
            <div class="user-info">
              <span class="user-name">${this.user?.name}</span>
              <span class="user-role">${this.user?.role}</span>
            </div>
            <button class="logout-btn">Sign Out</button>
          </div>
        </header>
      </if>
      <main class="main">
        <slot name="page"></slot>
      </main>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
        height: 3.5rem;
        background: var(--snice-color-background-element, rgb(255 255 255));
        border-bottom: 1px solid var(--snice-color-border, rgb(226 232 240));
        flex-shrink: 0;
      }

      .header__left {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .header__right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: var(--snice-color-primary, rgb(99 102 241));
        font-weight: 700;
        font-size: 1.125rem;
      }

      .logo__icon {
        font-size: 1.25rem;
      }

      .nav {
        display: flex;
        gap: 0.25rem;
      }

      .nav__link {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        text-decoration: none;
        transition: all 150ms ease;
      }

      .nav__link:hover {
        background: var(--snice-color-background, rgb(248 250 252));
        color: var(--snice-color-text, rgb(15 23 42));
        text-decoration: none;
      }

      .nav__link--active {
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
      }

      .nav__link--active:hover {
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
      }

      .nav__icon {
        font-size: 1rem;
      }

      .theme-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        font-size: 1rem;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        transition: all 150ms ease;
      }

      .theme-toggle:hover {
        background: var(--snice-color-background, rgb(248 250 252));
        color: var(--snice-color-text, rgb(15 23 42));
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.2;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--snice-color-text, rgb(15 23 42));
      }

      .user-role {
        font-size: 0.6875rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        text-transform: capitalize;
      }

      .logout-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 6px;
        background: transparent;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        cursor: pointer;
        transition: all 150ms ease;
      }

      .logout-btn:hover {
        background: var(--snice-color-danger, rgb(239 68 68));
        border-color: var(--snice-color-danger, rgb(239 68 68));
        color: white;
      }

      .main {
        flex: 1;
        overflow: auto;
      }
    `;
  }
}
