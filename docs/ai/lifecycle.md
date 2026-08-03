# Lifecycle

Human reference: `docs/lifecycle.md`

Connection, readiness, teardown, and reacting to change.

## @ready()

Called after styles are applied and event handlers are set up. Initial render may still be completing in a microtask — use `@query` (re-queries each access) for safe DOM access.

```typescript
@element('auto-resize-textarea')
class AutoResizeTextarea extends HTMLElement {
  @query('textarea') textarea?: HTMLTextAreaElement;

  @ready()
  adjustHeight() {
    if (this.textarea) this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  @render()
  renderContent() {
    return html`<textarea @input=${this.adjustHeight}></textarea>`;
  }
}
```

## @reconnect()

Fires every connect AFTER the first. `@ready` fires once; `@dispose` fires every disconnect.

- Framework-managed handlers (`@on`, `@observe`, `@respond`, `@context`) re-establish automatically on reconnect — no action needed for those.
- Use only when the component wires its own long-lived global subscription in `@ready` (e.g. `document.addEventListener` for outside-click) and tears it down in `@dispose` — re-wire the same subscription in `@reconnect`.

```typescript
@element('outside-click-listener')
class OutsideClick extends HTMLElement {
  private handler = () => { /* ... */ };

  @ready() init() { document.addEventListener('click', this.handler); }
  @reconnect() onReconnect() { document.addEventListener('click', this.handler); }
  @dispose() cleanup() { document.removeEventListener('click', this.handler); }
}
```

## @dispose()

Called when the element is removed from the DOM.

```typescript
@element('animated-element')
class AnimatedElement extends HTMLElement {
  private rafId?: number;

  @ready()
  startAnimation() {
    const animate = () => { this.rafId = requestAnimationFrame(animate); };
    this.rafId = requestAnimationFrame(animate);
  }

  @dispose()
  stopAnimation() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
```

## ready Promise

Every element has a `ready` promise that resolves when fully initialized:

```typescript
const el = document.createElement('my-element') as MyElement;
document.body.appendChild(el);
await (el as any).ready; // Wait for element to be ready
```

- A thrown/rejected `@ready()` handler is logged and rejects `ready` with the first failure.
- Await `ready` in tests/setup to surface half-initialized elements.

## @watch()

Reacts to property changes. Handler signature: `(oldValue, newValue, propertyName)`.

```typescript
@property() userName = '';
@property({ type: Number }) score = 0;

@watch('userName')
onUserNameChange(oldVal: string, newVal: string, prop: string) {}

@watch('score')
onScoreChange(oldVal: number, newVal: number) {}

// Wildcard watcher — fires on any @property change
@watch('*')
onAnyChange(oldVal: any, newVal: any, prop: string) {}
```

**Initial values.** By default a watcher fires once during initialization with the element's starting value — from markup (`<reactive-component user-name="Ada">`) or the field default — with `oldValue` undefined, then again on every later change:

```typescript
@watch('userName')
onUserNameChange(oldVal: string | undefined, newVal: string) {
  // Init:   (undefined, 'Ada')
  // Change: ('Ada', 'Grace')
}
```

Pass `{ immediate: false }` as the last argument for a change-only watcher — one that must not run on mount, such as a watcher that dispatches an event:

```typescript
@watch('value', { immediate: false })
onValueChange(oldVal: string, newVal: string) {
  this.dispatchChange();   // only on real changes, never on mount
}
```

Options object always comes after the property names — works with multiple watched properties too: `@watch('width', 'height', { immediate: false })`.

## @context()

Receives router context updates. Called whenever the router context changes (navigation, app context update, etc.):

```typescript
@property({ type: Array }) placards: Placard[] = [];
@property() currentRoute = '';

@context()
onContextUpdate(ctx: Context) {
  this.placards = ctx.navigation.placards;
  this.currentRoute = ctx.navigation.route;
}
```

**Context Options:**

```typescript
@context({ debounce: 300 })   // Wait 300ms after last change
@context({ throttle: 500 })   // At most once per 500ms
@context({ once: true })      // Only called once, then auto-unregisters
```

**Context object:**
- `ctx.application` — App context (theme, auth, config, etc.)
- `ctx.navigation.route` — Current route path
- `ctx.navigation.params` — Route parameters
- `ctx.navigation.placards` — All registered page placards
- `ctx.fetch` — Fetch with middleware support (see Fetcher docs)
