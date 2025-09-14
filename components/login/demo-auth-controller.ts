import { controller, respond } from 'snice';
import type { LoginCredentials, LoginResult } from './snice-login.types';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

@controller('demo-auth-controller')
export class DemoAuthController {
  element!: HTMLElement;

  // Mock user database for demo purposes
  private mockUsers: AuthUser[] = [
    {
      id: '1',
      username: 'demo',
      email: 'demo@example.com',
      role: 'user'
    },
    {
      id: '2',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      id: '3',
      username: 'test',
      email: 'test@example.com',
      role: 'user'
    }
  ];

  // Valid passwords for demo (in real app, these would be hashed)
  private mockPasswords: Record<string, string> = {
    'demo': 'password',
    'admin': 'admin123',
    'test': 'test123'
  };

  async attach(element: HTMLElement) {
    this.element = element;
    console.log('Demo Auth Controller attached to', element.tagName);
  }

  async detach(element: HTMLElement) {
    console.log('Demo Auth Controller detached from', element.tagName);
  }

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    console.log('Auth controller handling login request:', { username: credentials.username });

    // Simulate network delay
    await this.delay(200 + Math.random() * 200);

    // Validate credentials
    const result = await this.authenticateUser(credentials);
    
    // Store successful login
    if (result.success && result.user) {
      this.storeUserSession(result.user, result.token!);
    }

    return result;
  }

  private async authenticateUser(credentials: LoginCredentials): Promise<LoginResult> {
    const { username, password } = credentials;

    // Basic validation
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    // Find user
    const user = this.mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Check password
    const expectedPassword = this.mockPasswords[user.username];
    if (password !== expectedPassword) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Simulate random authentication failure (10% chance)
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: 'Authentication service temporarily unavailable'
      };
    }

    // Generate mock JWT token
    const token = this.generateMockToken(user);

    // Update last login
    user.lastLogin = new Date().toISOString();

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  private generateMockToken(user: AuthUser): string {
    // This is just a demo token - in real apps use proper JWT libraries
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }));
    const signature = btoa('demo-signature-' + Math.random().toString(36));
    
    return `${header}.${payload}.${signature}`;
  }

  private storeUserSession(user: AuthUser, token: string): void {
    // In a real app, you might store this in localStorage, sessionStorage, or cookies
    const session = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token,
      loginTime: new Date().toISOString()
    };

    // Store in sessionStorage for demo
    sessionStorage.setItem('demoUserSession', JSON.stringify(session));
    
    console.log('User session stored:', session);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to get current session (for other components to use)
  getCurrentSession(): { user: AuthUser; token: string } | null {
    try {
      const sessionData = sessionStorage.getItem('demoUserSession');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  // Helper method to logout
  logout(): void {
    sessionStorage.removeItem('demoUserSession');
    console.log('User logged out');
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }
}