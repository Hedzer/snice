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
- `@watch('propName')` - Fires once on init as `(undefined, initialValue, propertyName)`, then on every change: `(oldVal, newVal, propertyName) => void`.
- `@watch('propName', { immediate: false })` - Change-only; skips the init call (use for watchers that dispatch events). Options object is the last arg (works with multiple names).

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
- `@on('event', 'selector?', options?)` - Delegation, auto-bound. Options: `{ capture?, once?, passive?, preventDefault?, stopPropagation?, debounce?, throttle?, scope? }`
- `@dispatch('event-name', options?)` - Emit CustomEvent, detail = return value. Supports async. Options: `{ debounce?, throttle?, dispatchOnUndefined?, scope?, ...EventInit }`

### scope (on both `@on` and `@dispatch`)

Redirects where the listener is attached / event is dispatched. Default: host element.

```ts
scope?: 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null)
```

| value | resolves to |
|---|---|
| omitted | host element |
| `'global'` | `document` |
| selector string | `host.closest(selector)` — nearest ancestor |
| Element / EventTarget | that node |
| resolver fn | called with host as `this`; `null` skips |

```ts
@on('bus:save', { scope: 'global' }) onSave(e) {}
@on('bus:cart-added', { scope: 'cart-shell' }) onAdd(e) {}
@on('go', { scope: someEl }) onGo(e) {}
@on('beep', { scope() { return this.closest('app-shell'); } }) onBeep(e) {}

@dispatch('bus:cart-added', { scope: 'global' }) add(id) { return { id }; }
@dispatch('bus:x', { scope: 'cart-shell' }) fire() { return 1; }
```

Unresolved scope → `console.warn`, listener not attached / event not dispatched.
Resolver re-runs on reconnect — listeners track DOM moves.

## Communication
- `@request(channel, options?)` - Async generator request pattern
- `@respond(channel, options?)` - Handle requests from `@request`
- `@context(options?)` - Receive router navigation context updates

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

## Event Modifiers (keyboard only)
Template dotted/colon modifiers apply ONLY to keydown/keyup/keypress — they are
key filters, not general event options. A dot in any other event name is part of
the event name (e.g. `@app.ready`).
```
@keydown:Enter=${fn}    - Key filter
@keydown.ctrl+s=${fn}   - Key combo
@keydown.~enter=${fn}   - Key, any modifiers
```
`once` / `preventDefault` / `stopPropagation` / `capture` are NOT template
modifiers — use the `@on` decorator's options object:
```typescript
@on('click', { once: true, preventDefault: true, stopPropagation: true })
handleClick(e: Event) {}
```
