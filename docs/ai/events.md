# Events

Human reference: `docs/events.md`

Two approaches: template event syntax (`@event=${handler}`, preferred for elements) and the `@on` decorator (works in **both elements AND controllers** — delegation, keyboard modifiers, debounce/throttle). `@dispatch` auto-dispatches custom events after method execution.

## Template event syntax

Basic:

```typescript
html`
  <button @click=${this.increment}>Increment</button>
  <button @click=${this.decrement}>Decrement</button>
`
increment() { this.count++; }
```

Handler receives the native event; access `event.target`, call `event.preventDefault()`:

```typescript
handleSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
}
handleInput(event: Event) {
  const input = event.target as HTMLInputElement;
}
```

Multiple event types on one element:

```typescript
html`<div
  class="dropzone ${this.dragOver ? 'drag-over' : ''}"
  @dragenter=${this.handleDragEnter}
  @dragover=${this.handleDragOver}
  @dragleave=${this.handleDragLeave}
  @drop=${this.handleDrop}
>Drop files here</div>`

handleDrop(e: DragEvent) {
  e.preventDefault();
  const files = Array.from(e.dataTransfer?.files || []);
}
```

Arrow functions — inline handling or passing parameters:

```typescript
html`
  <input type="checkbox" ?checked=${task.completed} @change=${(e: Event) => this.toggleTask(task.id, e)}>
  <button @click=${() => this.deleteTask(task.id)}>Delete</button>
`
```

### Keyboard shortcuts (template)

Dot or colon notation after `keydown` / `keyup` / `keypress`:

- `@keydown.enter` — plain Enter (no modifiers)
- `@keydown.ctrl+s` — Ctrl+S combination
- `@keydown.ctrl+shift+s` — multiple modifiers
- `@keydown.~enter` — Enter with any modifiers (leading `~` = ignore modifier state)
- `@keydown.escape`, `@keydown.down`, etc. — named keys

```typescript
html`
  <input @keydown.enter=${this.handleEnter}>
  <input @keydown.ctrl+s=${this.handleSave}>
  <input @keydown.escape=${this.handleCancel}>
  <input @keydown.~enter=${this.handleAnyEnter}>
`
```

### Template event modifiers

Append DOM listener / propagation behavior with `|`:

```typescript
html`
  <form @submit|prevent=${this.submit}></form>
  <button @click|once|stop=${this.runOnce}>Run once</button>
  <section @click|self=${this.selectSection}>...</section>
  <input @keydown.ctrl+s|prevent=${this.save}>
  <div @pointermove|capture|passive=${this.track}></div>
`
```

- `prevent` — calls `preventDefault()` (alias: `preventDefault`)
- `stop` — calls `stopPropagation()` (alias: `stopPropagation`)
- `immediate` — calls `stopImmediatePropagation()` (alias: `stopImmediatePropagation`)
- `once`, `capture`, `passive` — configure DOM listener behavior
- `self` — handler runs only when `event.target` is the bound element
- `passive` + `prevent` together are contradictory → render error
- Modifiers compose with dot/colon keyboard filters. Exact keyboard combinations reject extra modifiers; prefix the key filter with `~` to accept any modifier combination.
- Handlers may be `EventListenerObject` values — `handleEvent()` receives the object as `this`; `capture`, `once`, `passive` fields honored. Function handlers receive the component that owns the render tree as `this`.

## @on decorator

Works in **both elements AND controllers**. Use it for:

- Event delegation with CSS selectors
- Keyboard modifier matching (`Enter`, `ctrl+s`, etc.)
- Debounce or throttle
- Multiple events on one handler — accepts `string[]`: `@on(['mouseenter', 'focus'])`
- Automatic `preventDefault` or `stopPropagation`

Basic controller usage:

```typescript
@controller('button-controller')
class ButtonController implements IController {
  element: HTMLElement | null = null;
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('click') handleClick(event: MouseEvent) {}
  @on('mouseenter') handleMouseEnter(event: MouseEvent) {}
  @on('mouseleave') handleMouseLeave(event: MouseEvent) {}
}
```

Event delegation with selector — one listener handles many descendants:

