<!-- AI: For the AI-optimized version of this doc, see docs/ai/lifecycle.md -->
# Lifecycle

Connection, readiness, teardown, and reacting to change.

## Lifecycle Decorators

**@ready()** - Called after styles are applied and event handlers are set up. The initial render may still be completing in a microtask — use `@query` (which re-queries each access) to safely access rendered DOM:

```typescript
import { element, ready, query, render, html } from 'snice';

@element('auto-resize-textarea')
class AutoResizeTextarea extends HTMLElement {
  @query('textarea') textarea?: HTMLTextAreaElement;

  @ready()
  adjustHeight() {
    if (this.textarea) {
      this.textarea.style.height = `${this.textarea.scrollHeight}px`;
    }
  }

  @render()
  renderContent() {
    return html`<textarea @input=${this.adjustHeight}></textarea>`;
  }
}
```

**@reconnect()** - Called every time the element is connected AFTER the first connect. `@ready` only fires once; `@dispose` fires on every disconnect. The gap between is "what should run on a reconnect?" — for most components nothing extra is needed because framework-managed handlers (`@on`, `@observe`, `@respond`, `@context`) are re-established automatically. Use `@reconnect` only when the component wires its own long-lived global subscription in `@ready` (e.g. `document.addEventListener` for outside-click) and tears it down in `@dispose`:

```typescript
@element('outside-click-listener')
class OutsideClick extends HTMLElement {
  private handler = () => { /* ... */ };

  @ready()
  init() {
    document.addEventListener('click', this.handler);
  }

  @reconnect()
  onReconnect() {
    document.addEventListener('click', this.handler);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('click', this.handler);
  }
}
```

**@dispose()** - Called when element is removed from DOM:

```typescript
@element('animated-element')
class AnimatedElement extends HTMLElement {
  private rafId?: number;

  @ready()
  startAnimation() {
    const animate = () => {
      // Update animation frame
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  @dispose()
  stopAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  @render()
  renderContent() {
    return html`<canvas width="300" height="200"></canvas>`;
  }
}
```

## @moved() and @adopted()

Fire when the element is moved between documents (`adoptedCallback`).
`@adopted()` is an alias of `@moved()`; both accept the same debounce/throttle
options as the other lifecycle decorators.

```typescript
@element('portable-widget')
class PortableWidget extends HTMLElement {
  @moved()
  reattach() {
    // Re-resolve anything tied to the previous document (styles, observers)
  }
}
```

## Waiting for elements

Awaiting definition or readiness from outside a component — useful in tests and
in code that hands work to an element it did not create:

```typescript
import { waitForElementDefined, waitForElementReady, waitForAllCustomElements } from 'snice';

await waitForElementDefined('user-card');        // custom element is registered
await waitForElementReady(element);              // defined, connected, first render done
await waitForAllCustomElements(container);       // every custom element in a subtree
```

Each takes an optional `warningTimeout` (ms) and warns when an element takes
longer than expected rather than hanging silently. Silence those warnings with
`setDisableElementReadyWarnings(true)`.

Inside a component, prefer `await el.ready` — see [Testing](./testing.md).

## ready Promise

Every element has a `ready` promise that resolves when fully initialized:

```typescript
const el = document.createElement('my-element') as MyElement;
document.body.appendChild(el);
await (el as any).ready; // Wait for element to be ready
```

## Watch Decorator

Use `@watch` to react to property changes. Handlers receive three arguments: `(oldValue, newValue, propertyName)`.

```typescript
@element('reactive-component')
class ReactiveComponent extends HTMLElement {
  @property()
  userName = '';

  @property({ type: Number })
  score = 0;

  @watch('userName')
  onUserNameChange(oldVal: string, newVal: string, prop: string) {
    console.log(`${prop} changed from ${oldVal} to ${newVal}`);
  }

  @watch('score')
  onScoreChange(oldVal: number, newVal: number) {
    if (newVal > 100) {
      console.log('High score achieved!');
    }
  }

  // Wildcard watcher — fires on any @property change
  @watch('*')
  onAnyChange(oldVal: any, newVal: any, prop: string) {
    console.log(`${prop}: ${oldVal} → ${newVal}`);
  }

  @render()
  renderContent() {
    return html`
      <div>
        <h1>${this.userName}</h1>
        <p>Score: ${this.score}</p>
      </div>
    `;
  }
}
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

The options object always comes after the property names, so it works with multiple watched properties too: `@watch('width', 'height', { immediate: false })`.

## @context() Decorator

Receive router context updates. The decorated method is called whenever the router context changes (navigation, app context update, etc.):

```typescript
import { element, context, property, render, html } from 'snice';
import type { Context, Placard } from 'snice';

@element('nav-bar')
class NavBar extends HTMLElement {
  @property({ type: Array })
  placards: Placard[] = [];

  @property()
  currentRoute = '';

  @context()
  onContextUpdate(ctx: Context) {
    this.placards = ctx.navigation.placards;
    this.currentRoute = ctx.navigation.route;
  }

  @render()
  renderContent() {
    return html`
      <nav>
        ${this.placards
          .filter(p => p.show !== false)
          .map(p => html`
            <a href="${p.href || ''}" class="${this.currentRoute === p.name ? 'active' : ''}">
              ${p.icon} ${p.title}
            </a>
          `)}
      </nav>
    `;
  }
}
```

**Context Options:**

```typescript
@context({ debounce: 300 })   // Wait 300ms after last change
@context({ throttle: 500 })   // At most once per 500ms
@context({ once: true })       // Only called once, then auto-unregisters
```

The `Context` object provides:
- `ctx.application` — App context (theme, auth, config, etc.)
- `ctx.navigation.route` — Current route path
- `ctx.navigation.params` — Route parameters
- `ctx.navigation.placards` — All registered page placards
- `ctx.fetch` — Fetch with middleware support (see Fetcher docs)
