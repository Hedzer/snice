<!-- AI: For the AI-optimized version of this doc, see docs/ai/api.md -->
# Events API Documentation

Event handling in Snice provides two powerful approaches: **template event syntax** and the **`@on` decorator**. The `@on` decorator works in **both elements AND controllers** with full event delegation, keyboard modifiers, debounce/throttle, and more. Additionally, the `@dispatch` decorator enables automatic custom event dispatching.

## Table of Contents
- [Template Event Syntax (Preferred for Elements)](#template-event-syntax-preferred-for-elements)
- [@on Decorator](#on-decorator)
- [@dispatch Decorator](#dispatch-decorator)
- [Event Bus](#event-bus)
- [Custom Events](#custom-events)
- [Event Delegation](#event-delegation)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Template Event Syntax (Preferred for Elements)

The recommended way to handle events in elements is using template event syntax with `@event=${handler}`:

### Basic Usage

```typescript
import { element, property, render, html } from 'snice';

@element('click-counter')
class ClickCounter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <div class="counter">
        <button @click=${this.increment}>Increment</button>
        <button @click=${this.decrement}>Decrement</button>
        <button @click=${this.reset}>Reset</button>
        <span class="count">${this.count}</span>
      </div>
    `;
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }

  reset() {
    this.count = 0;
  }
}
```

### Event Object Access

```typescript
@element('form-handler')
class FormHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleSubmit}>
        <input
          type="text"
          name="username"
          @input=${this.handleInput}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        >
        <button type="submit">Submit</button>
      </form>
    `;
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    console.log('Form submitted:', Object.fromEntries(formData));
  }

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Input value:', input.value);
  }

  handleFocus(event: Event) {
    console.log('Input focused');
  }

  handleBlur(event: Event) {
    console.log('Input blurred');
  }
}
```

### Multiple Event Types

```typescript
@element('file-upload')
class FileUpload extends HTMLElement {
  @property({ type: Boolean })
  dragOver = false;

  @render()
  renderContent() {
    return html`
      <div
        class="dropzone ${this.dragOver ? 'drag-over' : ''}"
        @dragenter=${this.handleDragEnter}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        Drop files here
      </div>
    `;
  }

  handleDragEnter(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  handleDragLeave(e: DragEvent) {
    this.dragOver = false;
  }

  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const files = Array.from(e.dataTransfer?.files || []);
    console.log('Files dropped:', files);
  }
}
```

### Keyboard Shortcuts in Templates

Template event syntax supports keyboard shortcuts using dot notation:

```typescript
@element('keyboard-input')
class KeyboardInput extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div>
        <input
          @keydown.enter=${this.handleEnter}
          placeholder="Press Enter"
        >

        <input
          @keydown.ctrl+s=${this.handleSave}
          placeholder="Press Ctrl+S"
        >

        <input
          @keydown.escape=${this.handleCancel}
          placeholder="Press Escape"
        >

        <input
          @keydown.~enter=${this.handleAnyEnter}
          placeholder="Press Enter with any modifiers"
        >
      </div>
    `;
  }

  handleEnter(e: KeyboardEvent) {
    console.log('Enter pressed (no modifiers)');
  }

  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Ctrl+S pressed');
  }

  handleCancel(e: KeyboardEvent) {
    console.log('Escape pressed');
  }

  handleAnyEnter(e: KeyboardEvent) {
    console.log('Enter pressed (with any modifiers)');
  }
}
```

**Keyboard Shortcut Syntax:**
- `@keydown.enter` - Plain Enter (no modifiers)
- `@keydown.ctrl+s` - Ctrl+S combination
- `@keydown.ctrl+shift+s` - Multiple modifiers
- `@keydown.~enter` - Enter with any modifiers
- `@keydown.escape`, `@keydown.down`, etc. - Named keys

### Template Event Modifiers

Append DOM listener and propagation behavior with `|`:

```typescript
html`
  <form @submit|prevent=${this.submit}></form>
  <button @click|once|stop=${this.runOnce}>Run once</button>
  <section @click|self=${this.selectSection}>...</section>
  <input @keydown.ctrl+s|prevent=${this.save}>
  <div @pointermove|capture|passive=${this.track}></div>
`
```

Supported modifiers:

- `prevent` calls `preventDefault()` (`preventDefault` alias).
- `stop` calls `stopPropagation()` (`stopPropagation` alias).
- `immediate` calls `stopImmediatePropagation()` (`stopImmediatePropagation` alias).
- `once`, `capture`, and `passive` configure DOM listener behavior.
- `self` invokes the handler only when `event.target` is the bound element.

`passive` and `prevent` are contradictory and produce a render error. Modifiers compose with dot or colon keyboard filters. Exact keyboard combinations reject extra modifiers; prefix the key filter with `~` to accept any modifier combination.

Handlers may also be `EventListenerObject` values. Their `handleEvent()` method receives the object as `this`, and `capture`, `once`, or `passive` fields are honored. Function handlers receive the component that owns the render tree as `this`.

### Arrow Functions in Templates

Use arrow functions for inline event handling or passing parameters:

```typescript
@element('task-list')
class TaskList extends HTMLElement {
  @property()
  tasks = [
    { id: 1, name: 'Task 1', completed: false },
    { id: 2, name: 'Task 2', completed: false }
  ];

