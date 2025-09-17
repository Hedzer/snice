export type LoginVariant = 'default' | 'card' | 'minimal';
export type LoginSize = 'small' | 'medium' | 'large';

export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SniceLoginElement extends HTMLElement {
  variant: LoginVariant;
  size: LoginSize;
  title: string;
  disabled: boolean;
  loading: boolean;
  showRememberMe: boolean;
  showForgotPassword: boolean;
  actionText: string;
  login(credentials: LoginCredentials): Promise<LoginResult>;
  reset(): void;
  setError(message: string): void;
  clearError(): void;
}