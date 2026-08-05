<!-- AI: For the AI-optimized version of this doc, see docs/ai/request-response.md -->
# Request/Response API Documentation

Request/Response provides request/response communication between elements,
controllers, and explicitly provided daemons using async generators.

## Table of Contents
- [Why Request/Response?](#why-request-response)
- [Basic Concept](#basic-concept)
- [Request/Response Decorators](#request-response-decorators)
- [Element-Side Requests](#element-side-requests)
- [Controller-Side Responses](#controller-side-responses)
- [Request/Response Options](#request-response-options)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)
- [Using Without Decorators](#using-without-decorators)

## Why Request/Response?

Components are **generic**. A `<product-card>` renders a card — it doesn't know or care whether its data comes from a REST API, a GraphQL endpoint, a WebSocket, or a test fixture. Controllers are **specific**. They wire a particular data source, API, or business rule to a generic component.

The `@request`/`@respond` pattern keeps this separation clean:

- **The element says *what* it needs** (e.g., "I need product data for this ID") without knowing *how* to get it.
- **The controller decides *how*** — makes the API call, applies business logic, caches results, whatever is needed.
- **Swapping controllers changes behavior without touching the component.** Attach a mock controller for tests, a real API controller in production, or a WebSocket controller for live updates — the element is the same.

This makes components reusable across projects and testable in isolation. An element with `@request('fetch-product')` works with *any* controller that `@respond`s to `'fetch-product'` — no imports, no interfaces, no coupling.

## Basic Concept

Request/Response enables a single request/response round-trip between elements and their controllers:

1. **Element** yields a request payload — "here's what I need"
2. **Controller** receives the payload and returns a response — "here's the data"
3. **Element** receives the response and updates its visual state

This pattern is implemented using async generators and custom events. Each `@request` method supports **one yield** per invocation — the generator yields a request payload, the controller responds, and the generator receives the response.

## Request/Response Decorators

### Signature

```typescript
function request(requestName: string, options?: RequestOptions): MethodDecorator
function respond(requestName: string, options?: RespondOptions): MethodDecorator

interface RequestOptions extends EventInit {
  daemon?: string;          // Named daemon from nearest provided app context
  timeout?: number;         // Response timeout in ms (default: 120000ms = 2 minutes)
  discoveryTimeout?: number; // Handler discovery timeout in ms (default: 50ms)
  debounce?: number;        // Debounce requests by specified ms
  throttle?: number;        // Throttle requests by specified ms
  // Note: `composed` is always forced to `true` (crosses shadow DOM boundaries)
  // `bubbles` defaults to true, `cancelable` defaults to false
}

interface RespondOptions {
  daemon?: string;     // Install responder on named daemon target
  debounce?: number;   // Debounce responses by specified ms
  throttle?: number;   // Throttle responses by specified ms
}

// Public return type for methods decorated with @request:
type Response<T = any> = T | any;
```

TypeScript cannot model a method decorator changing an async generator into a
promise-returning method. `Response<T>` is the pragmatic annotation for that
boundary: it keeps strict projects usable while documenting the response value
for readers and tooling. At runtime, calling the decorated method returns a
promise for `T`.

#### Response Debounce/Throttle

Response handlers can be debounced or throttled:

```typescript
@controller('processing-controller')
class ProcessingController implements IController {
  element: HTMLElement | null = null;
  private ctx!: Context;
  async attach() {}
  async detach() {}

  @context()
  receiveContext(ctx: Context) { this.ctx = ctx; }

  @respond('search', { debounce: 300 })
  async handleSearch(query: { term: string }) {
    return await this.ctx.fetch(`/api/search?q=${encodeURIComponent(query.term)}`).then(r => r.json());
  }

  @respond('analytics', { throttle: 1000 })
  async handleAnalytics(event: any) {
    return await this.ctx.fetch('/api/track', { method: 'POST', body: JSON.stringify(event) });
  }
}
```

## Element-Side Requests

Elements use async generators to make requests. The element stays visual — it yields data up to the controller and renders the response:

```typescript
import { element, request, property, render, html } from 'snice';
import type { Response } from 'snice';

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
    return html`
      <div class="card">
        <h3>${this.name || 'Loading...'}</h3>
        <p>${this.price}</p>
        <button @click=${this.loadProduct}>Refresh</button>
      </div>
    `;
  }
}
```

**How it works:**
1. `yield { id: this.productId }` dispatches a bubbling custom event with the payload
2. A `@respond('fetch-product')` handler (typically in a controller) catches it and returns data
3. `await (yield ...)` resolves with the response
4. The element updates its properties, triggering a re-render

## Controller-Side Responses

Controllers handle requests — this is where business logic, API calls, and data management belong:

```typescript
import { context, controller, respond, IController, type Context } from 'snice';

@controller('product-controller')
class ProductController implements IController {
  element: HTMLElement | null = null;
  private ctx!: Context;
  async attach() {}
  async detach() {}

  @context()
  receiveContext(ctx: Context) { this.ctx = ctx; }

  @respond('fetch-product')
  async handleFetchProduct(request: { id: string }) {
    const response = await this.ctx.fetch(`/api/products/${request.id}`);
    return await response.json();
  }
}
```

**Architecture:** Elements stay visual and yield requests upward. A controller
owns application behavior specific to the elements it controls; the page still
owns element orchestration.

## Request/Response Options

### Timeout Behavior

The timeout system has **two separate timeouts**:

- **Discovery timeout** (`discoveryTimeout`): 50ms default — finds a handler quickly
- **Response timeout** (`timeout`): 2 minutes default — total time for the response

```typescript
@request('heavy-computation', {
  discoveryTimeout: 50,   // 50ms to find handler
  timeout: 30000          // 30s for actual processing
})
async *compute(): Response<any> {
  return await (yield data);
}
```

### Debounce/Throttle

```typescript
// Debounce: wait for typing to stop before searching
@request('search', { debounce: 300 })
async *search(): Response<any[]> {
  return await (yield { query: this.searchTerm });
}

// Throttle: limit analytics to 1 per second
@request('track', { throttle: 1000 })
async *trackEvent(): Response<void> {
  await (yield { event: 'scroll', position: window.scrollY });
}
```

## Error Handling

### Element-Side

```typescript
@element('safe-loader')
class SafeLoader extends HTMLElement {
  @property() error = '';
  @property() data: any = null;

  @request('load-data', { timeout: 5000 })
  async *loadData(): Response<void> {
    try {
      this.data = await (yield { id: this.dataId });
      this.error = '';
    } catch (err: any) {
      if (err.message.includes('no handler found')) {
        this.error = 'Service unavailable';
      } else if (err.message.includes('timed out')) {
        this.error = 'Request timed out';
      } else {
        this.error = err.message;
      }
    }
  }

  @render()
  renderContent() {
    return html`
      <if ${this.error}>
        <div class="error">${this.error}</div>
      </if>
      <if ${this.data}>
        <div class="content">${this.data.title}</div>
      </if>
    `;
  }
}
```

### Controller-Side

```typescript
@controller('resilient-controller')
class ResilientController implements IController {
  element: HTMLElement | null = null;
  private ctx!: Context;
  async attach() {}
  async detach() {}

  @context()
  receiveContext(ctx: Context) { this.ctx = ctx; }

  @respond('load-data')
  async handleLoadData(request: { id: string }) {
    if (!request.id) {
      throw new Error('ID is required');
    }

    const response = await this.ctx.fetch(`/api/data/${request.id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }
}
```

## Advanced Patterns

### Cached Responses

```typescript
@controller('cached-controller')
class CachedController implements IController {
  element: HTMLElement | null = null;
  private ctx!: Context;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 minute

  async attach() {}
  async detach() {}

  @context()
  receiveContext(ctx: Context) { this.ctx = ctx; }

  @respond('fetch-cached')
  async handleFetch(request: { key: string; forceRefresh?: boolean }) {
    const cached = this.cache.get(request.key);
    if (!request.forceRefresh && cached && Date.now() - cached.timestamp < this.ttl) {
      return { data: cached.data, fromCache: true };
    }

    const data = await this.ctx.fetch(`/api/${request.key}`).then(r => r.json());
    this.cache.set(request.key, { data, timestamp: Date.now() });
    return { data, fromCache: false };
  }
}
```

### Subscription Pattern

Use `@request` for one-time fetches and `@dispatch` + `@on` for ongoing updates:

```typescript
// Element: visual, subscribes to updates
@element('live-ticker')
class LiveTicker extends HTMLElement {
  @property() price = '0.00';
  @property() symbol = 'BTC';

  @request('subscribe-ticker')
  async *subscribe(): Response<void> {
    await (yield { symbol: this.symbol });
  }

  @on('ticker-update')
  onUpdate(e: CustomEvent) {
    this.price = e.detail.price;
  }

  @render()
  renderContent() {
    return html`
      <span class="symbol">${this.symbol}</span>
      <span class="price">${this.price}</span>
    `;
  }
}

// Controller: manages WebSocket, dispatches updates
@controller('ticker-controller')
class TickerController implements IController {
  element: HTMLElement | null = null;
  private ws?: WebSocket;

  async attach() {}

  async detach() {
    this.ws?.close();
  }

  @respond('subscribe-ticker')
  async handleSubscribe(request: { symbol: string }) {
    this.ws = new WebSocket(`wss://api.example.com/ticker/${request.symbol}`);
    this.ws.onmessage = (msg) => {
      this.element?.dispatchEvent(new CustomEvent('ticker-update', {
        detail: JSON.parse(msg.data)
      }));
    };
    return { subscribed: true };
  }
}
```

## Using Without Decorators

For vanilla JS or React code that needs to respond to `@request` channels without using the decorator system.

### Vanilla JS: createRequestHandler

```javascript
import { createRequestHandler } from 'snice';

// Attach handlers to any DOM target (events bubble, so ancestors work)
const cleanup = createRequestHandler(document.getElementById('app'), {
  'fetch-user': async (payload) => {
    const res = await fetch(`/api/users/${payload.id}`);
    return res.json();
  },
  'save-settings': async (payload) => {
    await fetch('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
    return { ok: true };
  }
});

// Global handler (catches all bubbling requests)
const globalCleanup = createRequestHandler(document, {
  'fetch-user': async (payload) => ({ name: 'Jane', id: payload.id }),
});

// Remove all listeners when done
cleanup();
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `passive` | `boolean` | `false` | When true, doesn't stop event propagation (allows multiple handlers) |

### React: useRequestHandler

For full documentation, examples, options, and global handler patterns, see the **[React Integration guide](./react-integration.md#userequesthandler)**.

```tsx
import { useRequestHandler } from 'snice/react';

function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);

  useRequestHandler(ref, {
    'fetch-user': async (payload) => {
      const res = await fetch(`/api/users/${payload.id}`);
      return res.json();
    },
  });

  return (
    <div ref={ref}>
      <snice-user-card />
    </div>
  );
}
```

Route callbacks are ref-stable — no `useCallback` needed. Listeners re-attach only when channel names change. Cleanup is automatic on unmount.