  @render()
  renderContent() {
    return html`
      <ul>
        ${this.tasks.map(task => html`
          <li>
            <input
              type="checkbox"
              ?checked=${task.completed}
              @change=${(e: Event) => this.toggleTask(task.id, e)}
            >
            <span>${task.name}</span>
            <button @click=${() => this.deleteTask(task.id)}>Delete</button>
          </li>
        `)}
      </ul>
    `;
  }

  toggleTask(id: number, e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = checkbox.checked;
      // Trigger re-render
      this.tasks = [...this.tasks];
    }
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
}
```

## @on Decorator

The `@on` decorator works in **both elements AND controllers**. It provides powerful event delegation, keyboard modifiers, debounce/throttle, and automatic event handling features.

**Use `@on` when you need:**
- Event delegation with CSS selectors
- Keyboard modifier matching (`Enter`, `ctrl+s`, etc.)
- Debounce or throttle
- Multiple events on one handler (accepts `string[]`: `@on(['mouseenter', 'focus'])`)
- Automatic preventDefault or stopPropagation

### Basic Controller Usage

```typescript
import { controller, on, IController } from 'snice';

@controller('button-controller')
class ButtonController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    console.log('Controller attached');
  }

  async detach(element: HTMLElement) {
    console.log('Controller detached');
  }

  @on('click')
  handleClick(event: MouseEvent) {
    console.log('Button clicked');
  }

  @on('mouseenter')
  handleMouseEnter(event: MouseEvent) {
    console.log('Mouse entered');
  }

  @on('mouseleave')
  handleMouseLeave(event: MouseEvent) {
    console.log('Mouse left');
  }
}
```

### Event Delegation with Selector

```typescript
@controller('list-controller')
class ListController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Handle clicks on list items
  @on('click', '.list-item')
  handleItemClick(event: MouseEvent) {
    const item = event.target as HTMLElement;
    console.log('Item clicked:', item.textContent);
  }

  // Handle clicks on delete buttons
  @on('click', '.delete-button')
  handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    const button = event.target as HTMLElement;
    const item = button.closest('.list-item');
    item?.remove();
  }

  // Handle input on text fields
  @on('input', 'input[type="text"]')
  handleTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Text changed:', input.value);
  }
}
```

### Keyboard Events with @on

```typescript
@controller('editor-controller')
class EditorController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('keydown:Enter', 'textarea')
  handleEnter(event: KeyboardEvent) {
    console.log('Enter pressed in textarea');
  }

  @on('keydown:Ctrl+S')
  handleSave(event: KeyboardEvent) {
    event.preventDefault();
    console.log('Save shortcut triggered');
    this.save();
  }

  @on('keydown:Escape')
  handleEscape(event: KeyboardEvent) {
    console.log('Escape pressed');
    this.cancel();
  }

  private save() {
    console.log('Saving...');
  }

  private cancel() {
    console.log('Cancelling...');
  }
}
```

### @on Options

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
  debounce?: number;           // Debounce the handler by specified milliseconds
  throttle?: number;           // Throttle the handler by specified milliseconds

  // Shadow DOM delegation
  target?: string;             // CSS selector to target specific elements within shadow root

  // Where to attach the listener (see scope section below)
  scope?: 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null);

  // Named daemon from the nearest provided app context
  daemon?: string;
}
```

#### scope — controlling the listener target

By default, `@on` attaches the listener to the host element. The `scope` option redirects
that attachment to another target, which is how Snice expresses cross-cutting events.

