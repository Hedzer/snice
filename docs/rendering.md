<!-- AI: For the AI-optimized version of this doc, see docs/ai/rendering.md -->
# Declarative Rendering

Snice templates are tagged template literals that update only the dynamic parts of the DOM. Template structure is parsed once and DOM nodes are retained across updates.

```typescript
import {
  SniceElement, css, element, html, property, state
} from 'snice';

@element('user-editor')
class UserEditor extends SniceElement {
  static styles = css`:host { display: block; }`;

  @property() userId = '';
  @state({ deep: true }) form = { name: '', roles: [] as string[] };

  render() {
    return html`<h2>${this.form.name || 'New user'}</h2>`;
  }
}
```

`SniceElement` is optional. Plain `HTMLElement` subclasses continue to support `@render()` and `@styles()`. The base class adds a conventional `render()` method, static `styles`, kebab-case implicit attribute names, and typed `invalidate()` / `renderNow()` methods.

## Template values

Node expressions accept text, numbers, templates, iterables, DOM nodes, promises, async iterables, and `nothing`.

```typescript
html`
  <h2>${title}</h2>
  ${items.map(item => html`<span>${item.label}</span>`)}
  ${visible ? html`<section>Visible</section>` : nothing}
`
```

Dynamic text is escaped. `unsafeHTML(value)` is the explicit opt-in for trusted raw HTML. Use `svg`` for an SVG fragment that does not include its own outer `<svg>` element.

Escaping prevents markup injection; it does not make an untrusted navigation URL safe. Validate URL sinks with `isSafeUrl()`:

```typescript
import { isSafeUrl } from 'snice';

if (isSafeUrl(candidateUrl)) {
  window.location.href = candidateUrl;
}

isSafeUrl(objectUrl, { allowed: ['blob:'] });
```

By default, relative references and absolute `http:`, `https:`, `mailto:`, and `tel:` URLs are accepted. Network-path references must resolve to an allowed protocol. Malformed URLs, raw ASCII control characters, and every other explicit scheme are rejected. Passing `allowed` replaces the absolute-protocol list but does not disable relative references. `snice-button` applies this policy automatically to its `href` property.

## Bindings

This section is the quick syntax overview. See [Binding Channels](./bindings.md) for the complete value, cleanup, event, spread, sentinel, and form-control semantics.

```typescript
html`<input
  title=${label}
  data-label="prefix ${label}"
  .value=${value}
  ?disabled=${disabled}
  @input=${handler}
>`
```

| Syntax | Effect |
|---|---|
| `${value}` | Node content |
| `name=${value}` | Attribute |
| `.name=${value}` | JavaScript property |
| `?name=${value}` | Boolean attribute presence |
| `@event=${handler}` | Event listener |

Use property bindings for objects, arrays, functions, element state, and native form values. Property bindings preserve the JavaScript value and its identity.

### Class and style toggles

Toggle one class or one CSS property without rebuilding a complete string:

```typescript
html`<article
  class="card"
  class:selected=${this.selected}
  style:color=${this.color}
  style:--card-accent=${this.color}
></article>`
```

Falsy `class:name` values remove the class. `nothing`, `null`, or `false` removes an individual `style:name` property. `classMap()` and `styleMap()` remain available when an object-to-string mapping is more convenient.

### Event modifiers and keyboard filters

Event modifiers compose after the event name with `|`:

```typescript
html`
  <form @submit|prevent=${this.save}></form>
  <button @click|once|stop=${this.runOnce}>Run</button>
  <div @click|self=${this.selectContainer}>...</div>
  <input @keydown.ctrl+s|prevent=${this.save}>
  <input @keyup.~enter=${this.acceptWithAnyModifiers}>
`
```

Supported modifiers are `prevent`, `stop`, `immediate`, `once`, `capture`, `passive`, and `self`. Long aliases such as `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` are accepted. `passive` and `prevent` cannot be combined.

Keyboard filters support dot or colon notation. Exact filters such as `@keydown.ctrl+s` reject extra modifiers; `~` allows any modifier combination, as in `@keydown.~enter`.

Handlers can be functions or `EventListenerObject` values. Template functions run with `this` bound to the component that owns the render tree.

### Named spreads

Prefer direct bindings when the set of keys is known; they are easier to read. Named spreads are for dynamic or forwarded bags from wrappers, plugins, and generated views. They make the target channel explicit and remove stale keys on later renders:

```typescript
@property({ attribute: false }) forwardedProps = {};
@property({ attribute: false }) accessibility = {};
@property({ attribute: false }) forwardedListeners = {};

