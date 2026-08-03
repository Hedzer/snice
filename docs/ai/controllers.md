# Controllers

Mirrors `docs/controllers.md`.

Controllers hold application behavior specific to a set of elements, including
their data fetching, business rules, and server communication. Attach to any
HTML element, including native elements.

Visual behavior belongs in elements, application behavior specific to a set of
elements belongs in a controller, and element orchestration belongs in pages.
Do not attach a controller to the page host. A host-free reusable function may
stay a plain module wherever the project keeps it. URL/query parsing belongs in
`@page({ routes })`, not in a controller.

## Basic Usage

```typescript
import { controller, IController } from 'snice';

@controller('user-controller')
class UserController implements IController<HTMLElement> {
  element: HTMLElement | null = null;
  async attach(element: HTMLElement) { /* called on attach */ }
  async detach(element: HTMLElement) { /* called on detach */ }
}
```

### IController Interface

```typescript
interface IController<T extends HTMLElement = HTMLElement> {
  element: T | null | undefined;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}
```

### Attaching — class binding (preferred)

```typescript
import { UserController } from './controllers/user-controller';

html`<user-list controller=${UserController}></user-list>`
html`<div controller=${UserController}></div>`  // native elements work too
```

- Class bindings skip registry lookup — the imported class attaches as-is.
- `@controller('name')` decorator is still required: registers the class, marks it, flushes pending attachments.
- Re-binding the same class reference is a no-op.
- Binding a different class (or `null`) detaches the old controller first.
- While a class is bound, its decorator name is reflected as `controller="name"` for DOM inspection. This is a read-only diagnostic marker, not a registry attachment; the class reference owns the element until unbound.
- Hard constraint: one element hosts at most one controller. A second controller replaces the first. Use separate host elements for independent behaviors, or deliberately compose them in one controller.

Imperative equivalents:

```typescript
import { attachController } from 'snice';

await attachController(element, UserController); // any element
el.controller = UserController;                  // snice elements
```

### Attaching by name (string) — only channel in raw HTML

```html
<user-list controller="user-controller"></user-list>
<div controller="user-controller"></div>  <!-- native element, works automatically -->
```

- Every controller is registered under its decorator name; string attach fully supported.
- Template string bindings behave exactly like the static attribute: `controller=${'user-controller'}`, interpolated `controller="user-${kind}"`.

## Controller Lifecycle

**Attachment flow:**
1. Controller instance created
2. `element` property set
3. Router context passed (if available)
4. Element's `ready` promise awaited
5. `attach()` called
6. Observers set up
7. Channel/response handlers set up
8. Event handlers set up
9. `controller-attached` event dispatched

Exception to step 4: `await attachController(this, ControllerClass)` inside the
host's own `@ready` handler attaches immediately because initial render is
already complete. Awaiting that same host's `ready` would self-deadlock. An
attachment targeting any other element still waits for the target's `ready`.
This runtime safeguard does not make attaching a controller to a routed page a
good architecture; pages should orchestrate directly.

**Detachment flow:**
1. `detach()` called
2. `element` property set to null
3. Observers cleaned up
4. Channel/response handlers cleaned up
5. Event handlers cleaned up
6. Controller scope cleaned up
7. `controller-detached` event dispatched

## Native Element Controllers

Enabled automatically when Snice loads in a browser — no setup required.

```html
<div controller="content-controller"><p>Content managed by controller</p></div>
<table controller="table-controller"><tbody></tbody></table>
<form controller="form-controller"><input type="text" name="username"></form>
```

Controllers provide specific behaviors (fetch/sort/filter) to generic visual components — component renders, controller handles data. Pass data via the element's public API (e.g. call `setData()` if present) rather than reaching into internals.

## Resource Cleanup

Framework auto-cleans `@on`, `@observe`, `@respond` handlers. Clean up your own resources (WebSockets, timers, manual listeners) in `detach`:

