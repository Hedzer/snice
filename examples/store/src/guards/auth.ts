import type { StoreAppContext } from '../types/store';

export function isAuthenticated(context: any, _params: Record<string, string>): boolean {
  const ctx = context as StoreAppContext;
  if (!ctx.user) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}