| `scope` value | Listener attaches to |
|---|---|
| omitted | host element (default) |
| `'global'` | `document` |
| selector string | `host.closest(selector)` — nearest matching ancestor |
| `Element` / `EventTarget` | that node directly |
| `(this) => EventTarget \| null` | called at connect; `null` skips |

The resolver function is called with the host element as `this` and re-resolves each time
the component reconnects to the DOM, so listeners follow the host when it moves.

```typescript
// Cross-cutting global event (document)
@on('bus:save', { scope: 'global' })
onSave(e: CustomEvent) { /* ... */ }

// Scoped to nearest ancestor matching the selector
@on('bus:cart-added', { scope: 'cart-shell' })
onCartAdded(e: CustomEvent) { /* ... */ }

// Explicit EventTarget
@on('go', { scope: someElement })
onGo() { /* ... */ }

// Resolver — full control, re-runs on reconnect
@on('beep', { scope() { return this.closest('app-shell'); } })
onBeep() { /* ... */ }
```

If `scope` cannot resolve (selector matches no ancestor, resolver returns `null` or throws),
the listener is **not attached** and a `console.warn` is emitted. The component still
mounts; only the listener is skipped.

Disconnect removes the listener from whichever target it was attached to. Reconnect
re-resolves and re-attaches, so resolver-based scopes track DOM moves correctly.

`scope` is compatible with the delegation selector — the listener attaches on the
scoped target and still matches the selector when an event fires within it.

`daemon` is a separate, non-DOM target. It cannot be combined with `scope` and does
not support selector delegation. See [Daemons](./daemons.md).

#### Throttling

```typescript
@controller('scroll-controller')
class ScrollController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Throttle scroll events to max once per 100ms
  @on('scroll', null, { throttle: 100 })
  handleScroll(event: Event) {
    const element = event.target as HTMLElement;
    console.log('Scroll position:', element.scrollTop);
  }
}
```

#### Debouncing

```typescript
@controller('search-controller')
class SearchController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Debounce input events by 300ms
  @on('input', 'input[type="search"]', { debounce: 300 })
  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Searching for:', input.value);
    this.performSearch(input.value);
  }

  private async performSearch(query: string) {
    // Search implementation
  }
}
```

### Using @on in Elements (Alternative)

While template syntax is preferred, `@on` can also be used in elements:

```typescript
import { element, on, render, html } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() {
    return html`<button class="btn">Click me</button>`;
  }

  @on('click', '.btn')
  handleClick(event: MouseEvent) {
    console.log('Button clicked via @on decorator');
  }

  @on('input', 'input', { debounce: 300 })
  handleInput(event: Event) {
    console.log('Input debounced');
  }
}
```

**Note:** For new element code, prefer template event syntax for better readability and type safety.

## @dispatch Decorator

Auto-dispatch custom events after method execution:

### Basic Usage

```typescript
import { element, dispatch, render, html } from 'snice';

@element('value-input')
class ValueInput extends HTMLElement {
  private value = '';

  @render()
  renderContent() {
    return html`
      <input
        type="text"
        .value=${this.value}
        @input=${this.handleInput}
      >
    `;
  }

  handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setValue(input.value);
  }

  @dispatch('value-changed')
  setValue(newValue: string) {
    this.value = newValue;
    return { value: newValue }; // Event detail
  }
}
```

Usage:
```typescript
const input = document.querySelector('value-input');
input.addEventListener('value-changed', (e: CustomEvent) => {
  console.log('New value:', e.detail.value);
});
```

### Event Options

Events dispatched by `@dispatch` default to `bubbles: true` and `composed: true` (crosses shadow DOM boundaries). Override if needed:

```typescript
@element('status-indicator')
class StatusIndicator extends HTMLElement {
  @render()
  renderContent() {
    return html`<div>Status</div>`;
  }

  // Defaults: bubbles: true, composed: true
  @dispatch('status-changed')
  updateStatus(status: string) {
    return {
      status,
      timestamp: Date.now()
    };
  }
}
```

### DispatchOptions

```typescript
interface DispatchOptions extends EventInit {
  dispatchOnUndefined?: boolean; // Undefined return still dispatches unless false (default: true)
  debounce?: number;             // Debounce dispatch by ms
  throttle?: number;             // Throttle dispatch by ms
  // Where to dispatch the event (see scope section below)
  scope?: 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null);
  // Named daemon from the nearest provided app context
  daemon?: string;
}
```

#### scope — controlling the dispatch target

