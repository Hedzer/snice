# Request/Response

Mirrors `docs/request-response.md`.

Request/response communication between elements, controllers, and provided daemons using async generators.

## Why

- Elements are **generic** — a `<product-card>` doesn't know if data comes from REST, GraphQL, WebSocket, or a fixture.
- Controllers are **specific** — wire a particular data source/API/business rule to a generic component.
- Element says *what* it needs; controller decides *how*.
- Swapping controllers changes behavior without touching the component (mock for tests, real API in prod, WebSocket for live updates).
- An element with `@request('fetch-product')` works with any controller that `@respond`s to `'fetch-product'` — no imports, no interfaces, no coupling.

## Basic Concept

1. Element yields a request payload.
2. Controller receives payload, returns a response.
3. Element receives response, updates visual state.

Implemented via async generators + custom events. Each `@request` method supports **one yield per invocation**.

## Decorators

```typescript
function request(requestName: string, options?: RequestOptions): MethodDecorator
function respond(requestName: string, options?: RespondOptions): MethodDecorator

interface RequestOptions extends EventInit {
  daemon?: string;          // named daemon from nearest provided app context
  timeout?: number;          // response timeout ms, default 120000 (2 min)
  discoveryTimeout?: number; // handler discovery timeout ms, default 50
  debounce?: number;
  throttle?: number;
  // `composed` always forced true (crosses shadow DOM boundaries)
  // `bubbles` defaults true, `cancelable` defaults false
}

interface RespondOptions {
  daemon?: string;          // install responder on named daemon target
  debounce?: number;
  throttle?: number;
}

// Public return type for methods decorated with @request:
type Response<T = any> = T | any;
```

TypeScript cannot model a method decorator changing an async generator into a
promise-returning method. This is a deliberate pragmatic annotation: it keeps
strict consumers usable and documents `T`; the decorated runtime method
returns a promise for `T`.

### Response debounce/throttle

```typescript
@controller('processing-controller')
class ProcessingController implements IController {
  element: HTMLElement | null = null;
  async attach() {}
  async detach() {}

  @respond('search', { debounce: 300 })
  async handleSearch(query: { term: string }) {
    return await fetch(`/api/search?q=${encodeURIComponent(query.term)}`).then(r => r.json());
  }

  @respond('analytics', { throttle: 1000 })
  async handleAnalytics(event: any) {
    return await fetch('/api/track', { method: 'POST', body: JSON.stringify(event) });
  }
}
```

Daemon communication uses the same protocol without DOM bubbling:

```typescript
@request('get-session', { daemon: 'session' })
async *getSession() { return yield {}; }
```

The daemon's plain `@respond('get-session')` handles it. See
[daemons](./daemons.md).

## Element-Side Requests

```typescript
@element('product-card')
class ProductCard extends HTMLElement {
  @property() productId = '';
  @property() name = '';
  @property() price = '';

  @request('fetch-product')
  async *loadProduct(): Response<void> {
    const product = await (yield { id: this.productId });
    this.name = product.name;
    this.price = product.price;
  }

  @render()
  renderContent() {
    return html`<h3>${this.name || 'Loading...'}</h3><button @click=${this.loadProduct}>Refresh</button>`;
  }
}
```

How it works:
1. `yield { id: this.productId }` dispatches a bubbling custom event with the payload.
2. A `@respond('fetch-product')` handler (typically in a controller) catches it, returns data.
3. `await (yield ...)` resolves with the response.
4. Element updates properties, triggering re-render.

## Controller-Side Responses

```typescript
@controller('product-controller')
class ProductController implements IController {
  element: HTMLElement | null = null;
  async attach() {}
  async detach() {}

  @respond('fetch-product')
  async handleFetchProduct(request: { id: string }) {
    return await fetch(`/api/products/${request.id}`).then(r => r.json());
  }
}
```

Elements never call `fetch()` or manage data directly — they yield requests upward and render whatever comes back. Controllers own the data layer.

## Options

### Timeout — two separate timeouts

- **Discovery timeout** (`discoveryTimeout`): 50ms default — finds a handler quickly.
- **Response timeout** (`timeout`): 2 minutes default — total time for the response.

