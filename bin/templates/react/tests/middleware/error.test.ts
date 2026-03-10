import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Context } from 'snice';
import { errorMiddleware } from '../../src/middleware/error';
import * as storage from '../../src/services/storage';
import type { Principal } from '../../src/types/auth';

describe('Error Middleware', () => {
  let mockContext: Context;
  let mockNext: any;
  let originalLocation: Location;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Save original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    // Create mock context
    mockContext = {
      application: {
        principal: {
          user: { id: '1', name: 'Test', email: 'test@example.com' },
          isAuthenticated: true,
        } as Principal,
      },
      navigation: {
        route: '/',
        params: {},
      },
      update: vi.fn(),
    } as unknown as Context;

    // Create mock next function
    const mockResponse = new Response('{}', { status: 200 });
    mockNext = vi.fn(() => Promise.resolve(mockResponse));
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('should pass through successful responses', async () => {
    const mockResponse = new Response('{"data":"ok"}', { status: 200 });
    const response = await errorMiddleware.call(mockContext, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
  });

  it('should handle 401 unauthorized by clearing token and redirecting', async () => {
    storage.setToken('test-token');
    const mockResponse = new Response('Unauthorized', { status: 401 });

    await expect(
      errorMiddleware.call(mockContext, mockResponse, mockNext)
    ).rejects.toThrow('Unauthorized - redirecting to login');

    expect(storage.getToken()).toBeNull();
    const principal = mockContext.application.principal as Principal;
    expect(principal.user).toBeNull();
    expect(principal.isAuthenticated).toBe(false);
    expect(window.location.href).toBe('#/login');
  });

  it('should throw error for failed requests with JSON error message', async () => {
    const mockResponse = new Response(
      JSON.stringify({ message: 'Custom error message' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );

    await expect(
      errorMiddleware.call(mockContext, mockResponse, mockNext)
    ).rejects.toThrow('Custom error message');
  });

  it('should throw error for failed requests without JSON body', async () => {
    const mockResponse = new Response('Internal Server Error', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });

    await expect(
      errorMiddleware.call(mockContext, mockResponse, mockNext)
    ).rejects.toThrow('Request failed with status 500');
  });

  it('should throw generic error for failed JSON requests without message', async () => {
    const mockResponse = new Response(JSON.stringify({}), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });

    await expect(
      errorMiddleware.call(mockContext, mockResponse, mockNext)
    ).rejects.toThrow('Request failed with status 400');
  });
});
