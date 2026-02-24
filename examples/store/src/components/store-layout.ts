import { layout, render, styles, html, css, context, property, watch } from 'snice';
import type { Context, Layout, Placard } from 'snice';
import type { StoreAppContext } from '../types/store';

@layout('store-layout')
class StoreLayout extends HTMLElement implements Layout {
  placards: Placard[] = [];
  route = '';

  @property({ type: Number }) cartCount = 0;
  @property() userName = '';
  @property({ type: Boolean }) loggedIn = false;

  @context()
  handleContext(ctx: Context) {
    const app = ctx.application as StoreAppContext;
    this.cartCount = app.cartCount;
    this.loggedIn = !!app.user;
    this.userName = app.user?.name ?? '';
  }

  update(_ctx: any, placards: Placard[], route: string, _params: Record<string, string>) {
    this.placards = placards;
    this.route = route;
  }

  @watch('cartCount')
  onCartCountChange(_oldVal: number, newVal: number) {
    // Could trigger animation on cart badge
    if (newVal > 0) {
      const badge = this.shadowRoot?.querySelector('.cart-badge');
      if (badge) {
        badge.classList.remove('pulse');
        void (badge as HTMLElement).offsetWidth;
        badge.classList.add('pulse');
      }
    }
  }

  @render()
  template() {
    return html`
      <header class="header">
        <div class="header-inner">
          <a href="/#/" class="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Snice Store
          </a>
          <nav class="nav">
            <a href="/#/" class="nav-link">Home</a>
            <a href="/#/products" class="nav-link">Products</a>
          </nav>
          <div class="header-actions">
            <a href="/#/cart" class="cart-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              <if ${this.cartCount > 0}>
                <span class="cart-badge">${this.cartCount}</span>
              </if>
            </a>
            <if ${this.loggedIn}>
              <a href="/#/checkout" class="user-link">${this.userName}</a>
            </if>
            <if ${!this.loggedIn}>
              <a href="/#/login" class="login-link">Login</a>
            </if>
          </div>
        </div>
      </header>
      <main class="main">
        <slot name="page"></slot>
      </main>
      <footer class="footer">
        <div class="footer-inner">
          <p>Built with Snice Framework</p>
        </div>
      </footer>
    `;
  }

  @styles()
  layoutStyles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        font-family: 'Inter', var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-background-element, rgb(252 251 249));
      }
      .header {
        background: var(--snice-color-background, rgb(255 255 255));
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .header-inner {
        max-width: 80rem;
        margin: 0 auto;
        padding: 0 1.5rem;
        height: 4rem;
        display: flex;
        align-items: center;
        gap: 2rem;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.25rem;
        font-weight: var(--snice-font-weight-bold, 700);
        color: var(--snice-color-text, rgb(23 23 23));
        text-decoration: none;
        flex-shrink: 0;
      }
      .logo svg {
        color: var(--snice-color-primary, rgb(37 99 235));
      }
      .nav {
        display: flex;
        gap: 0.25rem;
        flex: 1;
      }
      .nav-link {
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        text-decoration: none;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        font-weight: var(--snice-font-weight-medium, 500);
        font-size: 0.875rem;
        transition: background 0.15s, color 0.15s;
      }
      .nav-link:hover {
        background: var(--snice-color-background-element, rgb(252 251 249));
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-shrink: 0;
      }
      .cart-link {
        position: relative;
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-radius: 8px;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        text-decoration: none;
        transition: background 0.15s;
      }
      .cart-link:hover {
        background: var(--snice-color-background-element, rgb(252 251 249));
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .cart-badge {
        position: absolute;
        top: 0;
        right: -0.25rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        font-size: 0.6875rem;
        font-weight: var(--snice-font-weight-bold, 700);
        min-width: 1.25rem;
        height: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        padding: 0 0.25rem;
      }
      .cart-badge.pulse {
        animation: badgePulse 0.3s ease-out;
      }
      @keyframes badgePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      .login-link, .user-link {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: var(--snice-font-weight-medium, 500);
        font-size: 0.875rem;
        transition: background 0.15s;
      }
      .login-link {
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
      }
      .login-link:hover {
        background: rgb(29 78 216);
      }
      .user-link {
        color: var(--snice-color-primary, rgb(37 99 235));
      }
      .user-link:hover {
        background: rgb(239 246 255);
      }
      .main {
        flex: 1;
        max-width: 80rem;
        width: 100%;
        margin: 0 auto;
        padding: 2rem 1.5rem;
      }
      .footer {
        background: var(--snice-color-background, rgb(255 255 255));
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        margin-top: auto;
      }
      .footer-inner {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1.5rem;
        text-align: center;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        font-size: 0.875rem;
      }
      .footer-inner p { margin: 0; }

      @media (max-width: 640px) {
        .nav { display: none; }
        .header-inner { gap: 1rem; }
      }
    `;
  }
}

export { StoreLayout };
