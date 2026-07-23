import { controller, respond } from 'snice';
import type { LoginCredentials, LoginResult } from '../../../packages/components/src/login/snice-login.types';

@controller('demo-auth-controller')
export class DemoAuthController {
  element!: HTMLElement;

  async attach(element: HTMLElement) { this.element = element; }
  async detach(_element: HTMLElement) {}

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    if (!credentials.username || !credentials.password) return { success: false, error: 'Username and password are required' };
    const passwords: Record<string, string> = { demo: 'password', admin: 'admin123', test: 'test123' };
    if (passwords[credentials.username.toLowerCase()] !== credentials.password) return { success: false, error: 'Invalid username or password' };
    return {
      success: true,
      token: btoa(credentials.username),
      user: { id: credentials.username, username: credentials.username, email: `${credentials.username}@example.com` }
    };
  }
}