By default, `@dispatch` originates from the element or a controller's host; on a
daemon it uses that instance's private target. The `scope` option redirects a DOM dispatch so the
event behaves as if it originated there. Use this with `@on({ scope })` to express
cross-cutting events without going through bubbling.

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

If `scope` cannot resolve (selector matches no ancestor, resolver returns `null`),
the event is **not dispatched** and a `console.warn` is emitted. The method's return
value still flows through `dispatchOnUndefined` / `debounce` / `throttle` semantics
before the scope check.

Use `{ daemon: 'session' }` to dispatch on an explicitly provided daemon's private
communication target. `daemon` and `scope` are mutually exclusive. See
[Daemons](./daemons.md).

### Debounce/Throttle

```typescript
@element('search-box')
class SearchBox extends HTMLElement {
  @render()
  renderContent() {
    return html`<input @input=${this.handleInput}>`;
  }

  handleInput(e: Event) {
    this.emitSearch((e.target as HTMLInputElement).value);
  }

  @dispatch('search-query', { debounce: 300 })
  emitSearch(query: string) {
    return { query };
  }
}
```

### Async Methods

`@dispatch` works with async methods — the event dispatches after the promise resolves:

```typescript
@dispatch('validation-complete')
async validate() {
  const result = await this.runValidation();
  return { valid: result.isValid, errors: result.errors };
}
```

### Multiple Events

```typescript
@element('color-picker')
class ColorPicker extends HTMLElement {
  @property() color = '#000000';

  @render()
  renderContent() {
    return html`
      <input type="color" .value=${this.color} @input=${this.handleInput}>
      <button @click=${this.confirm}>OK</button>
    `;
  }

  handleInput(e: Event) {
    this.changeColor((e.target as HTMLInputElement).value);
  }

  @dispatch('color-preview')
  changeColor(color: string) {
    this.color = color;
    return { color };
  }

  @dispatch('color-selected')
  confirm() {
    return { color: this.color };
  }
}
```

## Event Bus

Snice has no bus object and no singleton. A bus is `@dispatch` publishing upward and
`@on` subscribing at a chosen ancestor -- the scope is a DOM node, so it is created and
torn down with the DOM.

There are two ways to publish, and the choice decides who can hear it.

**Bubble up from the host.** `@dispatch` is `bubbles: true, composed: true` by default, so
the event crosses shadow boundaries and passes every ancestor on its way to `document`.
Use this when the event is about *this* element and ancestors may care.

```typescript
@element('product-tile')
class ProductTile extends HTMLElement {
  @dispatch('bus:cart-added')
  addToCart(sku: string) {
    return { sku, qty: 1 };
  }
}
```

**Dispatch directly on a scope.** `@dispatch` takes the same `scope` option as `@on`, which
fires the event *on* that target instead of bubbling from the host. Use this when the
subscriber is not an ancestor -- a sibling subtree, or a host that may be detached.

```typescript
@dispatch('bus:cart-added', { scope: 'global' })   // dispatched on document
add(id: string) { return { id }; }
```

Subscribe at the scope you want to share.

```typescript
// App-wide: listens on document
@on('bus:cart-added', { scope: 'global' })
onCartAdded(e: CustomEvent) { /* ... */ }

// Feature-scoped: listens on the nearest <cart-shell> ancestor, so a second
// <cart-shell> elsewhere on the page keeps its own traffic
@on('bus:cart-added', { scope: 'cart-shell' })
onCartAdded(e: CustomEvent) { /* ... */ }
```

Choosing a scope:

| Reach | `scope` | Use when |
|---|---|---|
| Whole document | `'global'` | Genuinely app-wide: auth expiry, theme change, save shortcut |
| A feature subtree | selector string | The event belongs to one shell and must not leak to a sibling instance |
| A specific node | `EventTarget` / resolver | You already hold the node, or the target moves and must re-resolve |

Prefer the narrowest scope that works. `'global'` means every instance on the page hears
every message, which is what makes singleton buses hard to reason about.

