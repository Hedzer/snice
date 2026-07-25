<!-- AI: For the AI-optimized version of this doc, see docs/ai/utilities.md -->
# Utilities

Small helpers exported from `snice` alongside the decorators.

## Method Decorators

Rate-limit or cache a method without writing the plumbing:

```typescript
import { debounce, throttle, once, memoize } from 'snice';

class SearchBox extends HTMLElement {
  @debounce(300)
  search(term: string) { /* runs 300ms after the last call */ }

  @throttle(100)
  onScroll() { /* runs at most once per 100ms */ }

  @once()
  initialize() { /* runs one time per instance */ }

  @memoize({ maxSize: 50, ttl: 60_000 })
  expensive(id: string) { /* result cached by argument */ }
}
```

| Decorator | Options |
|---|---|
| `@debounce(wait?, options?)` | `leading`, `trailing`, `maxWait` |
| `@throttle(wait?, options?)` | `leading`, `trailing` |
| `@once(perInstance?)` | `perInstance` — once per instance rather than per class |
| `@memoize(options?)` | `keyGenerator`, `maxSize`, `ttl` |

Pending timers are cleared automatically when the element disconnects. Clear
them yourself — in a test, say — with `clearDebounceTimers(instance)`,
`clearThrottleTimers(instance)`, `clearMemoizeCache(instance)`, and
`resetOnce(instance)`.

## Escaping

```typescript
import { escapeHtml, escapeAttr } from 'snice';

escapeHtml(value);   // text destined for markup
escapeAttr(value);   // text destined for an attribute value
```

Template bindings escape for you; reach for these only when assembling markup
by hand — see [Binding Channels](./bindings.md).

## Durations

```typescript
import { parseDuration } from 'snice';

parseDuration('150ms');
parseDuration('1.5s');
```

Parses a CSS-style duration string, so a component can accept `"200ms"` from an
attribute and get a number back.

## Scroll Locking

Used by overlay components (modal, drawer) to stop the page scrolling behind
them. The lock is reference counted, so nested overlays release correctly:

```typescript
import { lockBodyScroll, unlockBodyScroll, getBodyScrollLockCount } from 'snice';

lockBodyScroll();
unlockBodyScroll();
getBodyScrollLockCount();   // 0 when nothing holds the lock
```

Always pair a lock with an unlock — usually `@ready` / `@dispose`.

## Controllers

```typescript
import { attachController, detachController, getController } from 'snice';

await attachController(element, MyController);
getController(element);            // the attached instance, or undefined
await detachController(element);
```

Native elements pick up `controller="name"` automatically in the browser;
`useNativeElementControllers()` exists to enable that manually in environments
where it is not auto-started. See [Controllers](./controllers.md).

## Debugging

```typescript
import { trackRenders } from 'snice';

trackRenders(element);   // logs each render pass for this element
```
