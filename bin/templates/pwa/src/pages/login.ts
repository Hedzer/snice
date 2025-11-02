import { page } from '../router';
import { render, styles, html, css, context } from 'snice';
import type { Placard, Context } from 'snice';
import type { Principal } from '../types/auth';
import { login } from '../services/auth';

const placard: Placard = {
  name: 'login',
  title: 'Login',
  show: false
};

@page({ tag: 'login-page', routes: ['/login'], placard })
export class LoginPage extends HTMLElement {
  email = 'demo@example.com';
  password = 'demo';
  error = '';
  loading = false;

  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;

    try {
      const result = await login({ email: this.email, password: this.password });

      // Update context with new auth state
      if (this.ctx && this.ctx.application.principal) {
        const principal = this.ctx.application.principal as Principal;
        principal.user = result.user;
        principal.isAuthenticated = true;
      }

      window.location.href = '#/dashboard';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <snice-card class="login-card">
          <h1>{{projectName}}</h1>
          <p class="subtitle">Sign in to your account</p>

          <form @submit=${this.handleSubmit}>
            <snice-input
              label="Email"
              type="email"
              .value=${this.email}
              @input=${(e: Event) => this.email = (e.target as HTMLInputElement).value}
              required
            ></snice-input>

            <snice-input
              label="Password"
              type="password"
              .value=${this.password}
              @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
              required
            ></snice-input>

            <if ${this.error}>
              <snice-alert variant="error" class="error">
                ${this.error}
              </snice-alert>
            </if>

            <snice-button
              type="submit"
              variant="primary"
              size="large"
              ?loading=${this.loading}
              full-width
            >
              Sign In
            </snice-button>
          </form>

          <div class="hint">
            <p>Demo credentials:</p>
            <p><strong>Email:</strong> demo@example.com</p>
            <p><strong>Password:</strong> demo</p>
          </div>
        </snice-card>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      }

      .container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
      }

      h1 {
        text-align: center;
        color: var(--primary-color);
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        text-align: center;
        color: var(--text-light);
        margin: 0 0 2rem 0;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .error {
        margin: 0;
      }

      .hint {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
        text-align: center;
        font-size: 0.875rem;
        color: var(--text-light);
      }

      .hint p {
        margin: 0.25rem 0;
      }
    `;
  }
}
