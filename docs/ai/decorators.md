# Decorators

## Class
- `@element('tag-name', options?)` - Custom element. Options: `{ formAssociated?: boolean }`
- `@page({ tag, routes, guards?, placard? })` - Routable page
- `@controller('name')` - Swappable behavior
- `@layout('tag-name')` - Page wrapper for routing system

## Rendering
- `@render()` - Template method, returns `html\`...\``
- `@render({ once: true })` - Imperative mode: render once, update via `@watch` + `@query`
- `@styles()` - Scoped CSS, returns `css\`...\``. Only one per element (last wins).

## Properties
- `@property({ type?, attribute?: string|boolean, converter?, hasChanged? })` - Reactive, syncs attrs. Initial defaults NOT reflected to attrs.
- `@watch('propName')` - React to changes: `(oldVal, newVal, propertyName) => void`

## Lifecycle
- `@ready()` - After first render. Fires once.
- `@reconnect()` - On every connect AFTER the first. Use only when the component wires its own long-lived global subscription in `@ready` (e.g. `document.addEventListener` for outside-click) and tears it down in `@dispose`. Framework-managed handlers (`@on`, `@observe`, `@respond`, `@context`) are re-established automatically — `@reconnect` is for things the framework doesn't track.
- `@dispose()` - Cleanup on every disconnect.
- `@moved()` - When `Element.prototype.moveBefore()` is used. No connect/disconnect cycle fires; framework handlers stay attached.
- `@adopted()` - When the element is adopted into a different document.

## DOM
- `@query('selector', { light? })` - Single element. `{ light: true }` for controllers on native elements
- `@queryAll('selector', { light? })` - NodeList

## Events
- `@on('event', 'selector?')` - Delegation, auto-bound
- `@dispatch('event-name', options?)` - Emit CustomEvent, detail = return value. Supports async. Options: `{ debounce?, throttle?, dispatchOnUndefined? }`

## Communication
- `@request(channel, options?)` - Async generator request pattern
- `@respond(channel, options?)` - Handle requests from `@request`
- `@context(options?)` - Receive router context. Works on **methods** (called with `(ctx: Context)` on each change) AND **fields** (overwritten with the live `Context` on each change), on **elements and controllers**. Populated before the first render — never `undefined` in the initial template.

```ts
@context() ctx!: Context;            // field: read this.ctx in render()
@context() onCtx(ctx: Context) {}    // method: react to each change
```

## Observers
- `@observe(target, selector?, options?)` - Watch intersection, resize, media query, mutation
  - `'intersection'` - Viewport visibility (IntersectionObserver)
  - `'resize'` - Element size changes (ResizeObserver)
  - `'media:(query)'` - Media query changes (e.g., `'media:(min-width: 768px)'`)
  - `'mutation:childList'` - DOM child changes (MutationObserver)
  - `'mutation:attributes'` - Attribute changes
  - `'mutation:attributes:name'` - Watch specific attribute

## Utility Method Decorators
- `@debounce(wait?, { leading?, trailing?, maxWait? })` - Delay execution until calls stop
- `@throttle(wait?, { leading?, trailing? })` - Limit calls to once per interval
- `@once(perInstance?)` - Execute method only once
- `@memoize({ keyGenerator?, maxSize?, ttl? })` - Cache return values

## Template Bindings
```
attr="${val}"     - String attribute
.prop=${val}      - Property (objects, arrays)
?attr=${bool}     - Boolean attr (adds/removes)
@event=${fn}      - Event listener (auto-bound)
```

## Event Modifiers
```
@keydown:Enter=${fn}    - Key filter
@keydown.ctrl+s=${fn}   - Key combo
@click.once=${fn}       - Fire once
```
