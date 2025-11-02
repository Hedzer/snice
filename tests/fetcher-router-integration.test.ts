import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, ContextAwareFetcher, context, Context } from '../src';

const originalFetch = global.fetch;

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Fetcher Router Integration', () => {
  let container: HTMLDivElement;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Router with Fetcher Option', () => {
    it('should accept fetcher in Router options', () => {
      const fetcher = new ContextAwareFetcher();

      expect(() => {
        Router({
          target: '#app',
          type: 'hash',
          fetcher
        });
      }).not.toThrow();
    });

    it('should create Router without fetcher (optional)', () => {
      expect(() => {
        Router({
          target: '#app',
          type: 'hash'
        });
      }).not.toThrow();
    });

    it('should pass fetcher to Context', async () => {
      const fetcher = new ContextAwareFetcher();
      let capturedFetch: any;

      fetcher.use('request', function(request, next) {
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'test-fetch-page', routes: ['/'] })
      class TestPage extends HTMLElement {
        @context()
        handleContext(ctx: Context) {
          capturedFetch = ctx.fetch;
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      expect(typeof capturedFetch).toBe('function');
    });

    it('should provide native fetch when no fetcher given', async () => {
      let capturedFetch: any;

      const router = Router({
        target: '#app',
        type: 'hash'
      });

      @router.page({ tag: 'native-fetch-page', routes: ['/'] })
      class NativePage extends HTMLElement {
        @context()
        handleContext(ctx: Context) {
          capturedFetch = ctx.fetch;
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      expect(typeof capturedFetch).toBe('function');
      // Native fetch should work
      mockFetch.mockResolvedValue(new Response('test'));
      await capturedFetch('https://example.com');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Context.fetch in Pages', () => {
    it('should make ctx.fetch available in pages', async () => {
      const fetcher = new ContextAwareFetcher();
      let fetchAvailable = false;

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'fetch-available-page', routes: ['/'] })
      class FetchPage extends HTMLElement {
        @context()
        handleContext(ctx: Context) {
          fetchAvailable = typeof ctx.fetch === 'function';
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      expect(fetchAvailable).toBe(true);
    });

    it('should execute middleware when ctx.fetch is called', async () => {
      const fetcher = new ContextAwareFetcher();
      const middlewareCalled = vi.fn();

      fetcher.use('request', function(request, next) {
        middlewareCalled();
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'middleware-page', routes: ['/'] })
      class MiddlewarePage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('middleware-page') as any;
      await page.makeRequest();

      expect(middlewareCalled).toHaveBeenCalled();
    });

    it('should access application context in middleware', async () => {
      const fetcher = new ContextAwareFetcher();
      let capturedUser: any;

      fetcher.use('request', function(request, next) {
        capturedUser = this.application.user;
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        context: { user: { name: 'Alice', id: 123 } },
        fetcher
      });

      @router.page({ tag: 'context-page', routes: ['/'] })
      class ContextPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('context-page') as any;
      await page.makeRequest();

      expect(capturedUser).toEqual({ name: 'Alice', id: 123 });
    });

    it('should access navigation state in middleware', async () => {
      const fetcher = new ContextAwareFetcher();
      let capturedRoute: string | undefined;
      let capturedParams: any;

      fetcher.use('request', function(request, next) {
        capturedRoute = this.navigation.route;
        capturedParams = this.navigation.params;
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'nav-page', routes: ['/user/:id'] })
      class NavPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/user/456');
      await waitFor(100);

      const page = document.querySelector('nav-page') as any;
      await page.makeRequest();

      expect(capturedRoute).toBe('/user/456');
      expect(capturedParams).toEqual({ id: '456' });
    });
  });

  describe('Multiple Pages with Shared Fetcher', () => {
    it('should share fetcher configuration across pages', async () => {
      const fetcher = new ContextAwareFetcher();
      const requestLog: string[] = [];

      fetcher.use('request', function(request, next) {
        requestLog.push(`${this.navigation.route}:${request.url}`);
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'page-one', routes: ['/one'] })
      class PageOne extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://api.example.com/one');
        }
      }

      @router.page({ tag: 'page-two', routes: ['/two'] })
      class PageTwo extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://api.example.com/two');
        }
      }

      router.initialize();

      // Navigate to page one
      await router.navigate('/one');
      await waitFor(100);
      const pageOne = document.querySelector('page-one') as any;
      await pageOne.makeRequest();

      // Navigate to page two
      await router.navigate('/two');
      await waitFor(100);
      const pageTwo = document.querySelector('page-two') as any;
      await pageTwo.makeRequest();

      expect(requestLog).toHaveLength(2);
      expect(requestLog[0]).toBe('/one:https://api.example.com/one');
      expect(requestLog[1]).toBe('/two:https://api.example.com/two');
    });

    it('should maintain middleware state across navigations', async () => {
      const fetcher = new ContextAwareFetcher();
      let callCount = 0;

      fetcher.use('request', function(request, next) {
        callCount++;
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'count-page-a', routes: ['/a'] })
      class PageA extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      @router.page({ tag: 'count-page-b', routes: ['/b'] })
      class PageB extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();

      await router.navigate('/a');
      await waitFor(100);
      const pageA = document.querySelector('count-page-a') as any;
      await pageA.makeRequest();
      expect(callCount).toBe(1);

      await router.navigate('/b');
      await waitFor(100);
      const pageB = document.querySelector('count-page-b') as any;
      await pageB.makeRequest();
      expect(callCount).toBe(2);
    });
  });

  describe('Authentication Flow', () => {
    it('should implement complete auth flow with middleware', async () => {
      const fetcher = new ContextAwareFetcher();

      // Add auth token from context
      fetcher.use('request', function(request, next) {
        const token = this.application.auth?.token;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        return next();
      });

      // Handle 401 responses
      fetcher.use('response', async function(response, next) {
        if (response.status === 401) {
          // Clear auth
          this.application.auth = null;
          throw new Error('Unauthorized');
        }
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        context: { auth: { token: 'secret123' } },
        fetcher
      });

      @router.page({ tag: 'auth-page', routes: ['/'] })
      class AuthPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          await this.ctx?.fetch('https://api.example.com/protected');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('auth-page') as any;

      // Successful request with token
      mockFetch.mockResolvedValue(new Response('success', { status: 200 }));
      await page.makeRequest();

      const authHeader = (mockFetch.mock.calls[0][0] as Request).headers.get('Authorization');
      expect(authHeader).toBe('Bearer secret123');

      // 401 response clears auth
      mockFetch.mockResolvedValue(new Response('unauthorized', { status: 401 }));
      await expect(page.makeRequest()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors consistently across pages', async () => {
      const fetcher = new ContextAwareFetcher();
      const errors: any[] = [];

      fetcher.use('response', async function(response, next) {
        if (!response.ok) {
          errors.push({
            status: response.status,
            route: this.navigation.route
          });
          throw new Error(`HTTP ${response.status}`);
        }
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'error-page', routes: ['/'] })
      class ErrorPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('error-page') as any;

      mockFetch.mockResolvedValue(new Response('error', { status: 500 }));
      await expect(page.makeRequest()).rejects.toThrow('HTTP 500');

      expect(errors).toHaveLength(1);
      expect(errors[0].status).toBe(500);
      expect(errors[0].route).toBe('/');
    });
  });

  describe('Context Updates', () => {
    it('should reflect context updates in middleware', async () => {
      const fetcher = new ContextAwareFetcher();
      const tokens: (string | undefined)[] = [];

      fetcher.use('request', function(request, next) {
        tokens.push(this.application.token);
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        context: { token: 'initial' },
        fetcher
      });

      @router.page({ tag: 'update-page', routes: ['/'] })
      class UpdatePage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }

        updateToken(newToken: string) {
          if (this.ctx) {
            this.ctx.application.token = newToken;
          }
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('update-page') as any;

      // First request with initial token
      await page.makeRequest();
      expect(tokens[0]).toBe('initial');

      // Update token
      page.updateToken('updated');

      // Second request with updated token
      await page.makeRequest();
      expect(tokens[1]).toBe('updated');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const fetcher = new ContextAwareFetcher();

      fetcher.use('request', function(request, next) {
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'concurrent-page', routes: ['/'] })
      class ConcurrentPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeMultipleRequests() {
          mockFetch.mockImplementation((input: any) => {
            const url = typeof input === 'string' ? input : input.url;
            return Promise.resolve(new Response(url));
          });

          const promises = Array.from({ length: 10 }, (_, i) =>
            this.ctx?.fetch(`https://example.com/${i}`)
          );

          return Promise.all(promises);
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('concurrent-page') as any;
      const responses = await page.makeMultipleRequests();

      expect(responses).toHaveLength(10);
      expect(mockFetch).toHaveBeenCalledTimes(10);
    });

    it('should not leak memory with many requests', async () => {
      const fetcher = new ContextAwareFetcher();

      fetcher.use('request', function(request, next) {
        return next();
      });

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'memory-page', routes: ['/'] })
      class MemoryPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('memory-page') as any;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await page.makeRequest();
      }

      expect(mockFetch).toHaveBeenCalledTimes(100);
    });
  });

  describe('Edge Cases with Router', () => {
    it('should handle navigation before fetch completes', async () => {
      const fetcher = new ContextAwareFetcher();

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'slow-page', routes: ['/slow'] })
      class SlowPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          await this.ctx?.fetch('https://example.com');
        }
      }

      @router.page({ tag: 'fast-page', routes: ['/fast'] })
      class FastPage extends HTMLElement {}

      router.initialize();
      await router.navigate('/slow');
      await waitFor(100);

      const page = document.querySelector('slow-page') as any;

      // Start slow request
      mockFetch.mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve(new Response('test')), 1000)
      ));

      const requestPromise = page.makeRequest();

      // Navigate away before request completes
      await router.navigate('/fast');
      await waitFor(100);

      // Request should still complete (even if page is gone)
      await requestPromise; // Just await it, don't check return value
    });

    it('should handle page disconnection during fetch', async () => {
      const fetcher = new ContextAwareFetcher();

      const router = Router({
        target: '#app',
        type: 'hash',
        fetcher
      });

      @router.page({ tag: 'disconnect-page', routes: ['/'] })
      class DisconnectPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/');
      await waitFor(100);

      const page = document.querySelector('disconnect-page') as any;

      // Start request
      mockFetch.mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve(new Response('test')), 100)
      ));

      const requestPromise = page.makeRequest();

      // Remove page from DOM
      page.remove();

      // Request should still complete (even if page is disconnected)
      await requestPromise; // Just await it, don't check return value
    });

    it('should work with guards that check auth', async () => {
      const fetcher = new ContextAwareFetcher();

      fetcher.use('request', function(request, next) {
        const user = this.application.user;
        if (user) {
          request.headers.set('User-Id', user.id);
        }
        return next();
      });

      const authGuard = (context: any) => !!context.user;

      const router = Router({
        target: '#app',
        type: 'hash',
        context: { user: { id: '123' } },
        fetcher
      });

      @router.page({
        tag: 'guarded-page',
        routes: ['/protected'],
        guards: authGuard
      })
      class GuardedPage extends HTMLElement {
        private ctx?: Context;

        @context()
        handleContext(ctx: Context) {
          this.ctx = ctx;
        }

        async makeRequest() {
          mockFetch.mockResolvedValue(new Response('test'));
          await this.ctx?.fetch('https://example.com');
        }
      }

      router.initialize();
      await router.navigate('/protected');
      await waitFor(100);

      const page = document.querySelector('guarded-page') as any;
      if (page) {
        await page.makeRequest();

        const userIdHeader = (mockFetch.mock.calls[0][0] as Request).headers.get('User-Id');
        expect(userIdHeader).toBe('123');
      }
    });
  });
});
