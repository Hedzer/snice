import type { Context } from 'snice';
import type { StoreAppContext } from '../types/store';

export async function authMiddleware(
  this: Context,
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const app = this.application as StoreAppContext;
  if (app.user?.token) {
    request.headers.set('Authorization', `Bearer ${app.user.token}`);
  }
  return next();
}
