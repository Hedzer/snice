import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, setToken, clearToken, getUser, setUser } from '../../src/services/storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(getToken()).toBe(token);
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('should clear token and user', () => {
      setToken('test-token');
      setUser({ id: '1', name: 'Test' });

      clearToken();

      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('User Management', () => {
    it('should set and get user object', () => {
      const user = { id: '1', name: 'Test User', email: 'test@example.com' };
      setUser(user);
      expect(getUser()).toEqual(user);
    });

    it('should return null when no user exists', () => {
      expect(getUser()).toBeNull();
    });

    it('should handle complex user objects', () => {
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        metadata: {
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      };

      setUser(user);
      expect(getUser()).toEqual(user);
    });

    it('should overwrite existing user', () => {
      setUser({ id: '1', name: 'User 1' });
      setUser({ id: '2', name: 'User 2' });

      const user = getUser<{ id: string; name: string }>();
      expect(user?.id).toBe('2');
      expect(user?.name).toBe('User 2');
    });
  });
});
