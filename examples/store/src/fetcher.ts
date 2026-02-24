import { ContextAwareFetcher } from 'snice';
import { authMiddleware } from './middleware/auth';
import { createRetryMiddleware } from './middleware/retry';

const fetcher = new ContextAwareFetcher();

fetcher.use('request', authMiddleware);
fetcher.use('request', createRetryMiddleware(2, 500));

export { fetcher };
