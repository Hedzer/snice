import type { LoginCredentials, LoginResponse, User } from '../types/auth';
import { setToken, setUser, clearToken, getToken } from './storage';
import { isTokenExpired } from './jwt';

// Mock API - replace with real API calls
const MOCK_USER: User = {
  id: '1',
  email: 'demo@example.com',
  name: 'Demo User',
  avatar: 'https://i.pravatar.cc/150?img=1'
};

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.mock';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock validation
  if (credentials.email === 'demo@example.com' && credentials.password === 'demo') {
    setToken(MOCK_TOKEN);
    setUser(MOCK_USER);

    return {
      token: MOCK_TOKEN,
      user: MOCK_USER
    };
  }

  throw new Error('Invalid credentials');
}

export async function logout(): Promise<void> {
  clearToken();
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export async function refreshToken(): Promise<string> {
  // Mock refresh - in real app, call refresh endpoint
  await new Promise(resolve => setTimeout(resolve, 300));
  setToken(MOCK_TOKEN);
  return MOCK_TOKEN;
}
