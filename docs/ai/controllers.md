# Controllers

Mirrors `docs/controllers.md`.

Controllers handle data fetching, business logic, and server communication separately from visual components. Attach to any HTML element, including native elements.

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

- **Data fetching controller** — own `fetch()`/polling/`AbortController`; pass results to the element by dispatching bubbling `CustomEvent`s (e.g. `data-loaded`, `data-error`) rather than manipulating DOM directly.
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
