# Fetcher

Human reference: `docs/fetcher.md`. `ContextAwareFetcher` — context-aware fetch with request/response middleware, wired via `Router({ fetcher })`. See docs/ai/routing.md for `RouterOptions.fetcher` and the `Context` shape.

## Overview

Enables: automatic auth headers, consistent error handling, request/response logging, request/response transforms, retry logic, timing metrics, and middleware access to application/navigation state.

## Basic usage

```typescript
import { Router, ContextAwareFetcher } from 'snice';

const fetcher = new ContextAwareFetcher();

// Request middleware — `this` is bound to the Context instance
fetcher.use('request', function(request, next) {
  const jwt = this.application.principal?.token;
  if (jwt) request.headers.set('Authorization', `Bearer ${jwt}`);
  return next();
});

// Response middleware — runs after fetch
fetcher.use('response', async function(response, next) {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return next();
});

const router = Router({ target: '#app', context: { auth: null }, fetcher });
router.initialize();
```

Pages, descendant elements, and attached controllers receive the Router's
long-lived `Context` through `@context()`; its `ctx.fetch` is the bound,
middleware-aware function. `getContextFetch(this)` remains the lower-level
lookup for code using an explicit non-router
`provideContext(root, appContext, { fetch })` boundary.

## `ctx.fetch` in pages, elements, and controllers

Available on any `Context` obtained via `@context()`; middleware applies automatically:

```typescript
@page({ tag: 'user-page', routes: ['/users/:id'] })
class UserPage extends HTMLElement {
  private ctx: Context;
  @context() handleContext(ctx: Context) { this.ctx = ctx; }
  @ready() async loadUser() {
    const user = await this.ctx.fetch('/api/users/123').then(r => r.json());
  }
}
```

Controllers use the same decorator. Managed decorators are activated after
`attach()`, so start context-dependent work from the handler:

```typescript
@controller('user-data')
class UserDataController implements IController<HTMLElement> {
  element: HTMLElement | null = null;
  private ctx?: Context;

  attach(element: HTMLElement) { this.element = element; }
  detach() { this.ctx = undefined; }

  @context()
  receiveContext(ctx: Context) {
    this.ctx = ctx;
    void this.load();
  }

  async load() {
    const response = await this.ctx!.fetch('/api/users');
    // Commit through the host's public API.
  }
}
```

## Middleware types

### Request middleware — runs before the `fetch()` call

```typescript
type RequestMiddleware = (this: Context, request: Request, next: () => Promise<Response>) => Promise<Response>
```

Use cases: auth headers, URL rewriting (base URL), logging outgoing requests, custom headers (CSRF/API keys), request validation.

```typescript
// JWT bearer token
fetcher.use('request', function(request, next) {
  const jwt = this.application.principal?.token;
  if (jwt) request.headers.set('Authorization', `Bearer ${jwt}`);
  return next();
});

// Request logging
fetcher.use('request', function(request, next) {
  console.log(`[${this.navigation.route}] ${request.method} ${request.url}`);
  return next();
});
```

Token-refresh-on-401 pattern (response middleware retries via a fresh `Request`):
```typescript
fetcher.use('response', async function(response, next) {
  if (response.status === 401) {
    const refreshToken = this.application.principal?.refreshToken;
    if (refreshToken) {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const { token } = await res.json();
        this.application.principal.token = token;
        const retry = new Request(response.url, { headers: { 'Authorization': `Bearer ${token}` } });
        return fetch(retry);
      }
    }
    this.application.principal = null;
    window.location.hash = '#/login';
    throw new Error('Session expired');
  }
  return next();
});
```

### Response middleware — runs after the `fetch()` call completes

```typescript
type ResponseMiddleware = (this: Context, response: Response, next: () => Promise<Response>) => Promise<Response>
```

Use cases: status-based error handling, response transform, logging, caching, performance metrics, retry logic.

```typescript
// Error handling
fetcher.use('response', async function(response, next) {
  if (!response.ok) {
    const error = await response.text();
    console.error(`[${this.navigation.route}] HTTP ${response.status}:`, error);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return next();
});

// Response logging
fetcher.use('response', async function(response, next) {
  console.log(`[${this.navigation.route}] Response ${response.status} from ${response.url}`);
  return next();
});
```

Performance metrics (paired request+response middleware):
```typescript
const timings = new Map<string, number>();
fetcher.use('request', function(request, next) { timings.set(request.url, Date.now()); return next(); });
fetcher.use('response', async function(response, next) {
  const start = timings.get(response.url);
  if (start) { console.log(`${response.url} took ${Date.now() - start}ms`); timings.delete(response.url); }
  return next();
});
```

## Accessing Context in middleware

`this` is bound to the `Context` instance:

- `this.application` — app-wide state (user, config, theme, etc.)
- `this.navigation` — navigation state (current route, route params, placards)
- `this.id` — unique context instance ID

```typescript
fetcher.use('response', async function(response, next) {
  if (response.status === 401) {
    this.application.user = null;
    window.location.hash = '#/login';
    throw new Error('Authentication required');
  }
  if (response.status === 403) {
    console.error(`Access denied on route: ${this.navigation.route}`);
    throw new Error('Access forbidden');
  }
  return next();
});
```

## Execution order

Middleware executes in registration order:

1. Request middleware runs first-registered-first (multiple `use('request', ...)` calls chain in order).
2. Actual `fetch()` call happens.
3. Response middleware runs first-registered-first.

## API reference

```typescript
class ContextAwareFetcher implements Fetcher {
  constructor()
  use(type: 'request', middleware: RequestMiddleware): void   // add middleware that runs before the fetch call
  use(type: 'response', middleware: ResponseMiddleware): void // add middleware that runs after the fetch call
  create(ctx: Context): typeof globalThis.fetch               // bind a fetch fn to a Context; called internally by Router
}

interface Fetcher {
  use(type: 'request', middleware: RequestMiddleware): void;
  use(type: 'response', middleware: ResponseMiddleware): void;
  create(ctx: Context): typeof globalThis.fetch;
}
```

## Behavior notes

- **Context is long-lived**: one `Context` instance is created per Router and persists for the entire application lifetime — middleware is configured once at startup, `ctx.fetch` is initialized once and reused, and middleware can safely reference `this.application`/`this.navigation` since they update in place.
- **Request headers are mutable**: `request.headers.set('X-Custom', 'value')` works directly inside middleware.
- **No fetcher → native fetch**: if `fetcher` is omitted from `Router({...})`, `ctx.fetch` defaults to the native `fetch` function bound to the `Context` instance.
- **Configure middleware at startup**, not inside pages — adding middleware inside a page would duplicate it on each navigation.
- **Clone before reading a response body** — streams can only be read once:
  ```typescript
  fetcher.use('response', async function(response, next) {
    const clone = response.clone();
    const text = await clone.text();
    console.log('Response body:', text);
    return next(); // original response still has a readable body
  });
  ```
- **Always call and return `next()`** — every middleware must call and return `next()` to continue the chain.
