# {{projectName}}

A Progressive Web App (PWA) built with [Snice](https://github.com/sniceio/snice).

## Features

- ⚡ **JWT Authentication** - Token-based auth with automatic refresh
- 🔒 **Protected Routes** - Route guards for authenticated pages
- 🎯 **Middleware Pattern** - Composable fetch middleware (auth, error, retry)
- 📱 **PWA Ready** - Service worker, offline support, installable
- 🔔 **Live Notifications** - WebSocket daemon for real-time updates
- 🎨 **Snice Components** - Pre-built UI components
- 📦 **Type-Safe** - Full TypeScript support
- 🚀 **Fast Build** - Vite + SWC for blazing fast dev and builds

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## Demo Credentials

- **Email:** demo@example.com
- **Password:** demo

## Project Structure

```
src/
  utils/          # Pure helper functions
  services/       # Business logic (auth, storage, jwt)
  middleware/     # Fetch middleware (auth, error, retry)
  daemons/        # Lifecycle-managed classes (notifications WebSocket)
  guards/         # Route guards (auth)
  types/          # TypeScript types
  pages/          # Routable pages (@page decorator)
  styles/         # Global styles
```

## Architecture Patterns

### Context-Aware Fetcher

Built-in middleware system with context access:

```typescript
// fetcher.ts - Setup
import { ContextAwareFetcher } from 'snice';

const fetcher = new ContextAwareFetcher();
fetcher.use('request', authMiddleware);
fetcher.use('response', errorMiddleware);

// Middleware with context access
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

// Usage in pages via ctx.fetch()
async loadData() {
  const response = await this.ctx.fetch('/api/data');
  const data = await response.json();
}
```

### Daemons for Lifecycle Management

Use daemons for resources that need start/stop/dispose:

```typescript
const daemon = getNotificationsDaemon();
daemon.start(); // In main.ts

// In component
const unsubscribe = daemon.subscribe((notification) => {
  console.log(notification);
});

// Cleanup
unsubscribe();
```

### Route Guards

Protect routes with guards:

```typescript
import { authGuard } from './guards/auth';

@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  guards: [authGuard]
})
export class DashboardPage extends HTMLElement {
  // ...
}
```

### Context for Global State

Access shared state via context:

```typescript
import type { Principal } from './types/auth';

@context()
handleContext(ctx: Context) {
  const principal = ctx.application.principal as Principal | undefined;
  this.user = principal?.user;
}
```

## Customization

### Replace Mock API

Update `src/services/auth.ts` to call your real API:

```typescript
export async function login(credentials: LoginCredentials) {
  const response = await fetch('https://your-api.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();
  setToken(data.token);
  setUser(data.user);
  return data;
}
```

### Enable Real WebSocket

Update `src/daemons/notifications.ts`:

```typescript
// Replace startMockNotifications() with:
this.connect();
```

### Configure Environment

Create `.env` file:

```
VITE_API_URL=https://your-api.com
VITE_WS_URL=wss://your-ws.com
```

### Update Icons

Replace placeholder icons in `public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## Learn More

- [Snice Documentation](https://sniceio.github.io/snice)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

## License

MIT
