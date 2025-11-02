import type { AppContext } from 'snice';
import type { Principal } from '../types/auth';

export function authGuard(appContext: AppContext): boolean {
  const principal = appContext.principal as Principal | undefined;

  if (!principal?.isAuthenticated) {
    window.location.href = '#/login';
    return false;
  }
  return true;
}
