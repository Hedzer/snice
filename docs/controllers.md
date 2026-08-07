<!-- AI: For the AI-optimized version of this doc, see docs/ai/api.md -->
# Controllers API Documentation

Controllers hold application behavior specific to a set of elements, including
their data fetching, business rules, and server communication. They can be
attached to any HTML element, including native elements.

Visual behavior belongs in elements, application behavior specific to a set of
elements belongs in a controller, and element orchestration belongs in pages.
Do not attach a controller to the page host. A host-free reusable function may
stay a plain module wherever the project keeps it. URL/query parsing belongs in
`@page({ routes })`, not in a controller.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Controller Lifecycle](#controller-lifecycle)
- [Native Element Controllers](#native-element-controllers)
- [Resource Cleanup](#resource-cleanup)
- [Event Handling in Controllers](#event-handling-in-controllers)
- [Query Selectors in Controllers](#query-selectors-in-controllers)
- [Advanced Patterns](#advanced-patterns)
- [Accessing Controllers](#accessing-controllers)

## Basic Usage

### Creating a Controller

```typescript
import { controller, IController } from 'snice';

@controller('user-controller')
class UserController implements IController<HTMLElement> {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    // Called when controller is attached to an element
    console.log('Controller attached to', element);
  }

  async detach(element: HTMLElement) {
    // Called when controller is detached from an element
    console.log('Controller detached from', element);
  }
}
```

### Attaching Controllers

Bind the controller class directly in a template — this is the preferred way:

```typescript
import { UserController } from './controllers/user-controller';

html`<user-list controller=${UserController}></user-list>`

// Works on native elements inside templates too
html`<div controller=${UserController}></div>`
```

Class bindings skip the registry lookup: the imported class is attached as-is.
The `@controller('name')` decorator is still required — it registers the class,
marks it, and flushes pending attachments. Re-binding the same class reference
is a no-op; binding a different class (or `null`) detaches the old controller
first. While a class is bound, the class binding owns the element: `controller`
attribute writes cannot switch it until the class is unbound.

For inspection in DevTools, Snice reflects the decorator name as a
`controller="name"` attribute while the class is attached. This marker is
diagnostic only: it does not resolve the registry or create a second
attachment. Treat it as read-only; the class reference remains authoritative.
Snice removes the marker when the class detaches or replaces it when another
controller is bound.

An element hosts **at most one controller**. Attaching a different controller
always detaches the current one; this is an architectural 1:1 relationship,
not only a template rebinding detail. Put independent controller behaviors on
separate host elements (or intentionally compose them inside one controller).

Imperative equivalents:

```typescript
import { attachController } from 'snice';

await attachController(element, UserController); // any element
el.controller = UserController;                  // snice elements
```

### Attaching by Name (strings)

Every controller is also registered under its decorator name, and attaching by
string remains fully supported. It is the only channel available in raw HTML
markup, where attributes are all you have:

```html
<!-- Custom element -->
<user-list controller="user-controller"></user-list>

<!-- Native element (works automatically) -->
<div controller="user-controller"></div>
```

Strings also work in template bindings — `controller=${'user-controller'}` and
interpolated forms like `controller="user-${kind}"` behave exactly like the
static attribute.

### IController Interface

```typescript
interface IController<T extends HTMLElement = HTMLElement> {
  element: T | null | undefined;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}
```

## Controller Lifecycle

**One controller per element.** An element hosts at most ONE controller at a
time — binding a different class or `null` detaches the current one first.
Combined with the rule that a page host may not carry a controller, this means
a resource with several endpoints cannot be split one-controller-per-endpoint
on a single host. The workable pattern: attach each mutation controller to its
own trigger element (a button, a form, a region) and let them share state
through the element's reactive properties or events.

### Attachment Flow

1. Controller instance is created
2. `element` property is set
3. Router application context is passed (if available)
4. Element's `ready` promise is awaited
5. `attach()` method is called
6. `@context` handlers are registered and caught up with the current Router context
7. Observers are set up
8. Channel/response handlers are set up
9. Event handlers are set up
10. `controller-attached` event is dispatched

The step-4 wait has one safe exception: when an element calls
`await attachController(this, ControllerClass)` from its own `@ready` handler,
Snice attaches immediately. Initial rendering has already completed at that
point, and waiting for `ready` would otherwise create a self-deadlock because
`ready` cannot settle until the current handler returns. Attaching to any
other element still awaits that element's `ready` promise.
This runtime safeguard does not make attaching a controller to a routed page a
good architecture; pages should orchestrate directly.

### Detachment Flow

1. `detach()` method is called
2. `element` property is set to null
3. Observers are cleaned up
4. Channel/response handlers are cleaned up
5. Event handlers are cleaned up
6. `@context` handlers are cleaned up
7. Controller scope is cleaned up
8. `controller-detached` event is dispatched

### Example with Lifecycle Logging

```typescript
@controller('lifecycle-controller')
class LifecycleController implements IController {
  element: HTMLElement | null = null;
  private intervalId?: number;

  async attach(element: HTMLElement) {
    console.log('1. Controller attaching to', element.tagName);

    // Wait for any async initialization
    await this.initialize();

    // Set up recurring tasks
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 5000);

    console.log('2. Controller attached');
  }

  async detach(element: HTMLElement) {
    console.log('3. Controller detaching from', element.tagName);

    // Clean up resources
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Perform async cleanup
    await this.cleanup();

    console.log('4. Controller detached');
  }

  private async initialize() {
    // Async initialization logic
  }

  private async cleanup() {
    // Async cleanup logic
  }

  private updateData() {
    console.log('Updating data...');
  }
}
```

## Native Element Controllers

Native element controllers are enabled automatically when Snice loads in a browser environment. No setup is required.

You can attach controllers to any HTML element:

```html
<div controller="content-controller">
  <p>Content managed by controller</p>
</div>

<table controller="table-controller">
  <tbody></tbody>
</table>

<form controller="form-controller">
  <input type="text" name="username">
</form>
```

### Example: Table Controller

Controllers provide specific behaviors (data fetching, sorting, filtering) to generic visual components. The component handles rendering — the controller handles data:

```typescript
@controller('table-controller')
class TableController implements IController<HTMLTableElement> {
  element: HTMLTableElement | null = null;

  async attach(element: HTMLTableElement) {
    const data = await fetch('/api/data').then(r => r.json());

    // Pass data to the element — if it's a custom element, call its API
    if ('setData' in element && typeof (element as any).setData === 'function') {
      (element as any).setData(data);
    }
  }

  async detach() {}
}
```

## Resource Cleanup

The framework auto-cleans `@on`, `@observe`, `@respond`, and `@context` handlers. Clean up your own resources (WebSockets, timers, manual listeners) in `detach`:

```typescript
import { controller, IController } from 'snice';

@controller('resource-controller')
class ResourceController implements IController {
  element: HTMLElement | null = null;
  private websocket?: WebSocket;
  private eventHandler?: (e: MessageEvent) => void;

  async attach(element: HTMLElement) {
    // Open websocket
    this.websocket = new WebSocket('ws://localhost:8080');

    // Set up event listener
    this.eventHandler = (e: MessageEvent) => this.handleMessage(e);
    this.websocket.addEventListener('message', this.eventHandler);
  }

  async detach(element: HTMLElement) {
    // Clean up resources
    if (this.websocket) {
      if (this.eventHandler) {
        this.websocket.removeEventListener('message', this.eventHandler);
      }
      this.websocket.close();
      this.websocket = undefined;
    }
    this.eventHandler = undefined;
  }

  private handleMessage(event: MessageEvent) {
    console.log('Received:', event.data);
  }
}
```

## Event Handling in Controllers

Controllers can use the `@on` decorator to handle events from their attached element:

```typescript
import { controller, on, IController } from 'snice';

@controller('form-controller')
class FormController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;

  async attach(element: HTMLFormElement) {
    console.log('Form controller attached');
  }

  async detach(element: HTMLFormElement) {
    console.log('Form controller detached');
  }

  @on('submit')
  handleSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted');
    this.processForm();
  }

  @on('input', 'input[type="text"]')
  handleTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Text input changed:', input.value);
  }

  @on('change', 'select')
  handleSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    console.log('Select changed:', select.value);
  }

  private processForm() {
    if (!this.element) return;

    const formData = new FormData(this.element);
    console.log('Processing form data:', Object.fromEntries(formData));
  }
}
```

## Query Selectors in Controllers

Controllers can use `@query` and `@queryAll` to access elements. **Important:** By default, `@query` searches the shadow DOM. When attached to native elements (no shadow root), use `{ light: true }`:

```typescript
import { controller, query, queryAll, IController } from 'snice';

@controller('form-validation-controller')
class FormValidationController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;

  // light: true is required — native elements have no shadow root
  @query('.error-message', { light: true })
  errorEl?: HTMLElement;

  @queryAll('input[required]', { light: true })
  requiredInputs?: NodeListOf<HTMLInputElement>;

  async attach() {}
  async detach() {}

  @on('submit')
  handleSubmit(event: Event) {
    const invalid = Array.from(this.requiredInputs || []).filter(i => !i.value.trim());

    if (invalid.length > 0) {
      event.preventDefault();
      invalid[0].focus();
      if (this.errorEl) {
        this.errorEl.textContent = `${invalid.length} required field(s) missing`;
      }
    }
  }
}
```

## Advanced Patterns

### Data Fetching Controller

A data-fetching controller is appropriate when the fetch is application behavior
specific to the elements it controls. Pass state through the element's public
API and dispatch outcome events — do not manipulate its rendered DOM. A
production controller should also prevent an older response from overwriting a
newer one:

```typescript
import { context, type Context } from 'snice';

interface Order { id: string; total: number }

interface OrdersView extends HTMLElement {
  loading: boolean;
  error: string;
  empty: boolean;
  orders: Order[];
}

@controller('orders-data')
export class OrdersDataController implements IController<OrdersView> {
  element: OrdersView | null = null;
  private ctx?: Context;
  private abortController?: AbortController;
  private requestVersion = 0;
  private receivedFirstContext = false;

  attach(element: OrdersView) {
    this.element = element;
  }

  // @context() fires on EVERY context update, not once — gate one-shot work
  // on the first delivery after attach(). Use `{ once: true }` instead when
  // the handler itself must never run twice.
  @context()
  receiveContext(ctx: Context) {
    this.ctx = ctx;
    if (this.receivedFirstContext) return;
    this.receivedFirstContext = true;
    void this.reload();
  }

  async detach() {
    // Invalidates even a fetch implementation that ignores AbortSignal.
    this.requestVersion++;
    this.abortController?.abort();
    this.abortController = undefined;
    this.ctx = undefined;
    this.receivedFirstContext = false;
  }

  async reload() {
    const host = this.element;
    if (!host) return;

    const version = ++this.requestVersion;
    this.abortController?.abort();
    const abortController = new AbortController();
    this.abortController = abortController;

    host.loading = true;
    host.error = '';
    host.empty = false;

    try {
      const ctx = this.ctx;
      if (!ctx) throw new Error('OrdersDataController requires Router context');
      const response = await ctx.fetch('/api/orders', {
        signal: abortController.signal
      });
      if (!response.ok) throw new Error(`Orders request failed (${response.status})`);
      const orders = await response.json() as Order[];

      // Abort is not enough: adapters/mocks may resolve after cancellation.
      if (version !== this.requestVersion || this.element !== host) return;

      host.orders = orders;
      host.empty = orders.length === 0;
      host.dispatchEvent(new CustomEvent('data-loaded', {
        detail: { orders, empty: host.empty },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      if (abortController.signal.aborted) return;
      if (version !== this.requestVersion || this.element !== host) return;

      const message = error instanceof Error ? error.message : String(error);
      host.orders = [];
      host.empty = true;
      host.error = message;
      host.dispatchEvent(new CustomEvent('data-error', {
        detail: { message, error },
        bubbles: true,
        composed: true
      }));
    } finally {
      if (version === this.requestVersion && this.element === host) {
        host.loading = false;
      }
    }
  }
}
```

`@context()` works on controllers as well as elements. It receives the same
long-lived `Context` instance, including `application`, navigation state, and
the Router's middleware-aware `fetch`. Managed decorators are activated after
`attach()`, so start context-dependent work in the `@context()` handler (or in
an event handled later), not in `attach()`.

`@context()` is a subscription, not a one-shot: the handler fires on **every**
context update for as long as the controller is attached. The initial "caught
up" delivery is only the first one. Guard first delivery (as the example
does), pass `{ once: true }`, or diff the update — but never start unguarded
work in the handler body.

### Observing a host property

A controller has no host-property watcher: `@observe` covers
Intersection/Resize/Media/Mutation only, and `attachController` installs none.
The working pattern is for the owning element to announce the change with
`@dispatch` and the controller to listen with a plain `@on` (direct handlers
already listen on the host element):

```typescript
// On the element:
@dispatch('page-filter', { bubbles: true, composed: true })
private emitFilter() {
  return { filter: this.filter };
}

// On the controller:
@on('page-filter')
handleFilter(event: CustomEvent) {
  void this.reload(event.detail.filter);
}
```

Carry every synchronously-written value in the event `detail`. A `.prop`
binding commits a microtask later, so reading `this.element.filter` inside the
handler would read the PREVIOUS value.

The element owns presentation for every state:

```typescript
@element('orders-view')
class OrdersViewElement extends HTMLElement implements OrdersView {
  @property({ attribute: false }) orders: Order[] = [];
  @state() loading = false;
  @state() error = '';
  @state() empty = false;

  @render()
  template() {
    if (this.loading) return html`<snice-spinner label="Loading orders"></snice-spinner>`;
    if (this.error) return html`<snice-alert variant="error">${this.error}</snice-alert>`;
    if (this.empty) return html`<snice-empty-state heading="No orders"></snice-empty-state>`;
    return html`${this.orders.map(order => html`
      <order-row key=${order.id} .order=${order}></order-row>
    `)}`;
  }
}
```

This separates responsibilities cleanly: the controller owns transport,
cancellation, stale-response protection, and outcome events; the element owns
loading/error/empty/data rendering. A retry button can request `reload()` via a
small event handled by the controller, or application code can retrieve the
controller and call its public method.

### Theme Controller

```typescript
@controller('theme-controller')
class ThemeController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    const saved = localStorage.getItem('theme') || 'light';
    element.setAttribute('data-theme', saved);
  }

  async detach(element: HTMLElement) {}

  @on('click', '[data-set-theme]')
  handleThemeToggle(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const theme = target.dataset.setTheme!;
    this.element?.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}
```

### WebSocket Controller

```typescript
@controller('ws-controller')
class WebSocketController implements IController {
  element: HTMLElement | null = null;
  private ws?: WebSocket;
  private reconnectTimer?: number;

  async attach(element: HTMLElement) {
    this.connect();
  }

  async detach(element: HTMLElement) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  private connect() {
    this.ws = new WebSocket('wss://api.example.com/ws');

    this.ws.onmessage = (event) => {
      this.element?.dispatchEvent(new CustomEvent('ws-message', {
        detail: JSON.parse(event.data),
        bubbles: true
      }));
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
```

## Accessing Controllers

### Via Event

Listen for attachment on the element itself (the event does **not** bubble):

```typescript
element.addEventListener('controller-attached', (e: CustomEvent) => {
  console.log('Name:', e.detail.name);           // registry name, or the class name for class attaches
  console.log('Instance:', e.detail.controller);  // IController instance
});
```

### Auto-Cleanup

The framework automatically cleans up `@on` handlers, observers, and `@respond` handlers during detach. Manual cleanup in `detach()` is only needed for resources you manage yourself (WebSockets, intervals, manual event listeners).
