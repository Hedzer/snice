import type { Context } from 'snice';

export function createRetryMiddleware(retries = 3, delay = 1000) {
  return async function retryMiddleware(
    this: Context,
    _request: Request,
    next: () => Promise<Response>
  ): Promise<Response> {
    let lastError: Error;

    for (let i = 0; i < retries; i++) {
      try {
        return await next();
      } catch (err) {
        lastError = err as Error;

        // Don't retry on certain errors
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          throw err;
        }

        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError!;
  };
}