```typescript
@on('click', '.list-item')
handleItemClick(event: MouseEvent) {
  const item = event.target as HTMLElement;
}

@on('click', '.delete-button')
handleDeleteClick(event: MouseEvent) {
  event.stopPropagation();
  const item = (event.target as HTMLElement).closest('.list-item');
  item?.remove();
}

@on('input', 'input[type="text"]')
handleTextInput(event: Event) {}
```

- `currentTarget` is the listener's HOST, not the matched element — derive the match with `event.target.closest(selector)`.
- Shadow retargeting: an event crossing a shadow boundary retargets to the shadow host, so a selector stops matching when rows move into a child component. Listen on the container; carry identity in `detail`.

Keyboard events with `@on` (`:` notation):

```typescript
@on('keydown:Enter', 'textarea')
handleEnter(event: KeyboardEvent) {}

@on('keydown:Ctrl+S')
handleSave(event: KeyboardEvent) { event.preventDefault(); }

@on('keydown:Escape')
handleEscape(event: KeyboardEvent) {}
```

`@on` also works in elements (alternative to template syntax; prefer template syntax for new element code):

```typescript
@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() { return html`<button class="btn">Click me</button>`; }

  @on('click', '.btn') handleClick(event: MouseEvent) {}
  @on('input', 'input', { debounce: 300 }) handleInput(event: Event) {}
}
```

### OnOptions

```typescript
interface OnOptions {
  // Standard event listener options
  capture?: boolean;           // Use capture phase instead of bubble phase
  once?: boolean;              // Remove listener after first trigger
  passive?: boolean;           // Passive listener (can't preventDefault)

  // Automatic event handling
  preventDefault?: boolean;    // Automatically call preventDefault on the event
  stopPropagation?: boolean;   // Automatically call stopPropagation on the event

  // Timing controls
  debounce?: EventTiming;
  throttle?: EventTiming;

  // Shadow DOM delegation
  target?: string;             // CSS selector to target specific elements within shadow root

  // Where to attach the listener (see scope below)
  scope?: 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null);
}
type EventTiming = number | ((this: any) => number);
```

- Number intervals remain supported.
- Resolver: called with the decorated element/controller as `this` when the
  listener is set up (and set up again after reconnect).
- Result must be finite and non-negative. `0` disables; invalid/negative/`NaN`
  throws `TypeError`.
- Use method/function syntax, not an arrow, to read `this`.

### scope — listener attachment target

Default: host element. `scope` redirects attachment to another target — how Snice expresses cross-cutting events.

| `scope` value | Listener attaches to |
|---|---|
| omitted | host element (default) |
| `'global'` | `document` |
| selector string | `host.closest(selector)` — nearest matching ancestor |
| `Element` / `EventTarget` | that node directly |
| `(this) => EventTarget \| null` | called at connect; `null` skips |

```typescript
// Cross-cutting global event (document)
@on('bus:save', { scope: 'global' })
onSave(e: CustomEvent) {}

// Scoped to nearest ancestor matching the selector
@on('bus:cart-added', { scope: 'cart-shell' })
onCartAdded(e: CustomEvent) {}

// Explicit EventTarget
@on('go', { scope: someElement })
onGo() {}

// Resolver — full control, re-runs on reconnect
@on('beep', { scope() { return this.closest('app-shell'); } })
onBeep() {}
```

- Resolver function called with the host element as `this`; re-resolves each time the component reconnects (listener follows the host when it moves).
- If `scope` cannot resolve (selector matches no ancestor, resolver returns `null` or throws), the listener is **not attached** and `console.warn` is emitted. Component still mounts; only the listener is skipped.
- Disconnect removes the listener from whichever target it was attached to. Reconnect re-resolves and re-attaches.
- `scope` is compatible with the delegation selector — listener attaches on the scoped target and still matches the selector when an event fires within it.

### Throttling / debouncing

```typescript
// Throttle scroll events to max once per 100ms
@on('scroll', null, { throttle: 100 })
handleScroll(event: Event) {}

// Debounce input events by 300ms
@on('input', 'input[type="search"]', { debounce: 300 })
handleSearch(event: Event) {}

@on('input', 'input[type="search"]', {
  debounce() { return this.searchDebounce; }
})
handleAdaptiveSearch(event: Event) {}
```

