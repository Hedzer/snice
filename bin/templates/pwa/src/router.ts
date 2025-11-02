import { Router } from 'snice';
import type { Principal } from './types/auth';
import { getUser } from './services/storage';
import { isAuthenticated } from './services/auth';
import { fetcher } from './fetcher';

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'snice-layout',
  fetcher,
  context: {
    principal: {
      user: getUser(),
      isAuthenticated: isAuthenticated()
    } as Principal
  }
});

export { page, initialize, navigate };
