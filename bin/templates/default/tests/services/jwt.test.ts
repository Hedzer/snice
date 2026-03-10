import { describe, it, expect, beforeEach, vi } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiration } from '../../src/services/jwt';

describe('JWT Service', () => {
  describe('decodeJWT', () => {
    it('should decode a valid JWT', () => {
      // Valid JWT: {"sub":"123","name":"Test","exp":9999999999}
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVGVzdCIsImV4cCI6OTk5OTk5OTk5OX0.mock';
      const payload = decodeJWT(token);

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('123');
      expect(payload?.name).toBe('Test');
      expect(payload?.exp).toBe(9999999999);
    });

    it('should return null for invalid JWT format', () => {
      const payload = decodeJWT('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      const payload = decodeJWT('part1.part2');
      expect(payload).toBeNull();
    });

    it('should return null for JWT with invalid base64', () => {
      const payload = decodeJWT('header.!!!invalid!!!.signature');
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token expires in year 2286
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.mock';
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Token expired in 2020
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.mock';
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      // Token without exp: {"sub":"123"}
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.mock';
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      // Token with exp: 9999999999 (Sat Nov 20 2286)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.mock';
      const expiration = getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration?.getTime()).toBe(9999999999 * 1000);
    });

    it('should return null for token without exp', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.mock';
      expect(getTokenExpiration(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid')).toBeNull();
    });
  });
});
