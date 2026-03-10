import { describe, it, expect } from 'vitest';
import { SniceRouter, Route } from '../../src/react/SniceRouter';

describe('SniceRouter exports', () => {
  it('should export SniceRouter component', () => {
    expect(typeof SniceRouter).toBe('function');
  });

  it('should export Route component', () => {
    expect(typeof Route).toBe('function');
  });

  it('Route should return null (config-only component)', () => {
    const result = Route({
      path: '/test',
      page: () => null,
    });
    expect(result).toBeNull();
  });
});
