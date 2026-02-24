import { page } from '../router';
import { render, styles, property, context, on, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import type { AppContext } from '../router';
import type { Principal } from '../types/auth';
import { login } from '../services/auth';

const placard: Placard = {
  name: 'login',
  title: 'Login',
  show: false,
};

@page({ tag: 'login-page', routes: ['/login'], placard, layout: false })
class LoginPage extends HTMLElement {
  @property() email = '';
  @property() password = '';
  @property() error = '';
  @property({ type: Boolean }) loading = false;

  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @on('submit', '.login-form')
  async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;

    try {
      const result = await login({ email: this.email, password: this.password });
      if (this.ctx) {
        const app = this.ctx.application as unknown as AppContext;
        app.principal.user = result.user;
        app.principal.isAuthenticated = true;
        this.ctx.update();
      }
      window.location.hash = '#/board';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  @render()
  renderContent() {
    return html`
      <div class="login-page">
        <div class="login-card">
          <div class="login-header">
            <h1 class="login-logo">TaskFlow</h1>
            <p class="login-subtitle">Sign in to manage your projects</p>
          </div>

          <if ${!!this.error}>
            <div class="error-alert">${this.error}</div>
          </if>

          <form class="login-form">
            <div class="form-group">
              <label class="label" for="email">Email</label>
              <input
                class="input"
                id="email"
                type="email"
                .value=${this.email}
                @input=${(e: Event) => { this.email = (e.target as HTMLInputElement).value; }}
                placeholder="you@example.com"
                required
                ?disabled=${this.loading}
              />
            </div>
            <div class="form-group">
              <label class="label" for="password">Password</label>
              <input
                class="input"
                id="password"
                type="password"
                .value=${this.password}
                @input=${(e: Event) => { this.password = (e.target as HTMLInputElement).value; }}
                placeholder="Enter password"
                required
                ?disabled=${this.loading}
              />
            </div>
            <button class="btn-login" type="submit" ?disabled=${this.loading}>
              <if ${this.loading}>Signing in...</if>
              <if ${!this.loading}>Sign In</if>
            </button>
          </form>

          <div class="credentials">
            <p class="credentials__title">Demo Accounts</p>
            <div class="credentials__row">
              <span class="credentials__label">Admin:</span>
              <code>admin@example.com / admin</code>
            </div>
            <div class="credentials__row">
              <span class="credentials__label">Member:</span>
              <code>demo@example.com / demo</code>
            </div>
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
        height: 100vh;
        overflow: hidden;
      }

      .login-page {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgb(99 102 241) 0%, rgb(139 92 246) 50%, rgb(236 72 153) 100%);
      }

      .login-card {
        background: var(--snice-color-background-element, rgb(255 255 255));
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        padding: 2.5rem;
        width: 100%;
        max-width: 24rem;
      }

      .login-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .login-logo {
        font-size: 1.75rem;
        font-weight: 900;
        color: var(--snice-color-primary, rgb(99 102 241));
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }

      .login-subtitle {
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        font-size: 0.875rem;
        margin: 0;
      }

      .error-alert {
        background: rgb(254 226 226);
        color: rgb(185 28 28);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        border: 1px solid rgb(252 165 165);
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--snice-color-text, rgb(15 23 42));
      }

      .input {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 8px;
        font-size: 0.9375rem;
        font-family: inherit;
        color: var(--snice-color-text, rgb(15 23 42));
        background: var(--snice-color-background-element, rgb(255 255 255));
        outline: none;
        transition: all 150ms ease;
      }

      .input:focus {
        border-color: var(--snice-color-primary, rgb(99 102 241));
        box-shadow: 0 0 0 3px rgb(99 102 241 / 0.15);
      }

      .input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-login {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 150ms ease;
        font-family: inherit;
      }

      .btn-login:hover:not(:disabled) {
        background: rgb(79 70 229);
      }

      .btn-login:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .credentials {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--snice-color-border, rgb(226 232 240));
      }

      .credentials__title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        margin: 0 0 0.5rem;
      }

      .credentials__row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        margin-bottom: 0.25rem;
      }

      .credentials__label {
        font-weight: 600;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
      }

      code {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 0.75rem;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        background: var(--snice-color-background, rgb(248 250 252));
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
      }
    `;
  }
}