html`<input
  ...props=${this.forwardedProps}
  ...attrs=${this.accessibility}
  ...events=${this.forwardedListeners}
>`
```

- `...props` assigns JavaScript properties. A key removed during a live update is reset to `undefined`.
- `...attrs` writes attributes. `nothing`, `null`, and `false` remove a key; `true` writes an empty attribute.
- `...events` manages listeners. Names may be `click` or `@click`.

Event-spread values may be functions, `EventListenerObject` values, or nullish/false to remove a listener. Empty or duplicate normalized names (for example both `click` and `@click`) are rejected. Listeners detach while a conditional branch is parked and reattach when it returns. Removing a host from the document retains the listeners on its retained render tree, matching native DOM behavior. Consumed `|once` and `EventListenerObject.once` listeners stay consumed in either lifecycle.

## Form controls

Keep both directions visible: bind component state to the native property, then handle the browser event that updates component state.

```typescript
@state() query = '';
@state() accepted = false;

render() {
  return html`
    <input .value=${this.query} @input=${this.updateQuery}>
    <input type="checkbox" .checked=${this.accepted} @change=${this.updateAccepted}>
  `;
}

updateQuery(event: InputEvent) {
  this.query = (event.currentTarget as HTMLInputElement).value;
}

updateAccepted(event: Event) {
  this.accepted = (event.currentTarget as HTMLInputElement).checked;
}
```

Use `input` for text as it changes and `change` for committed choices such as checkboxes, selects, and files. Explicit handlers also make parsing, validation, and IME policy visible at the point where the view updates the model.

## Control flow

Snice control-flow tags are virtual: they do not remain in the DOM.

### If / else-if / else

```typescript
html`
  <if ${this.loading}>
    <p>Loading…</p>
    <else-if ${this.error}>
      <p role="alert">${this.error.message}</p>
    </else-if>
    <else>
      <user-view .user=${this.user}></user-view>
    </else>
  </if>
`
```

`<else-if>` and `<else>` must be direct children of `<if>`, and `<else>` must be last. Branch DOM is parked and restored, so input state and element identity survive branch switches.

### Case / when / default

Static `value` matching compares string representations. A bare expression uses `Object.is`, so symbols, objects, numbers, and other typed values can be matched by identity.

```typescript
html`
  <case ${this.status}>
    <when value="loading">Loading…</when>
    <when ${READY_STATE}>Ready</when>
    <default>Unknown</default>
  </case>
`
```

### Keyed repeat

Use `repeat()` when list identity matters:

```typescript
html`<ul>${repeat(this.items, {
  key: item => item.id,
  render: (item, index) => html`<li>${index + 1}. ${item.label}</li>`,
  empty: () => html`<li>No results</li>`
})}</ul>`
```

`repeat()` accepts any iterable, adds no wrapper, moves existing DOM when order changes, and rejects duplicate keys before reconciliation. A normal mapped array and `key=${value}` remain supported; `repeat()` is the explicit API when keyed identity and an empty state are required together.

## Async content

A Promise or AsyncIterable can be rendered directly in a node expression. A promise replaces the pending empty range when it settles. An async iterable commits each emission. Changing the source ignores stale results, and disconnecting the owning tree stops active consumption.

```typescript
userView = fetch(`/api/users/${this.userId}`)
  .then(response => response.json())
  .then(user => html`<user-card .user=${user}></user-card>`)
  .catch(error => html`<p role="alert">${error.message}</p>`);

