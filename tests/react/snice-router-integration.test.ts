import { describe, it, expect } from 'vitest';
import { SniceRouter, Route } from '../../src/react/SniceRouter';
import { SniceProvider, useSniceContext, useNavigate, useParams, useRoute } from '../../src/react/SniceProvider';
import { useRequestHandler } from '../../src/react/useRequestHandler';
import { matchRoutes } from '../../src/react/matchRoute';

describe('React integration - full API', () => {
  it('should export all router components', () => {
    expect(typeof SniceRouter).toBe('function');
    expect(typeof Route).toBe('function');
  });

  it('should export all provider components and hooks', () => {
    expect(typeof SniceProvider).toBe('function');
    expect(typeof useSniceContext).toBe('function');
    expect(typeof useNavigate).toBe('function');
    expect(typeof useParams).toBe('function');
    expect(typeof useRoute).toBe('function');
  });

  it('should export useRequestHandler', () => {
    expect(typeof useRequestHandler).toBe('function');
  });

  it('should export matchRoutes utility', () => {
    expect(typeof matchRoutes).toBe('function');
  });

  it('Route component should return null (config-only)', () => {
    const result = Route({
      path: '/test',
      page: () => null,
    });
    expect(result).toBeNull();
  });

  it('matchRoutes should work with basic routes', () => {
    const routes = [
      { path: '/about', index: 0 },
      { path: '/users/:id', index: 1 },
    ];

    const result = matchRoutes(routes, '/users/5');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(1);
    expect(result!.params).toEqual({ id: '5' });
  });
});

describe('Barrel export', () => {
  it('should re-export everything from index', async () => {
    const barrel = await import('../../src/react/index');

    // Router
    expect(typeof barrel.SniceRouter).toBe('function');
    expect(typeof barrel.Route).toBe('function');

    // Provider + hooks
    expect(typeof barrel.SniceProvider).toBe('function');
    expect(typeof barrel.useSniceContext).toBe('function');
    expect(typeof barrel.useNavigate).toBe('function');
    expect(typeof barrel.useParams).toBe('function');
    expect(typeof barrel.useRoute).toBe('function');

    // Request handler
    expect(typeof barrel.useRequestHandler).toBe('function');
  });
});
