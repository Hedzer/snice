import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, logout, isAuthenticated, refreshToken } from '../../src/services/auth';
import * as storage from '../../src/services/storage';

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = { email: 'demo@example.com', password: 'demo' };
      const result = await login(credentials);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('demo@example.com');
      expect(result.user.name).toBe('Demo User');
    });

    it('should store token and user on successful login', async () => {
      const credentials = { email: 'demo@example.com', password: 'demo' };
      await login(credentials);

      expect(storage.getToken()).toBeTruthy();
      expect(storage.getUser()).toBeTruthy();
    });

    it('should throw error for invalid credentials', async () => {
      const credentials = { email: 'wrong@example.com', password: 'wrong' };

      await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const credentials = { email: 'demo@example.com', password: 'wrong' };

      await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear token on logout', async () => {
      storage.setToken('test-token');
      storage.setUser({ id: '1', name: 'Test' });

      await logout();

      expect(storage.getToken()).toBeNull();
      expect(storage.getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      // Non-expired token
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.mock';
      storage.setToken(token);

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      // Expired token
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjAwMDAwMDAwfQ.mock';
      storage.setToken(token);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should return new token', async () => {
      const newToken = await refreshToken();
      expect(newToken).toBeTruthy();
      expect(typeof newToken).toBe('string');
    });

    it('should update stored token', async () => {
      await refreshToken();
      expect(storage.getToken()).toBeTruthy();
    });
  });
});
