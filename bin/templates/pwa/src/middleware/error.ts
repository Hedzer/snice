import type { Context } from 'snice';
import type { Principal } from '../types/auth';
import { clearToken } from '../services/storage';

export async function errorMiddleware(
  this: Context,
  response: Response,
  next: () => Promise<Response>
): Promise<Response> {
  // Handle 401 unauthorized - token expired or invalid
  if (response.status === 401) {
    clearToken();

    // Update context to reflect logged out state
    if (this.application.principal) {
      const principal = this.application.principal as Principal;
      principal.user = null;
      principal.isAuthenticated = false;
    }

    window.location.href = '#/login';
    throw new Error('Unauthorized - redirecting to login');
  }

  // Handle other errors
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  return next();
}