render() {
  return html`${this.userView}`;
}
```

Promise cancellation remains the caller's responsibility; use `AbortController` in the component lifecycle when a fetch must be aborted. Async iterators receive a best-effort `return()` call when replaced or disconnected.

## Reactive authoring

### Properties and state

```typescript
@property({ type: Number, reflect: false }) page = 1;
@property({ attribute: 'user-id' }) userId = '';
@property({ attribute: false }) service!: UserService;
@state() open = false;
@state({ deep: true }) filters = { tags: [] as string[] };
```

- `@property()` observes an attribute by default and reflects property writes back by default.
- `reflect: false` keeps attribute-to-property input but stops property-to-attribute output.
- `attribute: false` disables both attribute observation and reflection.
- `@state()` is reactive internal state and never participates in attributes.
- `type` and `converter.fromAttribute` convert only the string attribute boundary. Direct JavaScript property assignments preserve their exact value and identity.
- `converter.toAttribute` controls reflection serialization.
- `hasChanged(value, oldValue)` customizes assignment change detection.

Plain `HTMLElement` subclasses retain legacy lowercase implicit attribute names. `SniceElement` converts implicit camelCase names to kebab-case. An explicit `attribute` name works the same on either base.

### Deep state

`deep: true` observes nested writes in plain objects, arrays, `Map`, and `Set`:

```typescript
@state({ deep: true }) model = {
  user: { name: 'Ada' },
  rows: [] as Row[],
  flags: new Map<string, boolean>(),
  selected: new Set<string>()
};

this.model.user.name = 'Grace';
this.model.rows.push(row);
this.model.flags.set('ready', true);
```

Mutations are batched into the normal render scheduler. Cycles are supported, proxies are stable, collection iteration returns reactive nested values, and mutating an old graph after replacing the property does not invalidate the component.

Deep observation uses native `Proxy` and `Reflect`. It is intended for modern evergreen browsers and is not available in Internet Explorer. Regular `@property()` / `@state()` fields do not require deep proxies. Class instances such as `Date`, DOM nodes, and application service objects are deliberately left intact.

### SniceElement conventions

```typescript
@element('user-panel')
class UserPanel extends SniceElement {
  static styles = [baseStyles, css`:host { display: block; }`];
  static renderOptions = { debounce: 20 };

  @state() user: User | null = null;

  render() {
    return html`...`;
  }
}
```

`invalidate()` schedules the conventional render and returns the current `rendered` promise. `renderNow()` commits immediately. Decorated `@render()` / `@styles()` methods remain available and can be used on either base class.

## Render roots

Render-root selection (shadow, closed, light) is an element-definition concern; see [Elements](./elements.md#render-roots-and-shadow-dom).

## Editor metadata

Published packages include:

- `custom-elements.json` for the Custom Elements Manifest ecosystem.
- `vscode.html-custom-data.json` for HTML tag, attribute, and event completion.
- `snice/components/custom-elements` TypeScript declarations for tag-name maps and component element types.

Regenerate metadata with `npm run generate:metadata`; CI or local checks can use `npm run check:metadata`.

## @render() Decorator

Returns a template using the `html` tagged template. Automatically re-renders when properties change due to differential rendering.

```typescript
import { element, render, html, property } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property()
  name = 'Anonymous';

  @render()
  renderContent() {
    return html`
      <div class="card">
        <h3>${this.name}</h3>
        <p>User details...</p>
      </div>
    `;
  }
}
```

**Auto-Rendering:**
- Template automatically re-renders when `@property()` decorated properties change
- Only changed parts of the DOM update (differential rendering)
- No manual re-render calls needed

**Render Options:**

The `@render()` decorator accepts an optional configuration object:

```typescript
@render({
  debounce?: number,    // Delay re-render (ms)
  throttle?: number,    // Limit re-render frequency (ms)
  once?: boolean,       // Render once, disable auto-rendering
  sync?: boolean,       // Synchronous rendering (skip batching)
  differential?: boolean // Disable differential rendering (default: true)
})
```

**Differential Rendering:**

By default, Snice uses differential rendering which only updates changed parts of the DOM. To disable this and re-render from scratch each time:

```typescript
@element('simple-list')
class SimpleList extends HTMLElement {
  @property({ type: Array })
  items = [];

