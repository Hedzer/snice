import { Router } from 'snice';
import type { Principal } from './types/auth';
import { getCurrentUser, isAuthenticated } from './services/auth';
import { fetcher } from './fetcher';

export interface AppContext {
  principal: Principal;
  theme: 'light' | 'dark';
}

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell',
  fetcher,
  context: {
    principal: {
      user: getCurrentUser(),
      isAuthenticated: isAuthenticated(),
    } as Principal,
    theme: (localStorage.getItem('task-manager-theme') || 'light') as 'light' | 'dark',
  },
});

export { page, initialize, navigate };
