import type { Principal } from '../types/auth';

export async function authMiddleware(this: any, request: Request, next: () => Promise<Response>) {
  const app = this.application;
  const principal = app?.principal as Principal | undefined;
  if (principal?.isAuthenticated) {
    request.headers.set('Authorization', 'Bearer mock-token');
  }
  return next();
}
