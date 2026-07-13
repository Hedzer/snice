<!-- AI: For the AI-optimized version of this doc, see docs/ai/rendering.md -->
# Declarative Rendering

Snice templates are tagged template literals that update only the dynamic parts of the DOM. Template structure is parsed once, DOM nodes are retained across updates, and directives can own lifecycle-bound behavior without adding wrapper elements.

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

Node expressions accept text, numbers, templates, iterables, DOM nodes, promises, async iterables, `nothing`, and directives.

```typescript
html`
  <h2>${title}</h2>
  ${items.map(item => html`<span>${item.label}</span>`)}
  ${visible ? html`<section>Visible</section>` : nothing}
`
```

Dynamic text is escaped. `unsafeHTML(value)` is the explicit opt-in for trusted raw HTML. Use `svg`` for an SVG fragment that does not include its own outer `<svg>` element.

## Bindings

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

Handlers can be functions or `EventListenerObject` values. Template functions run with `this` bound to the component that owns the render tree, including handlers rendered through a portal.

### Named spreads

Named spreads make the target channel explicit and remove stale keys on later renders:

```typescript
html`<input
  ...props=${{ value: this.query, selectionStart: 0 }}
  ...attrs=${{ 'aria-label': this.label, hidden: this.hidden }}
  ...events=${{ input: this.onInput, blur: this.onBlur }}
>`
```

- `...props` assigns JavaScript properties. A key removed during a live update is reset to `undefined`.
- `...attrs` writes attributes. `nothing`, `null`, and `false` remove a key; `true` writes an empty attribute.
- `...events` manages listeners. Names may be `click` or `@click`.

Event-spread values may be functions, `EventListenerObject` values, or nullish/false to remove a listener. Empty or duplicate normalized names (for example both `click` and `@click`) are rejected. Listeners detach while a conditional branch is parked and reattach when it returns. Removing a host from the document retains the listeners on its retained render tree, matching native DOM behavior. Consumed `|once` and `EventListenerObject.once` listeners stay consumed in either lifecycle.

The element directives `props(object)`, `attrs(object)`, and `events(object)` provide the same channels when composition in an opening-tag expression is preferable.

## Two-way form binding

`bind(target, key)` synchronizes a model field and a DOM property:

```typescript
@state() query = '';
@state() accepted = false;

render() {
  return html`
    <input .value=${bind(this, 'query')}>
    <input type="checkbox" .checked=${bind(this, 'accepted')}>
  `;
}
```

`value` uses `input`, `checked` uses `input` and `change`, and `files` / `<select>` use `change`. Value bindings suppress intermediate IME composition values.

Customize the event and transformations when the view and model use different representations:

```typescript
html`<input .value=${bind(this, 'amount', {
  event: 'change',
  toView: amount => String(amount * 100),
  fromView: value => Number(value) / 100
})}>`
```

`bind()` is valid only in a property binding such as `.value=${...}`.

## Element directives

### Refs

```typescript
const input = createRef<HTMLInputElement>();

html`<input ${ref(input)}>`;
// input.value is the live element, or null while its branch is disconnected.
```

`ref()` accepts a `createRef()` object or a callback. Callback refs receive the element and later receive `null` during teardown or retargeting.

### Actions

`use(action, value?)` attaches behavior to a concrete element:

```typescript
const tooltip = (element: Element, text: string) => {
  element.setAttribute('aria-label', text);
  return {
    update(next: string) { element.setAttribute('aria-label', next); },
    destroy() { element.removeAttribute('aria-label'); }
  };
};

