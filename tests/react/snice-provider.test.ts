import { describe, it, expect } from 'vitest';
import { SniceProvider, useSniceContext, useNavigate, useParams, useRoute } from '../../src/react/SniceProvider';

describe('SniceProvider exports', () => {
  it('should export SniceProvider component', () => {
    expect(typeof SniceProvider).toBe('function');
  });

  it('should export useSniceContext hook', () => {
    expect(typeof useSniceContext).toBe('function');
  });

  it('should export useNavigate hook', () => {
    expect(typeof useNavigate).toBe('function');
  });

  it('should export useParams hook', () => {
    expect(typeof useParams).toBe('function');
  });

  it('should export useRoute hook', () => {
    expect(typeof useRoute).toBe('function');
  });
});