```typescript
@controller('resource-controller')
class ResourceController implements IController {
  element: HTMLElement | null = null;
  private websocket?: WebSocket;
  private eventHandler?: (e: MessageEvent) => void;

  async attach(element: HTMLElement) {
    this.websocket = new WebSocket('ws://localhost:8080');
    this.eventHandler = (e) => this.handleMessage(e);
    this.websocket.addEventListener('message', this.eventHandler);
  }

  async detach(element: HTMLElement) {
    if (this.websocket) {
      if (this.eventHandler) this.websocket.removeEventListener('message', this.eventHandler);
      this.websocket.close();
      this.websocket = undefined;
    }
    this.eventHandler = undefined;
  }

  private handleMessage(event: MessageEvent) {}
}
```

## Event Handling in Controllers

`@on` works in controllers same as elements, targeting the attached element:

```typescript
@controller('form-controller')
class FormController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;
  async attach() {}
  async detach() {}

  @on('submit')
  handleSubmit(event: Event) { event.preventDefault(); }

  @on('input', 'input[type="text"]')
  handleTextInput(event: Event) {}

  @on('change', 'select')
  handleSelectChange(event: Event) {}
}
```

## Query Selectors in Controllers

`@query`/`@queryAll` default to shadow DOM. **Native elements have no shadow root — use `{ light: true }`:**

```typescript
@controller('form-validation-controller')
class FormValidationController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;

  @query('.error-message', { light: true })
  errorEl?: HTMLElement;

  @queryAll('input[required]', { light: true })
  requiredInputs?: NodeListOf<HTMLInputElement>;

  async attach() {}
  async detach() {}
}
```

## Advanced Patterns

### Canonical data-fetching controller

Own transport and races in the controller; expose loading/error/empty/data via
the element's reactive public API. Dispatch outcome events, never mutate the
element's rendered DOM.

```typescript
interface DataHost<T> extends HTMLElement {
  loading: boolean;
  error: string;
  empty: boolean;
  data: T[];
}

@controller('data-controller')
class DataController<T> implements IController<DataHost<T>> {
  element: DataHost<T> | null = null;
  private abort?: AbortController;
  private version = 0;

  async attach(element: DataHost<T>) {
    this.element = element;
    await this.reload();
  }

  async detach() {
    this.version++;
    this.abort?.abort();
  }

  async reload() {
    const host = this.element;
    if (!host) return;
    const version = ++this.version;
    this.abort?.abort();
    const abort = this.abort = new AbortController();
    host.loading = true;
    host.error = '';
    host.empty = false;

    try {
      const response = await fetch('/api/data', { signal: abort.signal });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json() as T[];
      if (version !== this.version || this.element !== host) return;
      host.data = data;
      host.empty = data.length === 0;
      host.dispatchEvent(new CustomEvent('data-loaded', {
        detail: { data, empty: host.empty }, bubbles: true, composed: true
      }));
    } catch (error) {
      if (abort.signal.aborted || version !== this.version || this.element !== host) return;
      const message = error instanceof Error ? error.message : String(error);
      host.data = [];
      host.empty = true;
      host.error = message;
      host.dispatchEvent(new CustomEvent('data-error', {
        detail: { message, error }, bubbles: true, composed: true
      }));
    } finally {
      if (version === this.version && this.element === host) host.loading = false;
    }
  }
}
```

Required pieces: abort previous work, increment a version for stale-response
guarding, reset loading/error/empty before fetch, check version + host identity
before every commit, expose retry as `reload()`, and render all four states in
the element.

- **Theme controller** — read/write `localStorage`, toggle `data-theme` attribute on the element via `@on('click', '[data-set-theme]')`.
- **WebSocket controller** — open connection in `attach()`, reconnect on close with a timer, dispatch `CustomEvent`s on message, close + clear timers in `detach()`. Controllers may expose additional public methods (e.g. `send(data)`) beyond `attach`/`detach`.

## Accessing Controllers

### Via event

Listen on the element itself — the event does **not** bubble:

```typescript
element.addEventListener('controller-attached', (e: CustomEvent) => {
  console.log('Name:', e.detail.name);           // registry name, or class name for class attaches
  console.log('Instance:', e.detail.controller);  // IController instance
});
```

### Auto-cleanup

Framework auto-cleans `@on` handlers, observers, `@respond` handlers on detach. Manual cleanup in `detach()` only needed for resources you manage yourself (WebSockets, intervals, manual listeners).