html`<button ${use(tooltip, this.help)}>Help</button>`;
```

An action may return a cleanup function or an object with `update()` and `destroy()`. Cleanup is paired across branch changes, host disconnect/reconnect, action replacement, and dynamic-component retargeting.

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

### Dynamic elements

```typescript
html`<component ${this.tag}
  ...attrs=${this.attributes}
  ...props=${this.properties}
  ${use(this.action)}
>Content</component>`
```

`<component>` selects a validated concrete tag at runtime, preserves the surrounding HTML or SVG namespace, and retargets its bindings when the tag changes. `nothing`, `null`, or `false` renders no element.
When an HTML void tag such as `input` or `img` is selected, authored children are parked rather than inserted into invalid markup; switching to a non-void tag restores those same child nodes.

## Async content

A Promise or AsyncIterable can be rendered directly in a node expression. A promise replaces the pending empty range when it settles. An async iterable commits each emission. Changing the source ignores stale results, and disconnecting the owning tree stops active consumption.

Use `resource()` when pending, ready, and error UI must be explicit:

```typescript
html`${resource(
  signal => fetch(`/api/users/${this.userId}`, { signal }).then(r => r.json()),
  {
    pending: () => html`<snice-spinner></snice-spinner>`,
    ready: user => html`<user-card .user=${user}></user-card>`,
    error: error => html`<p role="alert">${error.message}</p>`
  }
)}`
```

The source may be a Promise, AsyncIterable, or `(signal: AbortSignal) => value`. Source functions are aborted when replaced or disconnected. An AsyncIterable can publish multiple ready values.

## Portals

Render wrapper-free content into another `ParentNode` while keeping it owned by the source component:

```typescript
html`${portal(
  () => document.querySelector('#overlay-root'),
  html`<dialog open @click=${this.onDialogClick}>...</dialog>`
)}`
```

The target can be a node, selector, or target function. Content moves without recreation if the target changes. It is removed on disconnect and restored on reconnect.

## Transitions

`transition(content, options)` animates a keyed content change without a permanent wrapper:

```typescript
html`${transition(this.view, {
  key: this.route,
  mode: 'simultaneous',
  out: 'opacity: 0; transform: translateY(-4px)',
  in: 'opacity: 1; transform: translateY(0)',
  outDuration: 120,
  inDuration: 160,
  onComplete: this.focusHeading
})}`
```

The default mode is `sequential`; `simultaneous` overlaps outgoing and incoming content. Reduced-motion preferences are respected by default. Set `respectReducedMotion: false` only when motion is essential. Rapid changes queue the latest key, and disconnect settles active work immediately.

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

Shadow DOM is the default. Light DOM, open/closed shadow roots, and `delegatesFocus` all use the same rendering, query, directive, style, and reconnect lifecycle. Framework `@query()` access continues to work with a closed root. Override `createRenderRoot()` for a custom host or shadow-root policy; it must return the host element or a `ShadowRoot`.

`renderRoot` and `shadow` may be written together only when they select the same root kind. An explicit child-class `shadow` option overrides an inherited light/shadow kind; an explicit child `renderRoot: 'shadow'` likewise escapes an inherited `shadow: false` setting.

## Custom directives

Extend `Directive` when behavior needs retained per-expression state:

```typescript
class Uppercase extends Directive {
  render(value: unknown) {
    return String(value).toUpperCase();
  }

  update(part: DirectivePart, [value]: readonly [unknown]) {
    return this.render(value);
  }

  disconnected(context?: DirectiveDisconnectContext) {
    // context.reason is 'host', 'branch', or 'dispose'
  }
  reconnected() {}
  adopted(nodeMap: ReadonlyMap<Node, Node>) {}
}

export const uppercase = directive<Uppercase, readonly [unknown]>(Uppercase);
```

Directives work in node, attribute, property, boolean-attribute, event, element, class, style, and spread positions. `PartInfo` identifies the position. `DirectivePart.setValue()` can publish a later value without replacing the directive. Instances are retained while the same directive class remains in the same expression slot and receive paired connection callbacks. The optional `DirectiveDisconnectContext` identifies whether the host was detached, a branch was parked, or the directive was permanently disposed.

For SSR, add a static `renderToString(values, context)` method. It may return a value or, when `context.async` is true, a promise. `directiveServerResult(kind, value, name?)` lets an element directive emit attribute/property spreads or a named hydration boundary.

## Server rendering and hydration

The server renderer has no DOM dependency:

```typescript
const body = renderToString(html`<main>${content}</main>`);

const asyncBody = await renderToStringAsync(html`
  <main>${fetchContent()}</main>
`);
```

`renderToString()` emits hydration boundaries and renders the pending branch of `resource()`. `renderToStringAsync()` awaits promises, consumes async iterables to their latest value, and runs async directive rendering across node, attribute, property, spread, control-flow, and dynamic-component positions. Pass `{ hydratable: false }` when no client attachment is needed.

Render a complete custom-element host with light DOM or declarative shadow DOM:

```typescript
const markup = await renderElementToStringAsync(
  'user-panel',
  html`<h2>${loadName()}</h2>`,
  {
    attributes: { 'user-id': id },
    styles: UserPanel.styles,
    shadow: 'closed',
    delegatesFocus: true
  }
);
```

Use `renderRoot: 'light'` or its `shadow: false` shorthand for light-DOM output. `shadow: 'open'` is the default; `shadow: 'closed'` emits a closed declarative shadow root.

`renderElementToString()` and its async counterpart add `data-snice-hydrate` by default. When the component upgrades, its first render hydrates matching server DOM, preserves node identity, attaches events/directives, reuses matching server styles, and removes the marker.

Manual hydration is also available:

```typescript
hydrate(template, container);
hydrate(template, container, { onMismatch: 'replace' });
hydrateElement(customElement, template);
```

The default mismatch policy throws `HydrationError` with a structural path. `replace` logs the mismatch and mounts a fresh tree.

Declarative shadow DOM is an output format for shadow-root hosts; light-DOM SSR works without it. Browsers that do not parse declarative shadow DOM need a server or bootstrap polyfill before `hydrateElement()` can attach to that markup.

## Editor metadata

Published packages include:

- `custom-elements.json` for the Custom Elements Manifest ecosystem.
- `vscode.html-custom-data.json` for HTML tag, attribute, and event completion.
- `snice/components/custom-elements` TypeScript declarations for tag-name maps and component element types.

Regenerate metadata with `npm run generate:metadata`; CI or local checks can use `npm run check:metadata`.
