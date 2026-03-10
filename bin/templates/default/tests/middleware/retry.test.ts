import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'snice';
import { createRetryMiddleware } from '../../src/middleware/retry';

describe('Retry Middleware', () => {
  let mockContext: Context;
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();

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

    mockRequest = new Request('https://api.example.com/data');
  });

  it('should return response on first successful attempt', async () => {
    const retryMiddleware = createRetryMiddleware(3, 10);
    const mockResponse = new Response('{}', { status: 200 });
    const mockNext = vi.fn(() => Promise.resolve(mockResponse));

    const response = await retryMiddleware.call(mockContext, mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(response).toBe(mockResponse);
  });

  it('should retry on failure and eventually succeed', async () => {
    const retryMiddleware = createRetryMiddleware(3, 10);
    const mockResponse = new Response('{}', { status: 200 });
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse);

    const response = await retryMiddleware.call(mockContext, mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(3);
    expect(response).toBe(mockResponse);
  });

  it('should throw error after max retries', async () => {
    const retryMiddleware = createRetryMiddleware(3, 10);
    const error = new Error('Network error');
    const mockNext = vi.fn(() => Promise.reject(error));

    await expect(
      retryMiddleware.call(mockContext, mockRequest, mockNext)
    ).rejects.toThrow('Network error');

    expect(mockNext).toHaveBeenCalledTimes(3);
  });

  it('should not retry on Unauthorized errors', async () => {
    const retryMiddleware = createRetryMiddleware(3, 10);
    const error = new Error('Unauthorized');
    const mockNext = vi.fn(() => Promise.reject(error));

    await expect(
      retryMiddleware.call(mockContext, mockRequest, mockNext)
    ).rejects.toThrow('Unauthorized');

    // Should only try once, no retries
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    vi.useFakeTimers();

    try {
      const retryMiddleware = createRetryMiddleware(3, 100);
      const mockNext = vi.fn(() => Promise.reject(new Error('Network error')));

      const promise = retryMiddleware.call(mockContext, mockRequest, mockNext).catch(err => err);

      // Run all timers to completion
      await vi.runAllTimersAsync();

      // All 3 attempts should have been made
      expect(mockNext).toHaveBeenCalledTimes(3);

      // Promise should have rejected with network error
      const result = await promise;
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Network error');
    } finally {
      vi.useRealTimers();
    }
  });
});