Match the two halves. A bubbling publish only reaches subscribers that sit on the host's
ancestor chain; if the subscriber lives in a sibling subtree, scope the dispatch too so
both meet on the same node. See
[scope on @dispatch](#scope-controlling-the-dispatch-target).

Name events so the routing is visible at the call site -- the `bus:` prefix above is a
convention, not a framework feature. Any string works.

Teardown is automatic: the listener is removed on disconnect from whichever target it
resolved to, and re-resolved on reconnect, so subscribers follow the host when it moves.
If a selector scope matches no ancestor the listener is skipped with a `console.warn`
rather than silently binding to the wrong node. See
[scope](#scope-controlling-the-listener-target) for the full resolution table.

For a request that needs an answer rather than a broadcast, use
[@request / @respond](./request-response.md) instead.

For app-owned state with an explicit lifecycle, provide an `@daemon` instance and
use `{ daemon: 'name' }` on both publishers and subscribers. This keeps consumers
decoupled from the implementation class without introducing a global singleton.
See [Daemons](./daemons.md).

## Custom Events

Prefer `@dispatch` for a static custom event emitted from a Snice element or a
controller's host. The decorator supplies the standard bubbling and composed
behavior, uses the method return value as `detail`, and keeps debounce,
throttle, and scope declarative.

Manual dispatch remains valid when code needs direct access to the Event
object, a dynamic event name, the cancellation boolean returned by
`dispatchEvent()`, or a target other than the Snice host.

### Manual Escape Hatch

```typescript
@element('manual-dispatcher')
class ManualDispatcher extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <button @click=${this.notify}>Notify</button>
    `;
  }

  notify() {
    // Dispatch custom event manually
    this.dispatchEvent(new CustomEvent('notification', {
      detail: { message: 'Hello!', level: 'info' },
      bubbles: true,
      composed: true
    }));
  }
}
```

### Listening to Custom Events

```typescript
@element('event-listener')
class EventListener extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <manual-dispatcher @notification=${this.handleNotification}></manual-dispatcher>
    `;
  }

  handleNotification(e: CustomEvent) {
    console.log('Received notification:', e.detail);
  }
}
```

## Event Delegation

### Controller Event Delegation

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
    console.log('Row clicked:', row?.dataset.id);
  }

  // Handle button clicks in cells
  @on('click', 'button.edit')
  handleEdit(event: MouseEvent) {
    const button = event.target as HTMLButtonElement;
    const row = button.closest('tr');
    console.log('Edit row:', row?.dataset.id);
  }

  @on('click', 'button.delete')
  handleDelete(event: MouseEvent) {
    event.stopPropagation(); // Don't trigger row click
    const button = event.target as HTMLButtonElement;
    const row = button.closest('tr');
    row?.remove();
  }
}
```

### Template Event Delegation

For dynamic content, use controllers with `@on` for event delegation, or handle events on a parent element:

```typescript
@element('dynamic-list')
class DynamicList extends HTMLElement {
  @property()
  items = ['Item 1', 'Item 2', 'Item 3'];

  @render()
  renderContent() {
    return html`
      <ul @click=${this.handleListClick}>
        ${this.items.map((item, index) => html`
          <li data-index="${index}">
            ${item}
            <button class="delete">Delete</button>
          </li>
        `)}
      </ul>
    `;
  }

  handleListClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Handle delete button
    if (target.classList.contains('delete')) {
      const li = target.closest('li');
      const index = parseInt(li?.dataset.index || '-1');
      if (index >= 0) {
        this.items = this.items.filter((_, i) => i !== index);
      }
      return;
    }

    // Handle li click
    if (target.tagName === 'LI') {
      console.log('Item clicked:', target.textContent);
    }
  }
}
```

## Keyboard Shortcuts

### Template Syntax (Preferred)

```typescript
@element('shortcut-handler')
class ShortcutHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div>
        <input @keydown.enter=${this.submit} placeholder="Press Enter">
        <input @keydown.ctrl+s=${this.save} placeholder="Ctrl+S to save">
        <input @keydown.ctrl+shift+s=${this.saveAs} placeholder="Ctrl+Shift+S for Save As">
        <input @keydown.escape=${this.cancel} placeholder="Escape to cancel">
        <input @keydown.~enter=${this.submitAny} placeholder="Enter with any mods">
      </div>
    `;
  }

  submit(e: KeyboardEvent) {
    console.log('Submit');
  }

  save(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save');
  }

  saveAs(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save As');
  }

  cancel(e: KeyboardEvent) {
    console.log('Cancel');
  }

  submitAny(e: KeyboardEvent) {
    console.log('Submit with any modifiers');
  }
}
```

### @on Decorator Syntax

```typescript
@controller('keyboard-controller')
class KeyboardController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('keydown:Enter')
  handleEnter(e: KeyboardEvent) {
    console.log('Enter pressed');
  }

  @on('keydown:Ctrl+S')
  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save');
  }

  @on('keydown:Escape')
  handleEscape(e: KeyboardEvent) {
    console.log('Escape');
  }
}
```