## @dispatch decorator

Auto-dispatches a custom event after method execution; detail = the method's return value.

```typescript
@dispatch('value-changed')
setValue(newValue: string) {
  this.value = newValue;
  return { value: newValue }; // Event detail
}
```

```typescript
const input = document.querySelector('value-input');
input.addEventListener('value-changed', (e: CustomEvent) => e.detail.value);
```

### Event options

Events dispatched by `@dispatch` default to `bubbles: true` and `composed: true` (crosses shadow DOM boundaries). Override via `EventInit` fields in options:

```typescript
// Defaults: bubbles: true, composed: true
@dispatch('status-changed')
updateStatus(status: string) {
  return { status, timestamp: Date.now() };
}
```

### DispatchOptions

```typescript
interface DispatchOptions extends EventInit {
  dispatchOnUndefined?: boolean; // Undefined return still dispatches unless false (default: true)
  debounce?: EventTiming;
  throttle?: EventTiming;
  // Where to dispatch the event (see scope below)
  scope?: 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null);
}
```

`EventTiming = number | ((this: any) => number)`. A resolver runs against the
decorated element/controller on every method invocation. Result validation is
the same as `@on`. Async methods dispatch only after resolution; teardown drops
queued dispatches and unresolved async dispatch work.

### scope — dispatch target

Default: `this.dispatchEvent(event)` — event originates from the host element. `scope` redirects the dispatch to another target so the event behaves as if it originated there. Use with `@on({ scope })` to express cross-cutting events without bubbling.

| `scope` value | Event dispatched on |
|---|---|
| omitted | host element (default) |
| `'global'` | `document` |
| selector string | `host.closest(selector)` — nearest matching ancestor |
| `Element` / `EventTarget` | that node directly |
| `(this) => EventTarget \| null` | called per dispatch; `null` skips |

```typescript
// Global cart-add bus
@element('add-to-cart-button')
class AddToCartButton extends HTMLElement {
  @on('click', 'button')
  click() { this.add(this.productId); }

  @dispatch('bus:cart-added', { scope: 'global' })
  add(id: string) { return { id }; }
}

// Listener on any other element
@element('cart-counter')
class CartCounter extends HTMLElement {
  @on('bus:cart-added', { scope: 'global' })
  bump() { this.count++; }
}
```

If `scope` cannot resolve (selector matches no ancestor, resolver returns `null`), the event is **not dispatched** and `console.warn` is emitted. The method's return value still flows through `dispatchOnUndefined` / `debounce` / `throttle` semantics before the scope check.

### Debounce/throttle

```typescript
@dispatch('search-query', { debounce: 300 })
emitSearch(query: string) { return { query }; }

@dispatch('search-query', { debounce() { return this.searchDebounce; } })
emitAdaptiveSearch(query: string) { return { query }; }
```

### Async methods

`@dispatch` works with async methods — the event dispatches after the promise resolves:

```typescript
@dispatch('validation-complete')
async validate() {
  const result = await this.runValidation();
  return { valid: result.isValid, errors: result.errors };
}
```

### Multiple events per component

```typescript
@dispatch('color-preview')
changeColor(color: string) { this.color = color; return { color }; }

@dispatch('color-selected')
confirm() { return { color: this.color }; }
```

## Event bus

No bus object, no singleton. Bus = `@dispatch` publishing upward + `@on` subscribing at a chosen ancestor. Scope is a DOM node, so it lives and dies with the DOM.

Two publish paths — the choice decides who can hear it:
- **Bubble from host** — `@dispatch` defaults to `bubbles: true, composed: true`, so it crosses shadow boundaries and passes every ancestor up to `document`. For "this element did something".
- **Dispatch on a scope** — `@dispatch` takes the same `scope` option as `@on`, firing *on* that target instead of bubbling. For subscribers that are not ancestors (sibling subtree, or a detached host).

```typescript
@dispatch('bus:cart-added')                     // bubbles from host
@dispatch('bus:cart-added', { scope: 'global' })  // dispatched on document

@on('bus:cart-added', { scope: 'global' })      // document — app-wide
@on('bus:cart-added', { scope: 'cart-shell' })  // nearest <cart-shell> — per-instance
```

