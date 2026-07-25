# Utilities

Human reference: docs/utilities.md

## Method decorators

```typescript
@debounce(wait?, { leading?, trailing?, maxWait? })
@throttle(wait?, { leading?, trailing? })
@once(perInstance?)
@memoize({ keyGenerator?, maxSize?, ttl? })
```

- Timers cleared automatically on disconnect
- Manual reset: `clearDebounceTimers(instance)`, `clearThrottleTimers(instance)`, `clearMemoizeCache(instance)`, `resetOnce(instance)`

## Escaping

```typescript
escapeHtml(value)   // text into markup
escapeAttr(value)   // text into an attribute value
```

Template bindings escape already; use these only for hand-assembled markup. See bindings.md.

## Durations

```typescript
parseDuration('150ms') | parseDuration('1.5s')   // CSS duration string -> number
```

## Scroll lock

```typescript
lockBodyScroll() | unlockBodyScroll() | getBodyScrollLockCount()
```

- Reference counted; nested overlays release correctly
- Always pair lock/unlock (`@ready` / `@dispose`)

## Controllers

```typescript
await attachController(element, MyControllerOrName)
getController(element)      // instance | undefined
await detachController(element)
useNativeElementControllers()   // manual enable; auto-started in browsers
```

See controllers.md.

## Debug

```typescript
trackRenders(element)   // log each render pass
```
