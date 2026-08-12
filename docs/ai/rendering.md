# Declarative Rendering Reference

## Authoring

```typescript
@element('my-view')
class MyView extends SniceElement {
  static styles = css`:host { display:block }`;
  static renderOptions = { debounce: 20 };

  @property() userId = '';                 // attr input + reflection
  @property({ reflect: false }) input = ''; // attr input, no output
  @property({ attribute: false }) api!: Api; // JS only
  @state() open = false;                   // reactive, never an attr
  @state({ deep: true }) model = { rows: [] as Row[] };

  render() { return html`...`; }
}
```

- `SniceElement` optional; plain `HTMLElement` + `@render()` / `@styles()` remains supported.
- `SniceElement`: conventional `render()`, static `styles`, static `renderOptions`, kebab implicit attrs, `invalidate()`, `renderNow()`.
- JS property assignment preserves value/type/identity. `type` and `converter.fromAttribute` apply only to string attributes.
- `reflect` defaults true. `reflect:false`: attr→prop only. `attribute:false`: neither direction.
- `@state(options?: { deep?, hasChanged? })`: no attribute channel.
- `deep:true`: nested plain object/array/Map/Set writes; cycles + stable proxies; uses native Proxy/Reflect; no IE; class instances remain intact.

## URL safety

```typescript
isSafeUrl(value: unknown, options?: { allowed?: readonly string[] }): boolean
```

- Template escaping blocks markup injection, not executable URL schemes.
- Defaults: relative references plus absolute/network `http:`, `https:`, `mailto:`, `tel:` URLs.
- Rejects malformed input, raw ASCII controls, and every other explicit scheme.
- `allowed` replaces the absolute/network protocol list; relative references remain allowed.
- `snice-button.href` applies this policy automatically and blocks the entire activation on failure.

## Bindings

Exact per-channel value/removal rules, event grammar, spreads, sentinels, and form data flow: [bindings.md](bindings.md).

```typescript
${value}                       // node
title=${value}                 // attribute
data-x="a ${value}"            // interpolated attribute
.value=${value}                // property
?disabled=${boolean}           // boolean attribute
@click=${handler}              // event
class:active=${boolean}        // one class
style:color=${value}           // one CSS property
style:--token=${value}         // custom property
...props=${object}             // property spread
...attrs=${object}             // attribute spread
...events=${object}            // event spread
```

Event modifiers: `|prevent`, `|stop`, `|immediate`, `|once`, `|capture`, `|passive`, `|self`. Aliases: `preventDefault`, `stopPropagation`, `stopImmediatePropagation`. `passive|prevent` invalid. Keyboard filters: `@keydown.enter`, `@keydown.ctrl+s`, `@keyup.~enter`; dot or colon syntax.

Event/spread handlers accept functions or EventListenerObject; null/false removes. Duplicate normalized spread names are invalid. Parked branches pause listeners; removing a host retains listeners on its retained DOM. Consumed `|once` and `EventListenerObject.once` state is retained.
Prefer direct bindings for known keys. Named spreads are for dynamic or forwarded property/attribute/listener bags and remove stale keys.

## Lists and async values

```typescript
repeat(items, { key, render, empty? })
html`${promise}`
html`${asyncIterable}`
```

- `repeat` requires explicit unique keys, moves existing DOM, and can render an empty state.
- Promise/AsyncIterable values work directly in node expressions; stale replaced sources are ignored.
- Async iterators receive a best-effort `return()` on replacement or disconnect. Promise cancellation stays caller-owned.

## Authoring diagnostics

- Template parse/authoring failures rendered by a Snice element identify the authoritative registered `<tag>` and, when safely available, the class, plus a nearby static-template excerpt when available. Minified CDN constructors may have no class name, so tag-only attribution is expected.
- Context follows nested/iterable/async `TemplateResult` values in open/closed shadow roots and light DOM.
- Host-free preparation stays generic; runtime diagnostics do not invent a source filename or component.
- Contextual errors retain the original error as `cause` (and therefore its stack).

## Control flow

```typescript
<if ${a}>
  A
  <else-if ${b}>B</else-if>
  <else>C</else>
</if>

<case ${value}>
  <when value="string-match">static</when>
  <when ${typedValue}>Object.is match</when>
  <default>fallback</default>
</case>

```

- Virtual tags add no elements.
- if/case branch DOM is parked and restored by identity.
- `repeat` requires keys, moves DOM by key, rejects duplicates, accepts any iterable.

## Render roots

```typescript
@element('x-open')                              // open shadow
@element('x-closed', { shadow: 'closed' })
@element('x-light', { renderRoot: 'light' })
@element('x-light-2', { shadow: false })
@element('x-focus', { delegatesFocus: true })
```

Custom `createRenderRoot()` must return host or ShadowRoot. Styles, queries, events, and reconnect work in all modes; framework queries work with closed roots.
Conflicting `renderRoot`/`shadow` pairs throw. An explicit child root option overrides an inherited root kind.

## Metadata

- `custom-elements.json`
- `vscode.html-custom-data.json`
- `snice/components/custom-elements` declarations
- Commands: `npm run generate:metadata`, `npm run check:metadata`
