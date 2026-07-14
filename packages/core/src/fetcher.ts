import type { Context } from './types/context';

/**
 * Middleware for modifying requests before they are sent
 * `this` is bound to the Context instance
 */
export type RequestMiddleware = (
  this: Context,
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Middleware for handling responses after they are received
 * `this` is bound to the Context instance
 */
export type ResponseMiddleware = (
  this: Context,
  response: Response,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Interface for fetch middleware implementations
 */
export interface Fetcher {
  use(type: 'request', middleware: RequestMiddleware): void;
  use(type: 'response', middleware: ResponseMiddleware): void;
  create(ctx: Context): typeof globalThis.fetch;
}

/**
 * Context-aware fetch implementation with middleware support
 *
 * @example
 * ```typescript
 * const fetcher = new ContextAwareFetcher();
 *
 * fetcher.use('request', function(request, next) {
 *   const token = this.application.user?.token;
 *   if (token) {
 *     request.headers.set('Authorization', `Bearer ${token}`);
 *   }
 *   return next();
 * });
 *
 * fetcher.use('response', async function(response, next) {
 *   if (!response.ok) {
 *     throw new Error(`HTTP ${response.status}`);
 *   }
 *   return next();
 * });
 *
 * const router = Router({
 *   target: '#app',
 *   context: { user: null },
 *   fetcher
 * });
 * ```
 */
export class ContextAwareFetcher implements Fetcher {
  private requestMiddlewares: RequestMiddleware[] = [];
  private responseMiddlewares: ResponseMiddleware[] = [];

  /**
   * Add middleware to the fetch pipeline
   * @param type - 'request' for pre-fetch middleware, 'response' for post-fetch middleware
   * @param middleware - The middleware function
   */
  use(type: 'request', middleware: RequestMiddleware): void;
  use(type: 'response', middleware: ResponseMiddleware): void;
  use(type: 'request' | 'response', middleware: RequestMiddleware | ResponseMiddleware): void {
    if (type === 'request') {
      this.requestMiddlewares.push(middleware as RequestMiddleware);
      return;
    }
    this.responseMiddlewares.push(middleware as ResponseMiddleware);
  }

  /**
   * Create a fetch function bound to the given Context instance
   * @param ctx - The Context instance to bind to
   * @returns A fetch function with middleware applied
   */
  create(ctx: Context): typeof globalThis.fetch {
    const requestMiddlewares = this.requestMiddlewares;
    const responseMiddlewares = this.responseMiddlewares;

    const fetchFn = async function(
      this: Context,
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const request = new Request(input, init);

      // Request middleware chain
      let reqIndex = 0;
      const nextRequest = async (): Promise<Response> => {
        if (reqIndex < requestMiddlewares.length) {
          const middleware = requestMiddlewares[reqIndex++];
          return middleware.call(this, request, nextRequest);
        }

        // Execute actual fetch
        const response = await fetch(request);

        // Response middleware chain
        let resIndex = 0;
        const nextResponse = async (): Promise<Response> => {
          if (resIndex < responseMiddlewares.length) {
            const middleware = responseMiddlewares[resIndex++];
            return middleware.call(this, response, nextResponse);
          }
          return response;
        };

        return nextResponse();
      };

      return nextRequest();
    };

    return fetchFn.bind(ctx) as typeof globalThis.fetch;
  }
}
