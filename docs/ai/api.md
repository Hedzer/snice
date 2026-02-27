# API Reference

## Class Decorators

```typescript
@element('tag-name', options?: { formAssociated?: boolean }) // Define custom element
@page({ tag, routes, guards?, placard? }) // Define routable page
@controller('name') // Define behavior module
@layout('name') // Define page wrapper
```

## Rendering

```typescript
@render(options?: { debounce?, throttle?, once?, sync?, differential? })
// Returns: TemplateResult from html`...` (or string if differential: false)
// Auto re-renders on property changes
// Supports differential updates by default
// differential: false - disables differential rendering, expects string return
//   Clears shadow root and re-renders from scratch each time
//   <if> and <switch>/<case> NOT available — use ternary operators in string
// once: true - IMPERATIVE RENDERING MODE
//   Renders template once on first connect, blocks all subsequent auto-renders
//   Use with @watch + @query to update DOM manually
//   Property changes fire watchers synchronously but never trigger re-render
//   @query re-queries shadow DOM on each access (no stale refs)
//   Timing: setter → attribute reflect → @watch fires → requestRender blocked
//   Use when: fixed template structure, expensive updates, async coordination

@styles()
// Returns: CSSResult from css`...`
// Scoped to shadow DOM
// Called once during initialization — NOT reactive
// Only one per element (last wins if multiple declared)
// For dynamic styles, use CSS custom properties set in template
```

## Properties

```typescript
@property(options?: { type?, attribute?, converter?, hasChanged? })
// Syncs with attributes, triggers re-render
// Types: String (default), Number, Boolean, Object, Array

@watch(...propertyNames: string[])
// Called on property change: (oldVal, newVal, propertyName) => void
```

## Lifecycle

```typescript
@ready() // After styles + event handlers set up (render is async microtask, may not be complete)
@dispose() // On disconnectedCallback
@moved() // On adoptedCallback
@adopted() // On adoptedCallback
```

## DOM Queries

```typescript
@query(selector: string, options?: { light?: boolean }) // Single element
@queryAll(selector: string, options?: { light?: boolean }) // NodeListOf<Element>
// Default: queries shadow DOM. Use { light: true } in controllers on native elements
```

## Events

**Template syntax:**
```typescript
html`
  <button @click=${handler}>...</button>
  <input @keydown:Enter=${handler} />
  <input @keydown.ctrl+s=${handler} />
  <input .value=${val} ?disabled=${bool} />
`
```

**Decorator:**
```typescript
@on(event: string | string[], selector?: string, options?: OnOptions)
// Works in elements + controllers
// Options: { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive?, target? }
// target: CSS selector for shadow DOM event delegation
// Keyboard: 'keydown:Enter', 'keydown.escape', 'keydown:ctrl+s', 'keydown:~Space'
// Supports both ':' and '.' notation

@dispatch(eventName: string, options?: { debounce?, throttle?, dispatchOnUndefined? })
// Fires CustomEvent after method, detail = return value
// Supports async methods (dispatches after promise resolves)
// dispatchOnUndefined: false (default) — skips dispatch if method returns undefined
```

## Communication

```typescript
@request(channel: string, options?: { timeout?, discoveryTimeout?, debounce?, throttle?, bubbles?, cancelable? })
// Request pattern using async generator syntax
// Method must be async generator that yields payload and receives response
// Returns Promise<T>
// Options:
//   timeout (ms) - response timeout, default 120000 (2 min)
//   discoveryTimeout (ms) - handler discovery timeout, default 50
//   debounce (ms) - debounce requests
//   throttle (ms) - throttle requests
//   bubbles (bool) - event bubbling, default true
//   cancelable (bool) - event cancelable, default false
// Example:
//   @request('fetch-user')
//   async *fetchUser(id: string): any {
//     try {
//       const user = await (yield { id }); // yield = request, await = response
//       return user;
//     } catch (error) {
//       console.error('Failed:', error);
//       throw error;
//     }
//   }
//   // Usage: const user = await this.fetchUser('123');

@respond(channel: string, options?: { debounce?, throttle? })
// Respond to requests from @request decorators
// Method receives payload and returns response
// Works in both elements and controllers
// Only one responder per channel (first wins via stopImmediatePropagation)
// Options:
//   debounce (ms) - debounce responses
//   throttle (ms) - throttle responses
// Example:
//   @respond('fetch-user')
//   async handleFetchUser(payload: { id: string }) {
//     const user = await fetch(`/api/users/${payload.id}`).then(r => r.json());
//     return user;
//   }
```

## Observers

