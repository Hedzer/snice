import type { Context } from 'snice';
import { getToken } from '../services/storage';

export async function authMiddleware(
  this: Context,
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const token = getToken();

  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }

  return next();
}
