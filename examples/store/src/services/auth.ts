import type { User } from '../types/store';

const USER_KEY = 'snice-store-user';

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function mockLogin(email: string, password: string): User | null {
  if (email && password.length >= 4) {
    return {
      id: '1',
      name: email.split('@')[0],
      email,
      token: 'mock-jwt-token-' + Date.now(),
    };
  }
  return null;
}