  @render({ differential: false })
  renderContent() {
    // Must return a string when differential: false
    return `
      <ul>
        ${this.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }
}
```

**When to use `differential: false`:**
- Component has complex dynamic structure that changes between renders
- Template structure changes based on data (e.g., empty state vs. populated)
- Avoiding differential rendering issues with dynamic attributes
- Simple components where full re-render is acceptable

**Note:** When `differential: false`, the render method must return a string (not `html\`...\``). Declarative bindings and virtual control flow (`<if>`, `<case>`, and related tags) are not available in the raw-string mode.

## Imperative Rendering

Use `@render({ once: true })` with `@watch` and `@query` to render the template once, then update the DOM directly. Property changes fire watchers instead of triggering re-renders.

```typescript
@element('user-card')
class UserCard extends HTMLElement {
  @property() name = '';
  @property() role = '';

  @query('.name') $name!: HTMLElement;
  @query('.role') $role!: HTMLElement;

  @render({ once: true })
  template() {
    return html`
      <div class="card">
        <h3 class="name">${this.name}</h3>
        <span class="role">${this.role}</span>
      </div>
    `;
  }

  @watch('name', 'role')
  update(oldVal: any, newVal: any, prop: string) {
    if (!this.$name) return;
    this.$name.textContent = this.name;
    this.$role.textContent = this.role;
  }
}
```

**How it works:**

1. `@render({ once: true })` renders the template on first connect, then blocks all subsequent auto-renders. The initial render uses current property values via normal interpolation, so the DOM starts correct.
2. `@query` provides getters that re-query the shadow DOM on each access — no stale references.
3. `@watch` fires **synchronously** in the property setter, before `requestRender` is called. Since `once: true` blocks the render anyway, only the watcher runs.

**Timing on property change:**
1. Property setter runs
2. Value reflected to attribute (if applicable)
3. `@watch` methods fire synchronously
4. `requestRender()` called but immediately returns (blocked by `once`)

**When to use imperative rendering:**

- The template structure never changes — only content within fixed elements updates
- Updates are expensive (e.g., syntax highlighting, canvas operations) and you want precise control over what changes
- You need to coordinate async operations (fetching data, animations) without re-renders interfering
- Performance-critical components where differential rendering overhead matters

**Compared to declarative rendering:**

| | Declarative (`@render()`) | Imperative (`@render({ once: true })`) |
|---|---|---|
| Template re-renders | Automatic on property change | Never (after first render) |
| DOM updates | Differential (only changed parts) | Manual via `@watch` + `@query` |
| Boilerplate | Less — just use interpolation | More — explicit update methods |
| Control | Framework manages updates | You manage updates |

## Conditional Rendering

```typescript
@element('conditional-content')
class ConditionalContent extends HTMLElement {
  @property({ type: Boolean })
  isLoggedIn = false;

  @render()
  renderContent() {
    return html`
      <if ${this.isLoggedIn}>
        <div>Welcome back!</div>
        <button @click=${this.logout}>Logout</button>
        <else-if ${this.sessionExpired}>
          <button @click=${this.login}>Sign in again</button>
        </else-if>
        <else>
          <a href="/login">Please login</a>
        </else>
      </if>
    `;
  }

  logout() {
    this.isLoggedIn = false;
  }
}
```

The virtual control-flow tags add no wrapper elements and retain each branch's DOM identity. See [Declarative Rendering](./rendering.md) for typed `<when>` branches, `repeat()`, and direct async values. See [Binding Channels](./bindings.md) for exact property, attribute, event, spread, sentinel, and form semantics.
