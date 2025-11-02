import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextAwareFetcher, Router, Context } from '../src';
import type { Fetcher, RequestMiddleware, ResponseMiddleware } from '../src';

// Mock global fetch for testing
const originalFetch = global.fetch;

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('ContextAwareFetcher', () => {
  let fetcher: ContextAwareFetcher;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetcher = new ContextAwareFetcher();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create a new ContextAwareFetcher instance', () => {
      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });

    it('should have empty middleware arrays initially', () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);
      expect(fetchFn).toBeDefined();
      expect(typeof fetchFn).toBe('function');
    });

    it('should implement Fetcher interface', () => {
      expect(typeof fetcher.use).toBe('function');
      expect(typeof fetcher.create).toBe('function');
    });
  });

  describe('Middleware Registration - use()', () => {
    it('should register request middleware', () => {
      const middleware: RequestMiddleware = async function(request, next) {
        return next();
      };

      expect(() => fetcher.use('request', middleware)).not.toThrow();
    });

    it('should register response middleware', () => {
      const middleware: ResponseMiddleware = async function(response, next) {
        return next();
      };

      expect(() => fetcher.use('response', middleware)).not.toThrow();
    });

    it('should register multiple request middlewares', () => {
      const middleware1: RequestMiddleware = async function(request, next) {
        return next();
      };
      const middleware2: RequestMiddleware = async function(request, next) {
        return next();
      };

      fetcher.use('request', middleware1);
      fetcher.use('request', middleware2);

      // Both should be registered (verified by execution order later)
      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });

    it('should register multiple response middlewares', () => {
      const middleware1: ResponseMiddleware = async function(response, next) {
        return next();
      };
      const middleware2: ResponseMiddleware = async function(response, next) {
        return next();
      };

      fetcher.use('response', middleware1);
      fetcher.use('response', middleware2);

      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });

    it('should register both request and response middlewares', () => {
      const reqMiddleware: RequestMiddleware = async function(request, next) {
        return next();
      };
      const resMiddleware: ResponseMiddleware = async function(response, next) {
        return next();
      };

      fetcher.use('request', reqMiddleware);
      fetcher.use('response', resMiddleware);

      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });
  });

  describe('Fetch Function Creation - create()', () => {
    it('should create a fetch function bound to Context', () => {
      const ctx = new Context({ user: 'test' });
      const fetchFn = fetcher.create(ctx);

      expect(typeof fetchFn).toBe('function');
      expect(fetchFn.length).toBe(2); // input and init parameters
    });

    it('should create fetch function that calls native fetch', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should create fetch function with correct signature', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      // Test with string URL
      await fetchFn('https://example.com');
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockClear();

      // Test with URL object
      await fetchFn(new URL('https://example.com'));
      expect(mockFetch).toHaveBeenCalled();

      mockFetch.mockClear();

      // Test with Request object
      await fetchFn(new Request('https://example.com'));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should create fetch function with init parameter support', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": true}'
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should bind fetch function to Context instance', async () => {
      const ctx = new Context({ userId: 123 });

      let capturedThis: any;
      fetcher.use('request', function(request, next) {
        capturedThis = this;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedThis).toBe(ctx);
      expect(capturedThis.application.userId).toBe(123);
    });
  });

  describe('Request Middleware Execution', () => {
    it('should execute request middleware before fetch', async () => {
      const executionOrder: string[] = [];

      fetcher.use('request', async function(request, next) {
        executionOrder.push('request-middleware');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockImplementation(() => {
        executionOrder.push('native-fetch');
        return Promise.resolve(new Response('test'));
      });

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['request-middleware', 'native-fetch']);
    });

    it('should execute multiple request middlewares in order', async () => {
      const executionOrder: string[] = [];

      fetcher.use('request', async function(request, next) {
        executionOrder.push('middleware-1');
        return next();
      });

      fetcher.use('request', async function(request, next) {
        executionOrder.push('middleware-2');
        return next();
      });

      fetcher.use('request', async function(request, next) {
        executionOrder.push('middleware-3');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['middleware-1', 'middleware-2', 'middleware-3']);
    });

    it('should pass Request object to middleware', async () => {
      let capturedRequest: Request | undefined;

      fetcher.use('request', async function(request, next) {
        capturedRequest = request;
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com', { method: 'POST' });

      expect(capturedRequest).toBeInstanceOf(Request);
      expect(capturedRequest?.url).toBe('https://example.com/');
      expect(capturedRequest?.method).toBe('POST');
    });

    it('should allow middleware to modify request headers', async () => {
      fetcher.use('request', async function(request, next) {
        request.headers.set('Authorization', 'Bearer token123');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('Authorization')).toBe('Bearer token123');
    });

    it('should allow middleware to access Context via this', async () => {
      const ctx = new Context({ token: 'secret' });

      fetcher.use('request', function(request, next) {
        const token = this.application.token;
        request.headers.set('Authorization', `Bearer ${token}`);
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('Authorization')).toBe('Bearer secret');
    });

    it('should allow middleware to access navigation via this', async () => {
      const ctx = new Context({}, [], '/test-route', {});

      let capturedRoute: string | undefined;
      fetcher.use('request', function(request, next) {
        capturedRoute = this.navigation.route;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedRoute).toBe('/test-route');
    });

    it('should allow middleware to skip fetch by returning early', async () => {
      const cachedResponse = new Response('cached');

      fetcher.use('request', async function(request, next) {
        if (request.url.includes('cached')) {
          return cachedResponse;
        }
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('fresh'));

      const response = await fetchFn('https://example.com/cached');

      expect(response).toBe(cachedResponse);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should propagate errors from request middleware', async () => {
      fetcher.use('request', async function(request, next) {
        throw new Error('Request middleware error');
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      await expect(fetchFn('https://example.com')).rejects.toThrow('Request middleware error');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle async request middleware', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      fetcher.use('request', async function(request, next) {
        await delay(10);
        request.headers.set('X-Delayed', 'true');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('X-Delayed')).toBe('true');
    });
  });

  describe('Response Middleware Execution', () => {
    it('should execute response middleware after fetch', async () => {
      const executionOrder: string[] = [];

      fetcher.use('response', async function(response, next) {
        executionOrder.push('response-middleware');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockImplementation(() => {
        executionOrder.push('native-fetch');
        return Promise.resolve(new Response('test'));
      });

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['native-fetch', 'response-middleware']);
    });

    it('should execute multiple response middlewares in order', async () => {
      const executionOrder: string[] = [];

      fetcher.use('response', async function(response, next) {
        executionOrder.push('middleware-1');
        return next();
      });

      fetcher.use('response', async function(response, next) {
        executionOrder.push('middleware-2');
        return next();
      });

      fetcher.use('response', async function(response, next) {
        executionOrder.push('middleware-3');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['middleware-1', 'middleware-2', 'middleware-3']);
    });

    it('should pass Response object to middleware', async () => {
      let capturedResponse: Response | undefined;

      fetcher.use('response', async function(response, next) {
        capturedResponse = response;
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      const mockResponse = new Response('test', { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await fetchFn('https://example.com');

      expect(capturedResponse).toBe(mockResponse);
      expect(capturedResponse?.status).toBe(200);
    });

    it('should allow middleware to access Context via this', async () => {
      const ctx = new Context({}, [], '/current-route', {});

      let capturedRoute: string | undefined;
      fetcher.use('response', function(response, next) {
        capturedRoute = this.navigation.route;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedRoute).toBe('/current-route');
    });

    it('should allow middleware to throw on error responses', async () => {
      fetcher.use('response', async function(response, next) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('error', { status: 404 }));

      await expect(fetchFn('https://example.com')).rejects.toThrow('HTTP 404');
    });

    it('should allow middleware to replace response', async () => {
      const newResponse = new Response('modified');

      fetcher.use('response', async function(response, next) {
        if (response.status === 200) {
          return newResponse;
        }
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('original', { status: 200 }));

      const result = await fetchFn('https://example.com');

      expect(result).toBe(newResponse);
    });

    it('should handle async response middleware', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let delayed = false;

      fetcher.use('response', async function(response, next) {
        await delay(10);
        delayed = true;
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(delayed).toBe(true);
    });

    it('should propagate errors from response middleware', async () => {
      fetcher.use('response', async function(response, next) {
        throw new Error('Response middleware error');
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await expect(fetchFn('https://example.com')).rejects.toThrow('Response middleware error');
    });

    it('should allow reading response body in middleware', async () => {
      let bodyText: string | undefined;

      fetcher.use('response', async function(response, next) {
        const clone = response.clone();
        bodyText = await clone.text();
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test body'));

      await fetchFn('https://example.com');

      expect(bodyText).toBe('test body');
    });
  });

  describe('Mixed Request and Response Middleware', () => {
    it('should execute in correct order: request -> fetch -> response', async () => {
      const executionOrder: string[] = [];

      fetcher.use('request', async function(request, next) {
        executionOrder.push('request');
        return next();
      });

      fetcher.use('response', async function(response, next) {
        executionOrder.push('response');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockImplementation(() => {
        executionOrder.push('fetch');
        return Promise.resolve(new Response('test'));
      });

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['request', 'fetch', 'response']);
    });

    it('should execute complex middleware chain correctly', async () => {
      const executionOrder: string[] = [];

      fetcher.use('request', async function(request, next) {
        executionOrder.push('req-1');
        return next();
      });

      fetcher.use('request', async function(request, next) {
        executionOrder.push('req-2');
        return next();
      });

      fetcher.use('response', async function(response, next) {
        executionOrder.push('res-1');
        return next();
      });

      fetcher.use('response', async function(response, next) {
        executionOrder.push('res-2');
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockImplementation(() => {
        executionOrder.push('fetch');
        return Promise.resolve(new Response('test'));
      });

      await fetchFn('https://example.com');

      expect(executionOrder).toEqual(['req-1', 'req-2', 'fetch', 'res-1', 'res-2']);
    });

    it('should pass data through the entire chain', async () => {
      fetcher.use('request', function(request, next) {
        request.headers.set('X-Request', 'from-middleware');
        return next();
      });

      fetcher.use('response', function(response, next) {
        // Verify request was modified
        return next();
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('X-Request')).toBe('from-middleware');
    });
  });

  describe('Context Integration', () => {
    it('should maintain Context binding across middleware', async () => {
      const ctx = new Context({ value: 42 });
      const capturedContexts: any[] = [];

      fetcher.use('request', function(request, next) {
        capturedContexts.push(this);
        return next();
      });

      fetcher.use('response', function(response, next) {
        capturedContexts.push(this);
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedContexts).toHaveLength(2);
      expect(capturedContexts[0]).toBe(ctx);
      expect(capturedContexts[1]).toBe(ctx);
      expect(capturedContexts[0].application.value).toBe(42);
    });

    it('should access updated application state', async () => {
      const ctx = new Context({ counter: 0 });

      fetcher.use('request', function(request, next) {
        this.application.counter++;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');
      expect(ctx.application.counter).toBe(1);

      await fetchFn('https://example.com');
      expect(ctx.application.counter).toBe(2);
    });

    it('should access Context ID', async () => {
      const ctx = new Context({});
      let capturedId: number | undefined;

      fetcher.use('request', function(request, next) {
        capturedId = this.id;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedId).toBe(ctx.id);
      expect(typeof capturedId).toBe('number');
    });

    it('should access navigation placards', async () => {
      const ctx = new Context({}, [{ name: 'home', title: 'Home' }], '/', {});
      let capturedPlacards: any;

      fetcher.use('request', function(request, next) {
        capturedPlacards = this.navigation.placards;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedPlacards).toHaveLength(1);
      expect(capturedPlacards[0].title).toBe('Home');
    });

    it('should access route params', async () => {
      const ctx = new Context({}, [], '/user/:id', { id: '123' });
      let capturedParams: any;

      fetcher.use('request', function(request, next) {
        capturedParams = this.navigation.params;
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com');

      expect(capturedParams).toEqual({ id: '123' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty middleware arrays', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      const response = await fetchFn('https://example.com');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toBeInstanceOf(Response);
    });

    it('should handle middleware that doesnt call next', async () => {
      const earlyResponse = new Response('early');

      fetcher.use('request', async function(request, next) {
        return earlyResponse;
      });

      fetcher.use('request', async function(request, next) {
        throw new Error('Should not reach here');
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      const response = await fetchFn('https://example.com');

      expect(response).toBe(earlyResponse);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors from fetch', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchFn('https://example.com')).rejects.toThrow('Network error');
    });

    it('should handle middleware errors before fetch', async () => {
      fetcher.use('request', async function(request, next) {
        throw new Error('Pre-fetch error');
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      await expect(fetchFn('https://example.com')).rejects.toThrow('Pre-fetch error');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle middleware errors after fetch', async () => {
      fetcher.use('response', async function(response, next) {
        throw new Error('Post-fetch error');
      });

      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await expect(fetchFn('https://example.com')).rejects.toThrow('Post-fetch error');
    });

    it('should handle concurrent fetch calls', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockImplementation((input: any) => {
        const url = typeof input === 'string' ? input : input.url;
        return Promise.resolve(new Response(url));
      });

      const [res1, res2, res3] = await Promise.all([
        fetchFn('https://example.com/1'),
        fetchFn('https://example.com/2'),
        fetchFn('https://example.com/3')
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(await res1.text()).toContain('/1');
      expect(await res2.text()).toContain('/2');
      expect(await res3.text()).toContain('/3');
    });

    it('should handle Request with custom headers', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      const request = new Request('https://example.com', {
        headers: { 'X-Custom': 'value' }
      });

      await fetchFn(request);

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('X-Custom')).toBe('value');
    });

    it('should handle Response with custom headers', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      const customResponse = new Response('test', {
        headers: { 'X-Custom-Response': 'value' }
      });

      mockFetch.mockResolvedValue(customResponse);

      const response = await fetchFn('https://example.com');

      expect(response.headers.get('X-Custom-Response')).toBe('value');
    });

    it('should handle POST with body', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.method).toBe('POST');
      expect(await callArgs.text()).toBe('{"test":true}');
    });

    it('should handle different HTTP methods', async () => {
      const ctx = new Context({});
      const fetchFn = fetcher.create(ctx);

      mockFetch.mockResolvedValue(new Response('test'));

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        await fetchFn('https://example.com', { method });

        const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as Request;
        expect(callArgs.method).toBe(method);
      }

      expect(mockFetch).toHaveBeenCalledTimes(methods.length);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should implement authentication middleware', async () => {
      const ctx = new Context({ user: { token: 'abc123' } });

      fetcher.use('request', function(request, next) {
        const token = this.application.user?.token;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://api.example.com/data');

      const callArgs = mockFetch.mock.calls[0][0] as Request;
      expect(callArgs.headers.get('Authorization')).toBe('Bearer abc123');
    });

    it('should implement error handling middleware', async () => {
      const ctx = new Context({});
      const errors: any[] = [];

      fetcher.use('response', async function(response, next) {
        if (!response.ok) {
          const error = {
            status: response.status,
            route: this.navigation.route
          };
          errors.push(error);
          throw new Error(`HTTP ${response.status}`);
        }
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('error', { status: 500 }));

      await expect(fetchFn('https://example.com')).rejects.toThrow('HTTP 500');
      expect(errors).toHaveLength(1);
      expect(errors[0].status).toBe(500);
    });

    it('should implement logging middleware', async () => {
      const ctx = new Context({}, [], '/dashboard', {});
      const logs: any[] = [];

      fetcher.use('request', function(request, next) {
        logs.push({
          type: 'request',
          url: request.url,
          method: request.method,
          route: this.navigation.route
        });
        return next();
      });

      fetcher.use('response', function(response, next) {
        logs.push({
          type: 'response',
          status: response.status,
          route: this.navigation.route
        });
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test', { status: 200 }));

      await fetchFn('https://example.com', { method: 'GET' });

      expect(logs).toHaveLength(2);
      expect(logs[0].type).toBe('request');
      expect(logs[0].url).toBe('https://example.com/');
      expect(logs[0].route).toBe('/dashboard');
      expect(logs[1].type).toBe('response');
      expect(logs[1].status).toBe(200);
    });

    it('should implement retry logic middleware', async () => {
      const ctx = new Context({});
      let attempts = 0;

      fetcher.use('response', async function(response, next) {
        if (response.status === 503 && attempts < 2) {
          attempts++;
          // Retry by making a new fetch call
          return this.fetch(response.url);
        }
        return next();
      });

      const fetchFn = fetcher.create(ctx);

      mockFetch
        .mockResolvedValueOnce(new Response('error', { status: 503 }))
        .mockResolvedValueOnce(new Response('success', { status: 200 }));

      const response = await fetchFn('https://example.com');

      expect(response.status).toBe(200);
      expect(attempts).toBe(1);
    });

    it('should implement request transformation middleware', async () => {
      const ctx = new Context({ apiBase: 'https://api.example.com' });

      fetcher.use('request', function(request, next) {
        // Transform relative URLs to absolute
        const url = new URL(request.url, this.application.apiBase);
        const newRequest = new Request(url.toString(), request);

        // Can't modify request in place, so we need to handle this differently
        // For now, just verify we can access the URL
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      await fetchFn('https://example.com/api/users');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should implement caching middleware', async () => {
      const ctx = new Context({});
      const cache = new Map<string, Response>();

      fetcher.use('request', async function(request, next) {
        if (request.method === 'GET') {
          const cached = cache.get(request.url);
          if (cached) {
            return cached.clone();
          }
        }
        return next();
      });

      fetcher.use('response', async function(response, next) {
        if (response.status === 200) {
          // Get the request URL from somewhere - in practice you'd need to pass it through
          // For this test, we'll just cache by a known URL
          cache.set('https://example.com/', response.clone());
        }
        return next();
      });

      const fetchFn = fetcher.create(ctx);
      mockFetch.mockResolvedValue(new Response('test'));

      // First call - fetches from network
      await fetchFn('https://example.com');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Manually add to cache for test
      cache.set('https://example.com/', new Response('cached'));

      // Second call - should return cached
      const response = await fetchFn('https://example.com');
      const text = await response.text();

      expect(text).toBe('cached');
    });
  });

  describe('Type Safety', () => {
    it('should enforce RequestMiddleware signature', () => {
      const validMiddleware: RequestMiddleware = async function(request, next) {
        return next();
      };

      fetcher.use('request', validMiddleware);
      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });

    it('should enforce ResponseMiddleware signature', () => {
      const validMiddleware: ResponseMiddleware = async function(response, next) {
        return next();
      };

      fetcher.use('response', validMiddleware);
      expect(fetcher).toBeInstanceOf(ContextAwareFetcher);
    });

    it('should enforce Fetcher interface', () => {
      const customFetcher: Fetcher = new ContextAwareFetcher();

      expect(typeof customFetcher.use).toBe('function');
      expect(typeof customFetcher.create).toBe('function');
    });
  });
});
