<!-- AI: For the AI-optimized version of this doc, see docs/ai/bindings.md -->
# Binding Channels

Every expression in an `html` template writes through a specific browser channel. The channel decides whether a value becomes text, an attribute string, a JavaScript property, attribute presence, a listener, a class, or a CSS declaration. Choosing the channel is part of the component's public contract.

```typescript
import { html, live, noChange, nothing } from 'snice';
```

This reference covers every binding channel supported by the differential renderer. For control flow, keyed `repeat()`, async node values, render roots, and reactive authoring, see [Declarative Rendering](./rendering.md).

## Channel chooser

| Syntax | Writes to | Use it for |
|---|---|---|
| `${value}` | A DOM range between marker comments | Text, nested templates, nodes, lists, and async content |
| `name=${value}` | An HTML attribute string | Labels, IDs, ARIA, URLs, and serialized data |
| `name="a ${value} b"` | One interpolated attribute string | Attributes assembled from static and dynamic text |
| `.name=${value}` | A JavaScript property | Objects, arrays, functions, element APIs, and native form state |
| `?name=${value}` | Attribute presence | Native boolean attributes and presence-based selectors |
| `controller=${value}` | A controller attachment | Controller classes (preferred) or registry names |
| `@event=${handler}` | An event listener | DOM and custom events |
| `class:name=${value}` | One class token | Independent conditional classes |
| `style:name=${value}` | One CSS declaration | Independent styles and CSS custom properties |
| `...props=${bag}` | Multiple JavaScript properties | Dynamic or forwarded property bags |
| `...attrs=${bag}` | Multiple attributes | Dynamic or forwarded attribute bags |
| `...events=${bag}` | Multiple event listeners | Dynamic or forwarded listener bags |
| `key=${value}` | An attribute and list identity | Identity for mapped template arrays |
| `<!-- ${value} -->` | HTML comment data | Inspectable diagnostics or generated metadata |

Use direct bindings when names are known. Named spreads are deliberately explicit because property, attribute, and event bags have different value and cleanup rules.

## Shared rules

Snice parses the static template structure once and updates only the expression-backed parts. A binding keeps its DOM node or listener when the same template is rendered again.

All channels except ordinary attributes and HTML comments take exactly one expression. Static text or additional expressions in a property, boolean, event, class, style, or named-spread binding are ignored with a warning:

```typescript
// Wrong: a property is a value channel, not string interpolation.
html`<user-card .user="prefix ${user}"></user-card>`;

// Choose one complete JavaScript value.
html`<user-card .user=${user}></user-card>`;

// Or choose an attribute when the result is text.
html`<user-card data-user="prefix ${user.id}"></user-card>`;
```

Expressions cannot appear loose inside an opening tag. Use an explicit binding name:

```typescript
// Throws: expressions directly in opening tags are ambiguous.
html`<input ${configuration}>`;

// The destination is explicit.
html`<input ...props=${configuration}>`;
```

The bare expressions on `<if>`, `<else-if>`, `<case>`, and `<when>` are the only opening-tag exception; they belong to Snice's virtual control-flow grammar. Bindings are unavailable when `@render({ differential: false })` returns a raw string.

## Node content

A node expression owns a range in the document. It accepts:

- Strings, numbers, booleans, bigints, and symbols as escaped text
- Nested `html` or `svg` template results
- DOM `Node` values
- Arrays and other synchronous iterables
- `repeat()` results
- Promises and async iterables
- `unsafeHTML()` for explicitly trusted markup

```typescript
html`
  <h2>${title}</h2>
  ${items.map(item => html`<span>${item.label}</span>`)}
  ${ready ? html`<user-view .user=${user}></user-view>` : nothing}
`;
```

Dynamic strings are text, not markup. `unsafeHTML()` is the explicit trusted-HTML boundary.

`nothing`, `null`, `undefined`, and the empty string clear the owned range. Other primitives are visible text, including `false`, `0`, and `NaN`. A plain object that is not a supported template, node, or iterable falls back to `String(value)`.

Promises start with an empty range and commit their result when settled. Async iterables commit each emitted value. Replacing a source prevents stale results from winning; disconnecting its owning tree stops active iteration. Promise cancellation remains the caller's responsibility.

## Attributes

An ordinary attribute binding writes text through `setAttribute()`:

