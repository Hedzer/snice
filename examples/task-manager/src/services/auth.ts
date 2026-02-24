import type { LoginCredentials, LoginResponse, User } from '../types/auth';
import { getToken, getUser, setToken, setUser } from './storage';

const MOCK_USERS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'admin@example.com',
    password: 'admin',
    user: {
      id: 'u1',
      email: 'admin@example.com',
      name: 'Alex Morgan',
      role: 'admin',
    },
  },
  {
    email: 'demo@example.com',
    password: 'demo',
    user: {
      id: 'u2',
      email: 'demo@example.com',
      name: 'Sam Rivera',
      role: 'member',
    },
  },
];

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 400));

  const match = MOCK_USERS.find(
    (u) => u.email === credentials.email && u.password === credentials.password
  );

  if (!match) {
    throw new Error('Invalid email or password');
  }

  const token = btoa(JSON.stringify({ sub: match.user.id, exp: Date.now() + 86400000 }));
  setToken(token);
  setUser(match.user);

  return { token, user: match.user };
}

export function logout(): void {
  setToken(null);
  setUser(null);
}

export function isAuthenticated(): boolean {
  return getToken() !== null && getUser() !== null;
}

export function getCurrentUser(): User | null {
  return getUser();
}
