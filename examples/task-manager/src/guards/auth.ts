import type { AppContext } from 'snice';
import type { Principal } from '../types/auth';

export function isAuthenticated(appContext: AppContext, _params: Record<string, string>): boolean {
  const principal = appContext.principal as Principal | undefined;
  if (!principal?.isAuthenticated) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}
