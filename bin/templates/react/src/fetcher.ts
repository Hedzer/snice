import { ContextAwareFetcher } from 'snice';
import { authMiddleware } from './middleware/auth';
import { errorMiddleware } from './middleware/error';
import { createRetryMiddleware } from './middleware/retry';

const fetcher = new ContextAwareFetcher();

// Add request middleware (runs before fetch)
fetcher.use('request', authMiddleware);
fetcher.use('request', createRetryMiddleware());

// Add response middleware (runs after fetch)
fetcher.use('response', errorMiddleware);

export { fetcher };
