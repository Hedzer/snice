import { page } from '../router';
import { render, styles, respond, context, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import { login } from '../services/auth';
import type { Principal } from '../types/auth';
import 'snice/components/login/snice-login';

const placard: Placard = {
  name: 'login',
  title: 'Login',
  show: false
};

interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: { id: string; username: string; email: string };
  token?: string;
}

@page({ tag: 'login-page', routes: ['/login'], placard, layout: false })
export class LoginPage extends HTMLElement {
  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const result = await login({
        email: credentials.username,
        password: credentials.password
      });

      if (this.ctx) {
        this.ctx.update();
      }

      window.location.hash = '#/dashboard';

      return {
        success: true,
        user: {
          id: result.user.id,
          username: result.user.email,
          email: result.user.email
        },
        token: result.token
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <snice-login
          variant="card"
          size="medium"
          title="{{projectName}}"
          action-text="Sign In"
          show-forgot-password="false"
        >
          <p slot="subtitle">Sign in to your account</p>
          <div slot="footer">
            <p class="hint">Demo credentials:</p>
            <p class="hint"><strong>Email:</strong> demo@example.com</p>
            <p class="hint"><strong>Password:</strong> demo</p>
          </div>
        </snice-login>
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
        background: linear-gradient(135deg, var(--snice-color-primary) 0%, var(--snice-color-primary-hover) 100%);
      }

      .container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
        box-sizing: border-box;
      }

      snice-login {
        width: 100%;
        max-width: 400px;
      }

      .hint {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--snice-color-text-secondary);
        text-align: center;
      }
    `;
  }
}
