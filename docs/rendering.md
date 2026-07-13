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

```typescript
@element('open-panel')                       // open shadow root
@element('closed-panel', { shadow: 'closed' })
@element('light-panel', { renderRoot: 'light' })
@element('light-panel-short', { shadow: false })
@element('focus-panel', { delegatesFocus: true })
```

Shadow DOM is the default. Light DOM, open/closed shadow roots, and `delegatesFocus` all use the same rendering, query, style, event, and reconnect lifecycle. Framework `@query()` access continues to work with a closed root. Override `createRenderRoot()` for a custom host or shadow-root policy; it must return the host element or a `ShadowRoot`.

`renderRoot` and `shadow` may be written together only when they select the same root kind. An explicit child-class `shadow` option overrides an inherited light/shadow kind; an explicit child `renderRoot: 'shadow'` likewise escapes an inherited `shadow: false` setting.

## Editor metadata

Published packages include:

- `custom-elements.json` for the Custom Elements Manifest ecosystem.
- `vscode.html-custom-data.json` for HTML tag, attribute, and event completion.
- `snice/components/custom-elements` TypeScript declarations for tag-name maps and component element types.

Regenerate metadata with `npm run generate:metadata`; CI or local checks can use `npm run check:metadata`.
