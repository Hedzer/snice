import { element, property, query, queryAll, on, dispatch, request, type Response } from 'snice';
import css from './snice-login.css?inline';
import type { LoginVariant, LoginSize, LoginCredentials, LoginResult, SniceLoginElement } from './snice-login.types';
import '../alert/snice-alert';
import '../button/snice-button';

@element('snice-login')
export class SniceLogin extends HTMLElement implements SniceLoginElement {
  @property({ reflect: true })
  variant: LoginVariant = 'default';

  @property({ reflect: true })
  size: LoginSize = 'medium';

  @property({ reflect: true })
  title = 'Sign In';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true, attribute: 'show-remember-me' })
  showRememberMe = true;

  @property({ type: Boolean, reflect: true, attribute: 'show-forgot-password' })
  showForgotPassword = true;

  @property({ reflect: true, attribute: 'action-text' })
  actionText = 'Sign In';

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

  private alertMessage = '';
  private alertVariant: 'error' | 'success' | '' = '';

  html() {
    return /*html*/`
      <div class="login login--${this.variant} login--${this.size}">
        <slot name="before-header"></slot>
        
        <div class="login__header">
          <h1 class="login__title">${this.title}</h1>
          <slot name="subtitle">
            <p class="login__subtitle">Enter your credentials to continue</p>
          </slot>
        </div>
        
        <slot name="after-header"></slot>
        <slot name="before-form"></slot>
        
        <form class="login__form">
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
              ${this.disabled || this.loading ? 'disabled' : ''}
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
              ${this.disabled || this.loading ? 'disabled' : ''}
            />
          </div>
          
          <div class="login__options" ${!this.showRememberMe && !this.showForgotPassword ? 'hidden' : ''}>
            <label class="login__remember" ${!this.showRememberMe ? 'hidden' : ''}>
              <input class="login__checkbox" type="checkbox" name="remember" ${this.disabled || this.loading ? 'disabled' : ''} />
              Remember me
            </label>
            
            <a href="#" class="login__forgot" ${!this.showForgotPassword ? 'hidden' : ''}>Forgot password?</a>
          </div>
          
          <slot name="before-submit"></slot>
          
          <snice-button type="submit" variant="primary" ${this.disabled ? 'disabled' : ''} ${this.loading ? 'loading' : ''}>
            ${this.actionText}
          </snice-button>
          
          <slot name="after-submit"></slot>
        </form>
        
        <slot name="after-form"></slot>
        
        <snice-alert variant="${this.alertVariant}" ${!this.alertMessage ? 'hidden' : ''}>${this.alertMessage}</snice-alert>
        
        <div class="login__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }


  css() {
    return css;
  }

  @request('login-user')
  async *login(credentials?: LoginCredentials): Response<LoginResult> {
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

  @on('click', 'snice-button')
  async handleButtonClick(event: Event) {
    console.log('Button clicked'); // Debug
    event.preventDefault();
    // Trigger form submit
    if (this.form) {
      this.form.requestSubmit();
    }
  }

  @on('submit', '.login__form')
  @dispatch('@snice/login-attempt', { bubbles: true, composed: true })
  async handleSubmit(event: Event) {
    console.log('Submit handler called'); // Debug
    event.preventDefault();
    
    if (this.loading || this.disabled) {
      console.log('Submit blocked - loading or disabled'); // Debug
      return;
    }

    console.log('Clearing error and setting loading...'); // Debug
    this.clearAlert();
    this.loading = true;
    this.updateLoadingState();
    
    // Wait a tick to ensure the form is properly rendered
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      const credentials = this.getFormData();
      console.log('Final credentials for login:', credentials); // Debug log
      
      if (!credentials.username || !credentials.password) {
        console.log('Missing credentials detected'); // Debug
        this.showAlert('Username and password are required', 'error');
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
      console.log('Login error:', errorMessage); // Debug
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

  @on('keydown:Enter', '.login__input')
  handleEnterKey() {
    if (!this.loading && !this.disabled && this.form) {
      this.form.requestSubmit();
    }
  }

  @on('click', '.login__forgot')
  @dispatch('@snice/login-forgot-password', { bubbles: true, composed: true })
  handleForgotPassword(event: Event) {
    event.preventDefault();
    return {
      timestamp: new Date().toISOString()
    };
  }

  @dispatch('@snice/login-success', { bubbles: true, composed: true })
  private dispatchLoginSuccess(result: LoginResult) {
    return {
      user: result.user,
      token: result.token,
      timestamp: new Date().toISOString()
    };
  }

  @dispatch('@snice/login-error', { bubbles: true, composed: true })
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

  reset() {
    if (this.form) {
      this.form.reset();
    }
    this.clearAlert();
    this.loading = false;
  }
}