```typescript
html`<button
  title=${label}
  aria-label="Open ${label}"
  data-position="${row}:${column}"
></button>`;
```

Use attributes when the consumer is HTML, CSS, accessibility tooling, serialization, or a custom element's attribute API.

For a single-expression attribute:

- `nothing` removes the attribute.
- `null` and `undefined` write an empty attribute value.
- `true` and `false` become the strings `"true"` and `"false"`.
- Other values use `String(value)`.

An interpolated attribute may contain any number of expressions. `null` and `undefined` contribute empty text. If any slot is `nothing`, Snice removes the whole attribute. `noChange` preserves only that slot's previous value.

An attribute is always a string boundary. Do not use it to pass object identity to a child component; use a property binding.

## Properties

A leading dot assigns directly to the element's JavaScript property:

```typescript
html`<data-grid
  .rows=${rows}
  .formatter=${formatter}
  .selection=${selection}
></data-grid>`;
```

Property bindings preserve type and identity. They are the correct channel for arrays, objects, functions, class instances, custom-element APIs, and native state such as `input.value`, `input.checked`, or `select.value`.

`null`, `undefined`, and `false` are assigned unchanged. `nothing` assigns `undefined`. Re-rendering the same bound value skips the property write.

### Live property values

Native controls can mutate their own properties after Snice writes them. Normally, if the bound value has not changed, a later render leaves that user-edited DOM value alone. Wrap a property value in `live()` when the component state must be reasserted even if the bound value itself is unchanged:

```typescript
html`<input .value=${live(this.canonicalValue)}>`;
```

`live()` compares against the element's current property rather than the last value Snice committed. It is only for property bindings. It is useful for controlled fields, normalization, and resetting DOM state after validation; omit it when in-progress browser state should survive unrelated renders.

## Boolean attributes

A leading question mark controls presence, not a string value:

```typescript
html`<button
  ?disabled=${saving}
  ?hidden=${collapsed}
  ?data-selected=${selected}
></button>`;
```

A truthy value adds the attribute with an empty value. A falsy value or `nothing` removes it. This includes `false`, `0`, the empty string, `null`, `undefined`, and `NaN`.

Use this channel only when presence has meaning. If a consumer expects the text `"false"`, use an ordinary attribute. If it expects a JavaScript boolean property, use `.name`.

## Controllers

A bare `controller=${value}` binding attaches a controller. Bind the decorated class directly — the preferred channel — or a registry name string:

```typescript
import { DataLoader } from './controllers/data-loader';

html`<user-list controller=${DataLoader}></user-list>`;
html`<div controller=${DataLoader}></div>`; // native elements too
```

Class values skip the registry and are deduped by reference: re-rendering with the same class is a no-op; a different class (or `null`) detaches the previous controller first. The `@controller('name')` decorator is still required on the class. While a class is bound it owns the element. Snice reflects its decorator name as a diagnostic `controller="name"` attribute for DevTools, but that marker never resolves the registry or creates another attachment; treat it as read-only. Custom elements that have not upgraded yet hold the class until their `connectedCallback` runs.

String values delegate to the attribute channel and behave exactly like a static `controller="name"` attribute. Interpolated forms (`controller="user-${kind}"`) are ordinary attribute interpolation, not this channel.

Controllers detach while their subtree is parked or disconnected and re-attach on reconnection, mirroring element lifecycle.

## Class and style

`class:name` independently toggles one class without rebuilding the static `class` attribute:

```typescript
html`<article
  class="card"
  class:selected=${selected}
  class:pending=${status === 'pending'}
></article>`;
```

A truthy value adds the class. A falsy value or `nothing` removes it. Static classes and other `class:name` bindings remain untouched.

`style:name` writes one declaration with `CSSStyleDeclaration.setProperty()`:

```typescript
html`<article
  style:color=${foreground}
  style:grid-column=${column}
  style:--card-accent=${accent}
></article>`;
```

CSS property names are passed through as written, so use CSS spelling such as `background-color` and `--custom-token`. `nothing`, `null`, `undefined`, and `false` remove the declaration. Every other value is stringified, including `0` and the empty string. Static style declarations and other `style:name` bindings remain untouched.

Use `classMap()` or `styleMap()` when producing a complete class or style attribute from an object is clearer. Use the channel bindings when each token has an independent condition or lifecycle.