```typescript
@request('heavy-computation', { discoveryTimeout: 50, timeout: 30000 })
async *compute(): Response<any> { return await (yield data); }
```

### Debounce/Throttle

```typescript
@request('search', { debounce: 300 })
async *search(): Response<any[]> { return await (yield { query: this.searchTerm }); }

@request('track', { throttle: 1000 })
async *trackEvent(): Response<void> { await (yield { event: 'scroll', position: window.scrollY }); }
```

## Error Handling

### Element-side

```typescript
@request('load-data', { timeout: 5000 })
async *loadData(): Response<void> {
  try {
    this.data = await (yield { id: this.dataId });
    this.error = '';
  } catch (err: any) {
    if (err.message.includes('no handler found')) this.error = 'Service unavailable';
    else if (err.message.includes('timed out')) this.error = 'Request timed out';
    else this.error = err.message;
  }
}
```

### Controller-side

```typescript
@respond('load-data')
async handleLoadData(request: { id: string }) {
  if (!request.id) throw new Error('ID is required');
  const response = await fetch(`/api/data/${request.id}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json();
}
```

## Advanced Patterns

### Cached responses

```typescript
@controller('cached-controller')
class CachedController implements IController {
  element: HTMLElement | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 minute
  async attach() {}
  async detach() {}

  @respond('fetch-cached')
  async handleFetch(request: { key: string; forceRefresh?: boolean }) {
    const cached = this.cache.get(request.key);
    if (!request.forceRefresh && cached && Date.now() - cached.timestamp < this.ttl) {
      return { data: cached.data, fromCache: true };
    }
    const data = await fetch(`/api/${request.key}`).then(r => r.json());
    this.cache.set(request.key, { data, timestamp: Date.now() });
    return { data, fromCache: false };
  }
}
```

### Subscription pattern

Use `@request` for one-time fetch, `@dispatch` + `@on` for ongoing updates:

```typescript
@element('live-ticker')
class LiveTicker extends HTMLElement {
  @property() price = '0.00';
  @property() symbol = 'BTC';

  @request('subscribe-ticker')
  async *subscribe(): Response<void> { await (yield { symbol: this.symbol }); }

  @on('ticker-update')
  onUpdate(e: CustomEvent) { this.price = e.detail.price; }
}

@controller('ticker-controller')
class TickerController implements IController {
  element: HTMLElement | null = null;
  private ws?: WebSocket;
  async attach() {}
  async detach() { this.ws?.close(); }

  @respond('subscribe-ticker')
  async handleSubscribe(request: { symbol: string }) {
    this.ws = new WebSocket(`wss://api.example.com/ticker/${request.symbol}`);
    this.ws.onmessage = (msg) => {
      this.element?.dispatchEvent(new CustomEvent('ticker-update', { detail: JSON.parse(msg.data) }));
    };
    return { subscribed: true };
  }
}
```

## Using Without Decorators

For vanilla JS or React code responding to `@request` channels without the decorator system.

### Vanilla JS: createRequestHandler

```javascript
import { createRequestHandler } from 'snice';

// Attach to any DOM target (events bubble, so ancestors work)
const cleanup = createRequestHandler(document.getElementById('app'), {
  'fetch-user': async (payload) => (await fetch(`/api/users/${payload.id}`)).json(),
  'save-settings': async (payload) => {
    await fetch('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
    return { ok: true };
  }
});

// Global handler (catches all bubbling requests)
const globalCleanup = createRequestHandler(document, {
  'fetch-user': async (payload) => ({ name: 'Jane', id: payload.id }),
});

cleanup(); // remove all listeners
```

Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `passive` | `boolean` | `false` | When true, doesn't stop event propagation (allows multiple handlers) |

### React: useRequestHandler

Full docs, examples, options, global handler patterns: [react-integration.md#userequesthandler](react-integration.md#userequesthandler).

```tsx
import { useRequestHandler } from 'snice/react';

function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);
  useRequestHandler(ref, {
    'fetch-user': async (payload) => (await fetch(`/api/users/${payload.id}`)).json(),
  });
  return <div ref={ref}><snice-user-card /></div>;
}
```

Route callbacks are ref-stable — no `useCallback` needed. Listeners re-attach only when channel names change. Cleanup automatic on unmount.
