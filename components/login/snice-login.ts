import { element, property, query, queryAll, dispatch, request, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-login.css?inline';
import type { LoginVariant, LoginSize, LoginCredentials, LoginResult, SniceLoginElement } from './snice-login.types';
import '../alert/snice-alert';
import '../button/snice-button';

@element('snice-login')
export class SniceLogin extends HTMLElement implements SniceLoginElement {
  @property({  })
  variant: LoginVariant = 'default';

  @property({  })
  size: LoginSize = 'medium';

  @property({  })
  title = 'Sign In';

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  attribute: 'show-remember-me' })
  showRememberMe = true;

  @property({ type: Boolean,  attribute: 'show-forgot-password' })
  showForgotPassword = true;

  @property({  attribute: 'action-text' })
  actionText = 'Sign In';

  @query('.login')
  loginContainer!: HTMLDivElement;

  @query('.login__form')
  form!: HTMLFormElement;

  @query('input[name="username"]')
  usernameInput!: HTMLInputElement;

  @query('input[name="password"]')
  passwordInput!: HTMLInputElement;

  @query('input[name="remember"]')
  rememberInput?: HTMLInputElement;

  @query('snice-alert')
  alertElement!: HTMLElement;

  @query('snice-button')
  buttonElement!: HTMLElement;

  @queryAll('input')
  inputElements!: NodeListOf<HTMLInputElement>;

  @property({ attribute: false })
  private alertMessage = '';

  @property({ attribute: false })
  private alertVariant: 'error' | 'success' | '' = '';

  @render()
  render() {
    const loginClasses = ['login', `login--${this.variant}`, `login--${this.size}`].join(' ');

    return html/*html*/`
      <div class="${loginClasses}">
        <slot name="before-header"></slot>

        <div class="login__header">
          <h1 class="login__title">${this.title}</h1>
          <slot name="subtitle">
            <p class="login__subtitle">Enter your credentials to continue</p>
          </slot>
        </div>

        <slot name="after-header"></slot>
        <slot name="before-form"></slot>

        <form class="login__form" @submit=${(e: Event) => this.handleSubmit(e)}>
          <slot name="form-top"></slot>

          <div class="login__field">
            <label class="login__label" for="username">Username</label>
            <input
              class="login__input"
              type="text"
              name="username"
              id="username"
              required
              autocomplete="username"
              placeholder="Enter your username"
              ?disabled=${this.disabled || this.loading}
            />
          </div>

          <slot name="between-fields"></slot>

          <div class="login__field">
            <label class="login__label" for="password">Password</label>
            <input
              class="login__input"
              type="password"
              name="password"
              id="password"
              required
              autocomplete="current-password"
              placeholder="Enter your password"
              ?disabled=${this.disabled || this.loading}
              @keydown=${(e: KeyboardEvent) => this.handleEnterKey(e)}
            />
          </div>

          <if ${this.showRememberMe || this.showForgotPassword}>
            <div class="login__options">
              <if ${this.showRememberMe}>
                <label class="login__remember">
                  <input class="login__checkbox" type="checkbox" name="remember" ?disabled="${this.disabled || this.loading}" />
                  Remember me
                </label>
              </if>

              <if ${this.showForgotPassword}>
                <a href="#" class="login__forgot" @click=${(e: Event) => this.handleForgotPassword(e)}>Forgot password?</a>
              </if>
            </div>
          </if>

          <slot name="before-submit"></slot>

          <snice-button
            type="submit"
            variant="primary"
            ?disabled=${this.disabled}
            ?loading=${this.loading}
            @click=${(e: Event) => this.handleButtonClick(e)}>
            ${this.actionText}
          </snice-button>

          <slot name="after-submit"></slot>
        </form>

        <slot name="after-form"></slot>

        <if ${this.alertMessage}>
          <snice-alert variant="${this.alertVariant}">${this.alertMessage}</snice-alert>
        </if>

        <div class="login__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @watch('variant', 'size')
  updateLoginClasses() {
    if (this.loginContainer) {
      this.loginContainer.className = `login login--${this.variant} login--${this.size}`;
    }
  }

  @request('login-user')
  async *login(credentials?: LoginCredentials): any {
    if (!credentials) {
      credentials = this.getFormData();
    }
    
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    try {
      const result = await (yield credentials);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  private async handleButtonClick(event: Event) {
    event.preventDefault();
    // Trigger form submit
    if (this.form) {
      this.form.requestSubmit();
    }
  }

  @dispatch('login-attempt', { bubbles: true, composed: true })
  private async handleSubmit(event: Event) {
    event.preventDefault();

    if (this.loading || this.disabled) {
      return;
    }

    this.clearAlert();
    this.loading = true;
    this.updateLoadingState();

    // Wait a tick to ensure the form is properly rendered
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const credentials = this.getFormData();

      if (!credentials.username || !credentials.password) {
        this.showAlert('Username and password are required', 'error');
        this.loading = false;
        this.updateLoadingState();
        return;
      }

      const result = await this.login(credentials);

      if (result.success) {
        this.showAlert('Login successful!', 'success');
        this.dispatchLoginSuccess(result);
      } else {
        this.showAlert(result.error || 'Login failed', 'error');
        this.dispatchLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.showAlert(errorMessage, 'error');
      this.dispatchLoginError(errorMessage);
    } finally {
      this.loading = false;
      this.updateLoadingState();
    }

    const credentials = this.getFormData();
    return {
      username: credentials.username,
      timestamp: new Date().toISOString()
    };
  }

  private handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.loading && !this.disabled && this.form) {
      this.form.requestSubmit();
    }
  }

  @dispatch('login-forgot-password', { bubbles: true, composed: true })
  private handleForgotPassword(event: Event) {
    event.preventDefault();
    return {
      timestamp: new Date().toISOString()
    };
  }

  @dispatch('login-success', { bubbles: true, composed: true })
  private dispatchLoginSuccess(result: LoginResult) {
    return { timestamp: new Date().toISOString() };
  }

  @dispatch('login-error', { bubbles: true, composed: true })
  private dispatchLoginError(error: string) {
    return {
      error,
      timestamp: new Date().toISOString()
    };
  }


  private getFormData(): LoginCredentials {
    const usernameInput = this.shadowRoot?.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.shadowRoot?.querySelector('#password') as HTMLInputElement;
    const rememberInput = this.shadowRoot?.querySelector('input[name="remember"]') as HTMLInputElement;
    
    return {
      username: usernameInput?.value || '',
      password: passwordInput?.value || '',
      remember: rememberInput?.checked || false
    };
  }

  showAlert(message: string, variant: 'error' | 'success') {
    this.alertMessage = message;
    this.alertVariant = variant;
    this.updateAlert();
  }

  clearAlert() {
    this.alertMessage = '';
    this.alertVariant = '';
    this.updateAlert();
  }

  private updateAlert() {
    if (this.alertElement) {
      this.alertElement.setAttribute('variant', this.alertVariant);
      this.alertElement.textContent = this.alertMessage;
      if (this.alertMessage) {
        this.alertElement.removeAttribute('hidden');
      } else {
        this.alertElement.setAttribute('hidden', '');
      }
    }
  }

  private updateLoadingState() {
    if (this.buttonElement) {
      if (this.loading) {
        this.buttonElement.setAttribute('loading', '');
      } else {
        this.buttonElement.removeAttribute('loading');
      }
      
      if (this.disabled) {
        this.buttonElement.setAttribute('disabled', '');
      } else {
        this.buttonElement.removeAttribute('disabled');
      }
    }
    
    this.inputElements?.forEach(input => {
      if (this.disabled || this.loading) {
        input.setAttribute('disabled', '');
      } else {
        input.removeAttribute('disabled');
      }
    });
  }

  setError(message: string) {
    this.showAlert(message, 'error');
  }

  clearError() {
    this.clearAlert();
  }

  setCredentials(credentials: Partial<LoginCredentials>) {
    if (credentials.username !== undefined && this.usernameInput) {
      this.usernameInput.value = credentials.username;
    }
    if (credentials.password !== undefined && this.passwordInput) {
      this.passwordInput.value = credentials.password;
    }
    if (credentials.remember !== undefined && this.rememberInput) {
      this.rememberInput.checked = credentials.remember;
    }
  }

  reset() {
    if (this.form) {
      this.form.reset();
    }
    this.clearAlert();
    this.loading = false;
  }
}