## Events

An event binding owns one native listener:

```typescript
html`<button @click=${this.save}>Save</button>`;
```

A handler may be a function or an `EventListenerObject` with `handleEvent(event)`. `nothing`, `null`, `undefined`, or `false` removes the listener. Any other value throws a `TypeError`.

Function handlers run with `this` set to the custom element that owns the render tree. Listener objects follow native DOM behavior: `this` inside `handleEvent` is the listener object itself. Replacing a handler updates the native listener; rendering the same handler leaves it attached.

### Event modifiers

Append modifiers with a vertical bar:

```typescript
html`
  <form @submit|prevent=${this.save}></form>
  <button @click|once|stop=${this.runOnce}>Run once</button>
  <div @click|self=${this.selectContainer}>...</div>
`;
```

Supported modifiers:

- `prevent` calls `preventDefault()` before the handler.
- `stop` calls `stopPropagation()`.
- `immediate` calls `stopImmediatePropagation()`.
- `once` consumes the listener after its first matching event.
- `capture` attaches in the capture phase.
- `passive` requests a passive listener.
- `self` runs only when `event.target` is the bound element.

The long aliases `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` are also accepted. `passive` cannot be combined with `prevent`.

Modifiers use the vertical-bar form. A dot on a non-keyboard event is part of the actual event name, so `@app.ready` listens for the custom event `app.ready`; it does not apply a modifier.

### Keyboard filters

`keydown`, `keyup`, and `keypress` support a key filter after a dot or colon:

```typescript
html`
  <input @keydown.enter=${this.accept}>
  <input @keydown:escape=${this.cancel}>
  <input @keydown.ctrl+s|prevent=${this.save}>
  <input @keyup.~enter=${this.acceptWithAnyModifiers}>
`;
```

Filters are exact by default: unspecified Ctrl, Alt, Shift, and Meta keys must be up. Prefix the key specification with `~` to ignore modifier state. Combine required modifiers with `+`; accepted names include `ctrl` or `control`, `alt`, `shift`, and `meta`, `cmd`, or `command`.

Common key aliases are normalized, including `esc`, `return`, `space`, arrow directions, `del`, `backspace`, `tab`, `home`, `end`, `pageup`, and `pagedown`.

### Custom event names

Slash, colon, and dot characters may be part of a custom event name. If the actual event name starts with `@`, escape the template prefix by doubling it:

```typescript
html`
  <user-card @user/saved=${this.refresh}></user-card>
  <user-card @app.ready=${this.ready}></user-card>
  <user-card @@snice/updated=${this.refresh}></user-card>
`;
```

The last binding listens for the actual event name `@snice/updated`.

### Listener objects and lifecycle

A listener object can carry native `capture`, `passive`, `once`, and `signal` options alongside `handleEvent`:

```typescript
const listener = {
  once: true,
  signal: abortController.signal,
  handleEvent(event: Event) {
    consume(event);
  }
};

html`<button @click=${listener}>Consume</button>`;
```

Listeners inside an inactive `<if>` or `<case>` branch detach while the branch is parked and reattach when it returns. A listener already consumed with `once` stays consumed. Removing and reconnecting a host retains listeners on its retained render tree, matching native DOM behavior.

## Named spreads

Named spreads are for forwarding a bag whose keys are only known at runtime. They do not guess a destination:

```typescript
html`<input
  ...props=${forwardedProperties}
  ...attrs=${accessibilityAttributes}
  ...events=${forwardedListeners}
>`;
```

The spread value must be a non-array object. `nothing`, `null`, or `undefined` means an empty bag, which cleans up every previously committed key. `noChange` as the entire spread value preserves the current bag. `false`, primitives, and arrays throw. `noChange` is not an entry-level sentinel inside a bag. An omitted key is cleaned up according to its destination channel.

### Property spreads

`...props` assigns each entry as a JavaScript property and preserves the entry's type and identity. An entry equal to `nothing` assigns `undefined`. A key omitted from the next bag is reset to `undefined` during that live update.

`...properties` is an accepted long alias. Prefer the shorter `...props` spelling in new templates.

### Attribute spreads

`...attrs` writes each entry as an attribute. `nothing`, `null`, `undefined`, and `false` remove that key; `true` writes an empty attribute; every other value is stringified. A key omitted from the next bag is removed.

