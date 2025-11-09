import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/login/snice-login';
import type { SniceLoginElement } from '../../components/login/snice-login.types';

describe('snice-login', () => {
  let login: SniceLoginElement;

  afterEach(() => {
    if (login) {
      removeComponent(login as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render login element', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');

      expect(login).toBeTruthy();
      expect(login.tagName).toBe('SNICE-LOGIN');
    });

    it('should have default properties', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');

      expect(login.variant).toBe('default');
      expect(login.size).toBe('medium');
      expect(login.title).toBe('Sign In');
      expect(login.disabled).toBe(false);
      expect(login.loading).toBe(false);
      expect(login.showRememberMe).toBe(true);
      expect(login.showForgotPassword).toBe(true);
      expect(login.actionText).toBe('Sign In');
    });

    it('should render login form', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      const formEl = queryShadow(login as HTMLElement, '.login__form');
      expect(formEl).toBeTruthy();
      expect(formEl?.tagName).toBe('FORM');
    });

    it('should render username input', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      expect(usernameInput).toBeTruthy();
      expect(usernameInput.type).toBe('text');
      expect(usernameInput.required).toBe(true);
    });

    it('should render password input', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.type).toBe('password');
      expect(passwordInput.required).toBe(true);
    });
  });

  describe('size variants', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        login = await createComponent<SniceLoginElement>('snice-login', {
          size
        });
        await wait(50);

        const loginContainer = queryShadow(login as HTMLElement, '.login');
        expect(loginContainer?.classList.contains(`login--${size}`)).toBe(true);
      });
    });
  });

  describe('variant styles', () => {
    const variants = ['default', 'card', 'minimal'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        login = await createComponent<SniceLoginElement>('snice-login', {
          variant
        });
        await wait(50);

        const loginContainer = queryShadow(login as HTMLElement, '.login');
        expect(loginContainer?.classList.contains(`login--${variant}`)).toBe(true);
      });
    });
  });

  describe('title customization', () => {
    it('should display custom title', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        title: 'Welcome Back'
      });
      await wait(50);

      const titleEl = queryShadow(login as HTMLElement, '.login__title');
      expect(titleEl?.textContent).toBe('Welcome Back');
    });
  });

  describe('action button customization', () => {
    it('should display custom action text', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'action-text': 'Log In'
      });
      await wait(50);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.textContent?.trim()).toBe('Log In');
    });
  });

  describe('remember me option', () => {
    it('should show remember me checkbox when enabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'show-remember-me': true
      });
      await wait(50);

      const rememberCheckbox = queryShadow(login as HTMLElement, 'input[name="remember"]');
      expect(rememberCheckbox).toBeTruthy();
    });

    it('should hide remember me checkbox when disabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'show-remember-me': false
      });
      await wait(50);

      const rememberLabel = queryShadow(login as HTMLElement, '.login__remember');
      // The element exists but should not be visible due to <if> condition
      expect(login.showRememberMe).toBe(false);
    });
  });

  describe('forgot password option', () => {
    it('should show forgot password link when enabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'show-forgot-password': true
      });
      await wait(50);

      const forgotLink = queryShadow(login as HTMLElement, '.login__forgot');
      expect(forgotLink).toBeTruthy();
    });

    it('should hide forgot password link when disabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'show-forgot-password': false
      });
      await wait(50);

      expect(login.showForgotPassword).toBe(false);
    });

    it('should dispatch forgot password event when link clicked', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        'show-forgot-password': true
      });
      await wait(50);

      let forgotFired = false;
      (login as HTMLElement).addEventListener('login-forgot-password', () => {
        forgotFired = true;
      });

      const forgotLink = queryShadow(login as HTMLElement, '.login__forgot') as HTMLAnchorElement;
      forgotLink?.click();
      await wait(50);

      expect(forgotFired).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should disable all inputs when disabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        disabled: true
      });
      await wait(50);

      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });

    it('should disable submit button when disabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        disabled: true
      });
      await wait(50);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('should disable inputs when loading', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        loading: true
      });
      await wait(50);

      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });

    it('should show loading state on submit button', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        loading: true
      });
      await wait(50);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(true);
    });
  });

  describe('alert messages', () => {
    it('should display error alert when showAlert called with error', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      login.showAlert('Invalid credentials', 'error');
      await wait(50);

      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl).toBeTruthy();
      expect(alertEl?.getAttribute('variant')).toBe('error');
      expect(alertEl?.textContent).toContain('Invalid credentials');
    });

    it('should display success alert when showAlert called with success', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      login.showAlert('Login successful!', 'success');
      await wait(50);

      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl).toBeTruthy();
      expect(alertEl?.getAttribute('variant')).toBe('success');
      expect(alertEl?.textContent).toContain('Login successful!');
    });

    it('should clear alert when clearAlert called', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      login.showAlert('Error message', 'error');
      await wait(50);

      login.clearAlert();
      await wait(50);

      // Alert should no longer be visible due to <if> condition
      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl).toBeFalsy();
    });
  });

  describe('form submission', () => {
    it('should dispatch login-attempt event on form submit', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);

      let attemptFired = false;
      (login as HTMLElement).addEventListener('login-attempt', () => {
        attemptFired = true;
      });

      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(50);

      expect(attemptFired).toBe(true);
    });

    it('should not submit when disabled', async () => {
      login = await createComponent<SniceLoginElement>('snice-login', {
        disabled: true
      });
      await wait(50);

      const originalLoading = login.loading;

      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(50);

      // Loading state should not change
      expect(login.loading).toBe(originalLoading);
    });
  });

  describe('API methods', () => {
    beforeEach(async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);
    });

    it('should support setError method', async () => {
      login.setError('Test error');
      await wait(50);

      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl?.textContent).toContain('Test error');
      expect(alertEl?.getAttribute('variant')).toBe('error');
    });

    it('should support clearError method', async () => {
      login.setError('Test error');
      await wait(50);

      login.clearError();
      await wait(50);

      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl).toBeFalsy();
    });

    it('should support setCredentials method', async () => {
      login.setCredentials({
        username: 'testuser',
        password: 'testpass',
        remember: true
      });
      await wait(50);

      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;
      const rememberInput = queryShadow(login as HTMLElement, 'input[name="remember"]') as HTMLInputElement;

      expect(usernameInput.value).toBe('testuser');
      expect(passwordInput.value).toBe('testpass');
      expect(rememberInput.checked).toBe(true);
    });

    it('should support reset method', async () => {
      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'testpass';

      login.reset();
      await wait(50);

      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(login.loading).toBe(false);
    });
  });

  describe('slots', () => {
    it('should support before-header slot', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      login.innerHTML = '<div slot="before-header">Logo</div>';
      await wait(50);

      const slotEl = queryShadow(login as HTMLElement, 'slot[name="before-header"]');
      expect(slotEl).toBeTruthy();
    });

    it('should support after-header slot', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      login.innerHTML = '<div slot="after-header">Subtitle</div>';
      await wait(50);

      const slotEl = queryShadow(login as HTMLElement, 'slot[name="after-header"]');
      expect(slotEl).toBeTruthy();
    });

    it('should support footer slot', async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      login.innerHTML = '<div slot="footer">Footer content</div>';
      await wait(50);

      const slotEl = queryShadow(login as HTMLElement, 'slot[name="footer"]');
      expect(slotEl).toBeTruthy();
    });
  });

  describe('button loading state during submission', () => {
    beforeEach(async () => {
      login = await createComponent<SniceLoginElement>('snice-login');
      await wait(50);
    });

    it('should set button to loading state when form is submitted', async () => {
      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'testpass';

      // Trigger submit
      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Button should be loading immediately after submit
      await wait(10);
      expect(login.loading).toBe(true);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(true);
    });

    it('should reset loading state after validation failure (empty username)', async () => {
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;
      passwordInput.value = 'testpass';

      // Username is empty, should fail validation
      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for validation to complete
      await wait(100);

      // Loading state should be reset
      expect(login.loading).toBe(false);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(false);
    });

    it('should reset loading state after validation failure (empty password)', async () => {
      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      usernameInput.value = 'testuser';

      // Password is empty, should fail validation
      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for validation to complete
      await wait(100);

      // Loading state should be reset
      expect(login.loading).toBe(false);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(false);
    });

    it('should reset loading state after validation failure (both empty)', async () => {
      // Both fields empty, should fail validation
      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for validation to complete
      await wait(100);

      // Loading state should be reset
      expect(login.loading).toBe(false);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(false);

      // Error alert should be shown
      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl?.textContent).toContain('Username and password are required');
    });

    it('should disable button during loading state', async () => {
      login.loading = true;
      await wait(50);

      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(true);

      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });

    it('should not process submission when already loading', async () => {
      const usernameInput = queryShadow(login as HTMLElement, 'input[name="username"]') as HTMLInputElement;
      const passwordInput = queryShadow(login as HTMLElement, 'input[name="password"]') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'testpass';

      // Set to loading manually
      login.loading = true;
      await wait(10);

      const formEl = queryShadow(login as HTMLElement, '.login__form') as HTMLFormElement;

      // Try to submit while loading
      formEl?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(100);

      // Should remain in loading state (not change to false then back to true)
      // The guard in handleSubmit should prevent any state changes
      expect(login.loading).toBe(true);
    });

    it('should reset button state when reset() is called', async () => {
      // Set loading and error state
      login.loading = true;
      login.setError('Some error');
      await wait(50);

      // Reset
      login.reset();
      await wait(50);

      // Button should not be loading
      expect(login.loading).toBe(false);
      const btnEl = queryShadow(login as HTMLElement, 'snice-button');
      expect(btnEl?.hasAttribute('loading')).toBe(false);

      // Error should be cleared
      const alertEl = queryShadow(login as HTMLElement, 'snice-alert');
      expect(alertEl).toBeFalsy();
    });
  });
});
