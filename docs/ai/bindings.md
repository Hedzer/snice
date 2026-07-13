# Binding Channels Reference

Source renderer: `src/parts.ts`. Public human reference: `docs/bindings.md`. Every expression must use the channel matching its DOM destination.

## Syntax matrix

```typescript
${value}                         // node range
name=${value}                   // single-value attribute
name="a ${value} b ${other}"    // interpolated attribute
.name=${value}                  // JavaScript property
?name=${value}                  // boolean attribute presence
@event=${handler}               // event listener
class:name=${value}             // one class token
style:name=${value}             // one CSS property; style:--token supported
...props=${bag}                 // property bag
...attrs=${bag}                 // attribute bag
...events=${bag}                // listener bag
key=${identity}                 // attribute + mapped-list identity
<!-- ${value} -->               // HTML comment data
```

Canonical spread spellings: `...props`, `...attrs`, `...events`. Parser also accepts `...properties` and `...attributes` as long aliases.

Ordinary attributes/comments support multiple expressions. Property, boolean, event, class, style, and spread channels take one expression; static text/extra expressions warn and are ignored. Loose expressions inside opening tags throw except bare virtual-control-flow operands on `<if>`, `<else-if>`, `<case>`, `<when>`. Bindings do not exist in raw-string `differential:false` mode.

## Channel semantics

### Node `${value}`

- Escaped text: string, number, boolean, bigint, symbol. `false` renders `"false"`.
- Structured: TemplateResult, DOM Node, iterable, `repeat()` result, `unsafeHTML()`.
- Async: PromiseLike or AsyncIterable; stale replaced sources ignored; active iterator stopped on disconnect; caller owns Promise cancellation.
- `nothing`, null, undefined, `''` clear.
- Unsupported object fallback: `String(value)`.
- `noChange`: preserve current range.

### Attribute `name=${value}`

- Always string boundary via `setAttribute`.
- Single value: `nothing` removes; null/undefined write `''`; otherwise `String(value)` (`false` -> `"false"`).
- Interpolation: null/undefined contribute `''`; any `nothing` slot removes entire attribute; `noChange` preserves only its previous slot (initial previous slot is `''`).
- Use for IDs, labels, ARIA, URLs, serialized values; not object identity.

### Property `.name=${value}`

- Direct JS assignment; preserves type and identity.
- null/undefined/false assigned unchanged; `nothing` assigns undefined; `noChange` skips.
- Same committed value skips write.
- `live(value)` compares value to the current DOM property instead of last commit; use only in property bindings when controlled native state must be reasserted after DOM/user mutation.

### Boolean attribute `?name=${value}`

- Truthy and not `nothing`: set empty attribute.
- Falsy or `nothing`: remove. Includes false, 0, `''`, null, undefined, NaN.
- `noChange`: preserve presence.
- Presence semantics only; use an ordinary attribute when the consumer needs text.

### Class `class:name=${value}`

- Truthy and not `nothing`: add token; otherwise remove.
- Does not rebuild static class or other class channels.
- Empty class name throws. `noChange` skips.

### Style `style:name=${value}`

- Uses `style.setProperty(name, String(value))`; CSS spelling is passed verbatim, including custom properties.
- `nothing`, null, undefined, false: `removeProperty`.
- 0 and `''` go through `setProperty`.
- Does not rebuild other declarations. Empty property name throws. `noChange` skips.

### Event `@event=${handler}`

- Accepts function or EventListenerObject (`handleEvent`); nothing/null/undefined/false removes; other values throw.
- Function `this`: render host. Listener-object `this`: listener object.
- Listener object doubles as options bag: capture, passive, once, signal.
- Modifiers appended with vertical bar: prevent, stop, immediate, once, capture, passive, self.
- Accepted aliases: preventDefault, stopPropagation, stopImmediatePropagation.
- passive + prevent invalid, including passive listener object + prevent.
- Keyboard filters only for keydown/keyup/keypress; dot or colon: `@keydown.enter`, `@keydown.ctrl+s`, `@keydown:ctrl+s`, `@keyup.~enter`. Exact modifier match unless `~`.
- Dot on non-keyboard name is literal: `@app.ready` listens for `app.ready`.
- `@@snice/event` listens for actual name `@snice/event`. Slash/colon/dot custom names supported.
- Parked conditional branches detach/reconnect listeners. Consumed once listeners stay consumed. Retained host DOM retains native listeners across host removal/reconnect.
- `noChange`: preserve current listener.

## Named spreads

Whole spread value must be non-array object. nothing/null/undefined -> empty bag and cleanup; `noChange` -> preserve current bag; false/primitives/arrays throw. `noChange` is not an entry sentinel.

### `...props`

- Direct property assignment; preserves identity.
- Entry `nothing` -> undefined.
- Omitted key on next live update -> assign undefined.
- Alias: `...properties`.

### `...attrs`

- Entry nothing/null/undefined/false -> remove; true -> empty attribute; otherwise String(value).
- Omitted key -> remove.
- Alias: `...attributes`.

### `...events`

- Key may be `click` or `@click`; optional leading @ removed.
- Empty names and duplicate normalized names throw.
- Values: function, EventListenerObject, nothing/null/undefined/false.
- Omitted key -> remove listener. Listener-object capture/passive/once/signal supported.
- Function `this`: render host. Same parked/host/once lifecycle as direct listener.
- Keys are literal names: no direct-binding modifiers or keyboard-filter parsing in spread keys.

## Key identity

```typescript
html`${items.map(item => html`<user-row key=${item.id} .user=${item}></user-row>`)}`
```

- A root `key=${value}` is both a rendered attribute and identity input for a mapped TemplateResult array.
- Keys use JS identity, must be unique, and every item must be keyed.
- Duplicate -> throw. Mixed keyed/unkeyed -> warn + position fallback.
- Prefer `repeat(items, { key, render, empty? })` for explicit keyed lists; it passes keys without a key attribute or wrapper.

## Comment interpolation

- `<!-- revision: ${value} -->` updates actual Comment.data.
- nothing/null/undefined -> `''`; otherwise String(value); `noChange` preserves slot.
- Multiple slots supported.
- Result containing `--` or ending `-` throws.
- Inspectable in DOM/serialization: never put secrets in comments.

## Sentinel matrix

| Channel | null/undefined | false | nothing | noChange |
|---|---|---|---|---|
| Node | clear | text | clear | keep |
| Attribute | empty string | `"false"` | remove | keep |
| Property | assign | assign false | assign undefined | keep |
| Boolean/class | remove | remove | remove | keep |
| Style | remove | remove | remove | keep |
| Event | remove | remove | remove | keep |
| Whole spread | clear bag | throw | clear bag | keep |
| Comment | empty text | `"false"` | empty text | keep slot |

## Forms

No implicit DOM-to-state channel. Use a property for state -> DOM and a native event for DOM -> state:

```typescript
html`<input .value=${this.query} @input=${this.updateQuery}>`
html`<input type="checkbox" .checked=${this.accepted} @change=${this.updateAccepted}>`
```

Use `input` for text-as-typed; `change` for committed checkbox/select/file choices. `@property()` reflection is the custom-element property/attribute boundary and does not replace native form events.

## Authoring failures

- Loose opening-tag expression, empty channel name, unknown spread: throw.
- Static text/multiple values in single-expression channel: warn; only first expression consumed.
- Invalid event value/modifier, passive+prevent, invalid spread shape/event bag: throw.
- Invalid comment data: throw.
- In tests/dev, `setStrictRenderErrors(true)` rethrows render errors instead of logging while preserving prior DOM.
