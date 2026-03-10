import { describe, it, expect } from 'vitest';
import { matchRoutes, type RouteConfig } from '../../src/react/matchRoute';

describe('matchRoutes', () => {
  const routes: RouteConfig[] = [
    { path: '/users/:id', index: 0 },
    { path: '/users', index: 1 },
    { path: '/', index: 2 },
  ];

  it('should match exact paths', () => {
    const result = matchRoutes(routes, '/users');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(1);
    expect(result!.params).toEqual({});
  });

  it('should match parameterized paths', () => {
    const result = matchRoutes(routes, '/users/42');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(0);
    expect(result!.params).toEqual({ id: '42' });
  });

  it('should match root path', () => {
    const result = matchRoutes(routes, '/');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(2);
  });

  it('should return null for unmatched paths', () => {
    const result = matchRoutes(routes, '/nonexistent');
    expect(result).toBeNull();
  });

  it('should match longest route first (most specific)', () => {
    const result = matchRoutes(routes, '/users/42');
    expect(result!.index).toBe(0); // /users/:id wins over /users
  });
});
