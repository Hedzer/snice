import { layout, render, styles, html, css, property, context, observe, on, dispatch } from 'snice';
import type { Layout, Placard, Context } from 'snice';
import type { DashboardAppContext, User } from '../types/app';

@layout('dashboard-shell')
export class DashboardShell extends HTMLElement implements Layout {
  @property() route = '';
  @property({ type: Boolean }) sidebarOpen = true;
  @property({ type: Boolean }) isDesktop = true;

  placards: Placard[] = [];
  user: User | null = null;
  private ctx?: Context;

  update(app: DashboardAppContext | any, placards: Placard[], route: string, _params: Record<string, string>) {
    const myApp = app as DashboardAppContext;
    this.placards = placards;
    this.route = route;
    this.user = myApp.user;
  }

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as DashboardAppContext;
    this.user = app.user;
  }

  @observe('media:(min-width: 768px)')
  handleMediaChange(matches: boolean) {
    this.isDesktop = matches;
    this.sidebarOpen = matches;
  }

  @on('click', '.sidebar-toggle')
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  @on('click', '.nav-link')
  handleNavClick() {
    if (!this.isDesktop) {
      this.sidebarOpen = false;
    }
  }

  @on('click', '.overlay')
  handleOverlayClick() {
    this.sidebarOpen = false;
  }

  @dispatch('theme-changed')
  handleThemeToggle() {
    if (this.ctx) {
      const app = this.ctx.application as DashboardAppContext;
      const current = app.theme || 'dark';
      app.theme = current === 'dark' ? 'light' : 'dark';
      this.ctx.update();
      return { theme: app.theme };
    }
    return { theme: 'dark' };
  }

  @render()
  renderContent() {
    const sortedPlacards = [...this.placards]
      .filter((p) => p.show !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const isSidebarVisible = this.sidebarOpen;

    return html`
      <div class="layout" ?data-sidebar-open=${isSidebarVisible} ?data-desktop=${this.isDesktop}>
        <if ${!this.isDesktop && isSidebarVisible}>
          <div class="overlay"></div>
        </if>

        <aside class="sidebar" ?data-open=${isSidebarVisible}>
          <div class="sidebar-brand">
            <svg class="logo" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#6366f1"/>
              <path d="M8 14l4 4 8-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="brand-text">Analytics</span>
          </div>

          <nav class="nav">
            ${sortedPlacards.map(
              (p) => html`
                <a
                  href="/#/${p.name}"
                  class="nav-link"
                  ?data-active=${this.route === '/' + p.name || (p.name === 'overview' && (this.route === '/' || this.route === ''))}
                >
                  <span class="nav-icon">${p.icon || ''}</span>
                  <span class="nav-label">${p.title}</span>
                </a>
              `
            )}
          </nav>

          <div class="sidebar-footer">
            <if ${this.user !== null}>
              <div class="user-info">
                <div class="user-avatar">${this.user!.name.charAt(0)}</div>
                <div class="user-details">
                  <div class="user-name">${this.user!.name}</div>
                  <div class="user-role">${this.user!.role}</div>
                </div>
              </div>
            </if>
          </div>
        </aside>

        <div class="main">
          <header class="header">
            <button class="sidebar-toggle" aria-label="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
              </svg>
            </button>
            <div class="header-spacer"></div>
            <button class="icon-btn" @click=${() => this.handleThemeToggle()} title="Toggle theme">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
              </svg>
            </button>
          </header>
          <div class="content">
            <slot name="page"></slot>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
        height: 100%;
      }

      .layout {
        display: flex;
        height: 100%;
        position: relative;
      }

      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 40;
      }

      /* Sidebar */
      .sidebar {
        width: var(--dash-sidebar-width, 240px);
        background: var(--dash-surface, #1e293b);
        border-right: 1px solid var(--dash-border, #334155);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        transition: transform 0.2s ease;
        z-index: 50;
        height: 100%;
      }

      .sidebar:not([data-open]) {
        transform: translateX(-100%);
        position: absolute;
      }

      .sidebar[data-open] {
        transform: translateX(0);
      }

      .layout:not([data-desktop]) .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--dash-border, #334155);
        height: var(--dash-header-height, 56px);
      }

      .logo {
        flex-shrink: 0;
      }

      .brand-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--dash-text, #f1f5f9);
      }

      /* Nav */
      .nav {
        flex: 1;
        padding: 0.75rem 0.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        border-radius: var(--dash-radius, 8px);
        color: var(--dash-text-secondary, #94a3b8);
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s ease;
        cursor: pointer;
        text-decoration: none;
      }

      .nav-link:hover {
        background: var(--dash-surface-hover, #334155);
        color: var(--dash-text, #f1f5f9);
      }

      .nav-link[data-active] {
        background: var(--dash-primary, #6366f1);
        color: white;
      }

      .nav-icon {
        font-size: 1.125rem;
        width: 1.5rem;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Sidebar footer */
      .sidebar-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--dash-border, #334155);
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }

      .user-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: var(--dash-primary, #6366f1);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
        flex-shrink: 0;
      }

      .user-details {
        overflow: hidden;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--dash-text, #f1f5f9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 0.6875rem;
        color: var(--dash-text-muted, #64748b);
        text-transform: capitalize;
      }

      /* Main content */
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 1.25rem;
        height: var(--dash-header-height, 56px);
        border-bottom: 1px solid var(--dash-border, #334155);
        background: var(--dash-surface, #1e293b);
        flex-shrink: 0;
      }

      .header-spacer {
        flex: 1;
      }

      .sidebar-toggle {
        background: none;
        border: none;
        color: var(--dash-text-secondary, #94a3b8);
        cursor: pointer;
        padding: 0.375rem;
        border-radius: var(--dash-radius, 8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sidebar-toggle:hover {
        background: var(--dash-surface-hover, #334155);
        color: var(--dash-text, #f1f5f9);
      }

      .icon-btn {
        background: none;
        border: none;
        color: var(--dash-text-secondary, #94a3b8);
        cursor: pointer;
        padding: 0.375rem;
        border-radius: var(--dash-radius, 8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn:hover {
        background: var(--dash-surface-hover, #334155);
        color: var(--dash-text, #f1f5f9);
      }

      .content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }
    `;
  }
}