```typescript
@observe(target: string | string[], selector?: string, options?: ObserveOptions)
// target types:
//   'intersection' - IntersectionObserver (viewport visibility)
//   'resize' - ResizeObserver (element size changes)
//   'media:(query)' - MediaQueryList (e.g., 'media:(min-width: 768px)')
//   'mutation:childList' - MutationObserver childList changes
//   'mutation:attributes' - MutationObserver attribute changes
//   'mutation:attributes:name' - Watch specific attribute
// selector: CSS selector for element to observe (optional, defaults to this)
// Auto-cleanup on disconnect
// Example:
//   @observe('mutation:childList', '.content')
//   handleMutation(mutations: MutationRecord[]) { ... }
//   @observe('intersection', '.lazy', { threshold: 0.1 })
//   handleVisible(entries: IntersectionObserverEntry[]) { ... }
```

## Context & Router

```typescript
// Context instance (received via @context decorator)
// ctx.application - AppContext (your app state)
// ctx.navigation - { placards, route, params } (read-only, managed by router)
// ctx.fetch - middleware-aware fetch
// ctx.update() - signal all @context() subscribers (no args, uses current state)

@context(options?: { debounce?, throttle?, once? })
// Method decorator: receives Context on navigation and ctx.update() calls
// Called on: initial load, route change, ctx.update()
// Example:
//   @context() handleContext(ctx: Context) {
//     const app = ctx.application as MyApp;
//     this.user = app.user;
//   }
// To update and signal:
//   ctx.application.theme = 'dark';
//   ctx.update();

Router({ target, context?, layout?, fetcher? })
// Returns: { page, navigate, initialize }
// IMPORTANT: `page` is NOT exported from 'snice'
// It comes from Router() and must be re-exported

// Module structure for multi-page apps:
// router.ts:
export const { page, navigate, initialize } = Router({
  target: '#app',
  context: { user: null, theme: 'light' },
  layout: 'app-shell'
});
// pages import `page` from './router' (not 'snice')
// main.ts imports pages for side-effects, calls initialize()
```

## Fetcher

```typescript
class ContextAwareFetcher implements Fetcher {
  use(type: 'request', middleware: RequestMiddleware): void
  use(type: 'response', middleware: ResponseMiddleware): void
  create(ctx: Context): typeof globalThis.fetch
}

type RequestMiddleware = (
  this: Context,
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>

type ResponseMiddleware = (
  this: Context,
  response: Response,
  next: () => Promise<Response>
) => Promise<Response>
```

**Usage:**
- Create fetcher, add middleware via `.use('request', fn)` and `.use('response', fn)`
- Request middleware runs before fetch, response middleware after
- Middleware `this` bound to Context instance
- Cast `this.application` to your type: `const app = this.application as MyAppContext`
- Pass to Router via `fetcher` option
- Use via `ctx.fetch()` in pages/components
- Optional - defaults to native fetch if not provided
// Example middleware:
//   fetcher.use('request', function(request, next) {
//     const app = this.application as MyAppContext;
//     if (app.user?.token) request.headers.set('Authorization', `Bearer ${app.user.token}`);
//     return next();
//   });
```

## Templates

```typescript
html`...` // TemplateResult
css`...` // CSSResult

// Conditionals
<if ${condition}>...</if>
<case ${value}>
  <when value="x">...</when>
  <default>...</default>
</case>

// Lists
${items.map(i => html`<li>${i}</li>`)}

// Bindings
attr="${val}" // Attribute
.prop="${val}" // Property
?attr="${bool}" // Boolean attribute
@event="${handler}" // Event listener
@event:modifier="${handler}" // With keyboard modifier
```

## Types

```typescript
interface TemplateResult { readonly _$litType$: number; }
interface CSSResult { cssText: string; }
interface OnOptions { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive?, target? }
interface RenderOptions { debounce?, throttle?, once?, sync?, differential? }
interface Layout { update(context, placards, route, params) }
interface Placard { name, title, icon?, description?, order?, show?, visibleOn?, parent?, group?, searchTerms?, hotkeys?, breadcrumbs?, tooltip? }
// Guards: synchronous only, receive context AND params
type Guard<T> = (context: T, params: RouteParams) => boolean
// NO async, NO string redirect - boolean only
// Multiple guards: AND logic, short-circuits on first false
```

## Exports

```typescript
import {
  element, controller, layout,  // NOTE: `page` comes from Router(), not from 'snice'
  property, watch, context,
  render, styles, html, css,
  query, queryAll,
  on, dispatch,
  request, respond,
  observe,
  ready, dispose, moved, adopted,
  Router,
  debounce, throttle, once, memoize,
  useNativeElementControllers    // controller= on native HTML elements (auto-called on load, idempotent)
} from 'snice';
```
