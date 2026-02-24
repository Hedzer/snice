import { property, render, styles, html, css, context } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import type { StoreAppContext } from '../types/store';
import { mockLogin, storeUser } from '../services/auth';

@page({
  tag: 'login-page',
  routes: ['/login'],
  placard: { name: 'login', title: 'Login', show: false },
})
class LoginPage extends HTMLElement {
  @property() email = '';
  @property() password = '';
  @property() error = '';
  @property({ type: Boolean }) loading = false;
  private ctx!: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';

    setTimeout(() => {
      const user = mockLogin(this.email, this.password);
      if (user) {
        storeUser(user);
        const app = this.ctx.application as StoreAppContext;
        app.user = user;
        this.ctx.update();
        window.location.hash = '#/';
      } else {
        this.error = 'Invalid email or password (password must be 4+ characters)';
      }
      this.loading = false;
    }, 500);
  }

  @render()
  template() {
    const hasError = this.error !== '';
    return html`
      <div class="login-page">
        <div class="login-card">
          <h1>Sign In</h1>
          <p class="subtitle">Sign in to access checkout and order history</p>

          <if ${hasError}>
            <div class="error-banner">${this.error}</div>
          </if>

          <form @submit=${(e: Event) => this.handleSubmit(e)}>
            <div class="field">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                .value=${this.email}
                @input=${(e: Event) => { this.email = (e.target as HTMLInputElement).value; }}
                required
              />
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                .value=${this.password}
                @input=${(e: Event) => { this.password = (e.target as HTMLInputElement).value; }}
                required
                minlength="4"
              />
            </div>
            <button type="submit" class="submit-btn" ?disabled=${this.loading}>
              <if ${this.loading}>Signing in...</if>
              <if ${!this.loading}>Sign In</if>
            </button>
          </form>
          <p class="hint">Use any email and a 4+ character password</p>
        </div>
      </div>
    `;
  }

  @styles()
  loginStyles() {
    return css`
      :host {
        display: block;
      }
      .login-page {
        display: flex;
        justify-content: center;
        padding-top: 2rem;
      }
      .login-card {
        width: 100%;
        max-width: 24rem;
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 16px;
        padding: 2rem;
      }
      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.5rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      .subtitle {
        margin: 0 0 1.5rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        font-size: 0.875rem;
      }
      .error-banner {
        padding: 0.75rem 1rem;
        background: rgb(254 226 226);
        color: var(--snice-color-danger, rgb(220 38 38));
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      label {
        font-size: 0.875rem;
        font-weight: var(--snice-font-weight-medium, 500);
        color: var(--snice-color-text, rgb(23 23 23));
      }
      input {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 8px;
        font-size: 0.9375rem;
        font-family: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-background, rgb(255 255 255));
        transition: border-color 0.15s;
      }
      input:focus {
        outline: none;
        border-color: var(--snice-color-primary, rgb(37 99 235));
        box-shadow: 0 0 0 3px var(--snice-focus-ring-color, rgb(59 130 246 / 0.5));
      }
      input::placeholder {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .submit-btn {
        padding: 0.75rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 0.9375rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        cursor: pointer;
        transition: background 0.15s;
        font-family: inherit;
        margin-top: 0.5rem;
      }
      .submit-btn:hover { background: rgb(29 78 216); }
      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .hint {
        margin: 1rem 0 0;
        text-align: center;
        font-size: 0.8125rem;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
    `;
  }
}

export { LoginPage };