`...attributes` is an accepted long alias. Prefer the shorter `...attrs` spelling in new templates.

### Event spreads

`...events` manages a listener per entry. Keys may be written as `click` or `@click`; the optional leading `@` is removed. The two spellings cannot both appear for the same event in one bag, and empty names throw.

Values may be functions, listener objects, `nothing`, `null`, `undefined`, or `false`. Removing a key removes its listener. Listener objects support native `capture`, `passive`, `once`, and `signal` options. Function handlers use the render host as `this`.

Event-spread keys are literal event names. Direct-binding modifiers and keyboard-filter syntax are not parsed in spread keys; use a listener object for native options or a direct `@event` binding for filters and modifiers.

## Keyed identity

In a normal mapped array, put `key=${value}` on the root element of every item template when DOM identity must follow the item instead of its array position:

```typescript
html`${items.map(item => html`
  <user-row key=${item.id} .user=${item}></user-row>
`)}`;
```

Keys compare by JavaScript identity. Every item must be keyed and keys must be unique. Duplicate keys throw. Mixing keyed and unkeyed item templates warns and falls back to position-based reconciliation. The `key` binding is also an ordinary attribute on the rendered root.

Prefer `repeat(items, { key, render, empty })` when keyed identity is intentional. It supplies keys directly to the reconciler, adds no wrapper, and does not require a `key` attribute in the rendered template.

## Comment interpolation

Expressions inside an authored HTML comment update the comment's data:

```typescript
html`
  <!-- render revision: ${revision}; source: ${source} -->
  <user-view .user=${user}></user-view>
`;
```

`nothing`, `null`, and `undefined` contribute empty text. Other values are stringified. `noChange` preserves an individual slot. A result containing `--` or ending with `-` throws because it is not valid HTML comment data.

Comments are invisible in the rendered page but visible to DOM inspection and serialized markup. Do not place secrets in them.

## Sentinel matrix

The same JavaScript value can mean something different in each channel:

| Channel | `null` or `undefined` | `false` | `nothing` | `noChange` |
|---|---|---|---|---|
| Node content | Clear the range | Render `false` text | Clear the range | Keep the current range |
| Attribute | Write an empty value | Write `"false"` | Remove the attribute | Keep the current value |
| Property | Assign as-is | Assign `false` | Assign `undefined` | Keep the current value |
| Boolean attribute | Remove | Remove | Remove | Keep current presence |
| Controller | Detach | Detach | Detach | Keep the current controller |
| Class token | Remove | Remove | Remove | Keep current presence |
| Style property | Remove | Remove | Remove | Keep the current declaration |
| Event listener | Remove | Remove | Remove | Keep the current listener |
| Whole named spread | Clear the bag | Throw | Clear the bag | Keep the current bag |
| Comment slot | Write empty text | Write `false` text | Write empty text | Keep the current slot |

For an interpolated attribute or comment, `noChange` preserves only its expression slot. On first render there is no earlier slot value, so it contributes empty text.

`nothing` is a public rendering value. `noChange` is an optimization and control signal: it means “do not commit this part during this render,” not “remove this part.”

## Form data flow

DOM-to-state updates remain explicit. Bind state to a native property, then handle the browser event that updates component state:

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

This keeps parsing, validation, IME policy, and the event that changes state visible. Use `input` for text as it changes and `change` for committed choices such as checkboxes, selects, and files.

Property-to-attribute reflection from `@property()` is a custom-element API concern; it does not replace a form control's browser-to-state event. See [Properties](./properties.md) for property and reflection semantics.

## Invalid placements and diagnostics

Snice rejects or warns about ambiguous channel authoring:

- A loose expression in an opening tag throws. Choose a named binding or named spread.
- An empty property, boolean, event, class, or style name throws.
- An unknown named spread throws; supported destinations are properties, attributes, and events.
- Static text or multiple expressions on a single-expression channel warn and are ignored after the first expression.
- A non-callable event value throws instead of becoming an inert attribute.
- A non-object spread, duplicate normalized event name, or empty event name throws.
- Invalid event modifiers and the `passive` plus `prevent` combination throw.
- Invalid comment data throws.

Enable `setStrictRenderErrors(true)` in tests and development when render failures should rethrow instead of being logged while the previous DOM remains in place.
