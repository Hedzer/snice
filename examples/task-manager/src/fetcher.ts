import { ContextAwareFetcher } from 'snice';
import { authMiddleware } from './middleware/auth';

const fetcher = new ContextAwareFetcher();

fetcher.use('request', authMiddleware);

export { fetcher };
