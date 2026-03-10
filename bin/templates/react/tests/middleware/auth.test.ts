import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'snice';
import { authMiddleware } from '../../src/middleware/auth';
import * as storage from '../../src/services/storage';

describe('Auth Middleware', () => {
  let mockContext: Context;
  let mockRequest: Request;
  let mockNext: any;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Create mock context
    mockContext = {
      application: {
        principal: {
          user: null,
          isAuthenticated: false,
        },
      },
      navigation: {
        route: '/',
        params: {},
      },
      update: vi.fn(),
    } as unknown as Context;

    // Create mock request
    mockRequest = new Request('https://api.example.com/data', {
      headers: new Headers(),
    });

    // Create mock next function
    const mockResponse = new Response('{}', { status: 200 });
    mockNext = vi.fn(() => Promise.resolve(mockResponse));
  });

  it('should add Authorization header when token exists', async () => {
    const token = 'test-token-123';
    storage.setToken(token);

    await authMiddleware.call(mockContext, mockRequest, mockNext);

    expect(mockRequest.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not add Authorization header when no token exists', async () => {
    await authMiddleware.call(mockContext, mockRequest, mockNext);

    expect(mockRequest.headers.get('Authorization')).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next() and return response', async () => {
    const token = 'test-token-123';
    storage.setToken(token);

    const response = await authMiddleware.call(mockContext, mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  });
});