Match the halves: a bubbling publish only reaches subscribers on the host's ancestor chain. Sibling subtree → scope the dispatch too, so both meet on the same node. See [scope on @dispatch](#scope-dispatch-target).

Scope choice:
- `'global'` — genuinely app-wide (auth expiry, theme change, save shortcut)
- selector string — feature subtree; a second shell elsewhere keeps its own traffic
- `EventTarget` / resolver — you hold the node, or it moves and must re-resolve

Prefer the narrowest scope that works; `'global'` means every instance hears every message.

`bus:` is a naming convention, not a framework feature. Teardown is automatic — removed on disconnect from the resolved target, re-resolved on reconnect. Unresolvable selector → listener skipped + `console.warn`, never bound to the wrong node. Full table: [scope](#scope-listener-attachment-target).

Need a reply rather than a broadcast → [@request / @respond](./request-response.md).

For stateful objects explicitly supplied by an application context, use
`{ daemon: 'name' }`. Both halves must target the same daemon address; daemon
methods themselves default to their own private target. See
[daemons](./daemons.md). Daemon targets are not DOM scopes: `scope` and
`daemon` cannot be combined, and selector delegation is unavailable.

## Custom events

Prefer `@dispatch` for a static custom event emitted from a Snice element or a
controller's host. It supplies the standard bubbling/composed behavior, uses
the method return value as `detail`, and keeps event timing options declarative.

Manual dispatch remains a valid low-level escape hatch when code needs the
Event object, a dynamic event name, `dispatchEvent()`'s cancellation boolean,
or a non-host target:

```typescript
notify() {
  this.dispatchEvent(new CustomEvent('notification', {
    detail: { message: 'Hello!', level: 'info' },
    bubbles: true,
    composed: true
  }));
}
```

Listening (template syntax):

```typescript
html`<manual-dispatcher @notification=${this.handleNotification}></manual-dispatcher>`

handleNotification(e: CustomEvent) {
  console.log('Received notification:', e.detail);
}
```

## Event delegation

Controller — a single listener handles many descendants:

```typescript
@controller('table-controller')
class TableController implements IController {
  element: HTMLElement | null = null;
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Single event listener handles all rows
  @on('click', 'tr')
  handleRowClick(event: MouseEvent) {
    const row = (event.target as HTMLElement).closest('tr');
  }

  @on('click', 'button.edit')
  handleEdit(event: MouseEvent) {
    const row = (event.target as HTMLButtonElement).closest('tr');
  }

  @on('click', 'button.delete')
  handleDelete(event: MouseEvent) {
    event.stopPropagation(); // Don't trigger row click
    (event.target as HTMLButtonElement).closest('tr')?.remove();
  }
}
```

Template — for dynamic content, use a controller with `@on` for delegation, or handle events on a parent element and branch manually:

```typescript
html`
  <ul @click=${this.handleListClick}>
    ${this.items.map((item, index) => html`
      <li data-index="${index}">
        ${item}
        <button class="delete">Delete</button>
      </li>
    `)}
  </ul>
`

handleListClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  if (target.classList.contains('delete')) {
    const li = target.closest('li');
    const index = parseInt(li?.dataset.index || '-1');
    if (index >= 0) this.items = this.items.filter((_, i) => i !== index);
    return;
  }

  if (target.tagName === 'LI') {
    console.log('Item clicked:', target.textContent);
  }
}
```

## Keyboard shortcuts (summary)

Template syntax (preferred):

```typescript
html`
  <input @keydown.enter=${this.submit}>
  <input @keydown.ctrl+s=${this.save}>
  <input @keydown.ctrl+shift+s=${this.saveAs}>
  <input @keydown.escape=${this.cancel}>
  <input @keydown.~enter=${this.submitAny}>
`
```

`@on` decorator syntax:

```typescript
@controller('keyboard-controller')
class KeyboardController implements IController {
  element: HTMLElement | null = null;
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('keydown:Enter') handleEnter(e: KeyboardEvent) {}
  @on('keydown:Ctrl+S') handleSave(e: KeyboardEvent) { e.preventDefault(); }
  @on('keydown:Escape') handleEscape(e: KeyboardEvent) {}
}
```
