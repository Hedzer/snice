# API Reference

## Class Decorators

```typescript
@element('tag-name', options?: {
  formAssociated?: boolean,
  renderRoot?: 'shadow' | 'light',
  shadow?: 'open' | 'closed' | false,
  delegatesFocus?: boolean
}) // Define custom element
@page({ tag, routes, guards?, placard? }) // Ordered string routes; optional { path, order? } tie-break entries
@controller('name') // Define behavior module (required on every controller class)
// Attach: html`<x-el controller=${MyController}></x-el>` (class, preferred; custom + native els)
//         attachController(el, MyController) | el.controller = MyController
//         controller="name" string attr (only channel in raw HTML; still supported everywhere)
// Class binding: reference-deduped, removes controller attr, attr writes ignored while bound
@daemon // Explicitly constructed app-context state/lifecycle object; no name or global registration
@layout('name') // Define page wrapper
```

## Rendering

```typescript
@render(options?: { debounce?, throttle?, once?, sync?, differential? })
// Returns: TemplateResult from html`...` (or string if differential: false)
// Auto re-renders on property changes
// Supports differential updates by default
// differential: false - disables differential rendering, expects string return
//   Clears the managed render root and re-renders from scratch each time
//   Template bindings and virtual control flow are unavailable in string mode
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

await el.rendered
// Resolves after the pending batched/debounced/throttled render commits
// Resolves immediately when no render is pending

setStrictRenderErrors(true)
// Render errors rethrow instead of console.error (default false: log, keep previous DOM)
// Enable in tests/dev so broken templates fail loudly

class SniceElement extends HTMLElement {
  static styles?: CSSResult | CSSResult[]
  static renderOptions?: RenderOptions
  render(): TemplateResult
  invalidate(): Promise<void>
  renderNow(): Promise<void>
}
// Optional convention base: render(), static styles, kebab implicit attrs
```

## Properties

```typescript
@property(options?: { type?, attribute?, reflect?, deep?, converter?, hasChanged? })
// Attribute input + reflection (reflect defaults true), triggers re-render
// type/fromAttribute convert only string attributes; direct JS assignments retain identity
// reflect:false = attr input only; attribute:false = no attr channel
// deep:true = nested plain object/array/Map/Set mutation tracking via Proxy/Reflect
// Types: String, Number, Boolean, Object, Array, Date, BigInt, SimpleArray

@state(options?: { deep?, hasChanged? })
// Reactive internal field; never reads/writes an attribute

@watch(...propertyNames: string[], options?: { immediate?: boolean })
// Fires once on init: (undefined, initialValue, propertyName), then on every change: (oldVal, newVal, propertyName)
// { immediate: false } → change-only, skip the init call (use for event-dispatching watchers)
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
// Options: { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive?, target?, scope?, daemon? }
// target: CSS selector for shadow DOM event delegation
// scope: 'global' | selector | EventTarget | () => EventTarget | null — redirects listener attachment
// Keyboard: 'keydown:Enter', 'keydown.escape', 'keydown:ctrl+s', 'keydown:~Space'
// Supports both ':' and '.' notation

@dispatch(eventName: string, options?: { debounce?, throttle?, dispatchOnUndefined?, scope?, daemon?, ...EventInit })
// Fires CustomEvent after method, detail = return value
// Supports async methods (dispatches after promise resolves)
// dispatchOnUndefined: false — skips when return is undefined; omitted/true still dispatches
// scope: 'global' | selector | EventTarget | () => EventTarget | null — redirects dispatch target
```

**scope option (shared by @on and @dispatch):**
```typescript
// omitted              → host element (default)
// 'global'             → document
// 'app-shell'          → host.closest('app-shell')
// someEl               → that EventTarget
// function             → called with host as `this`; null skips with console.warn

@on('bus:save',     { scope: 'global' })       // document-level listener
@on('bus:added',    { scope: 'cart-shell' })   // ancestor-scoped listener
@dispatch('bus:save',  { scope: 'global' })    // dispatch on document
@dispatch('bus:added', { scope: 'cart-shell' })// dispatch on ancestor
```

## Communication

```typescript
@request(channel: string, options?: { daemon?, timeout?, discoveryTimeout?, debounce?, throttle?, bubbles?, cancelable? })
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

@respond(channel: string, options?: { daemon?, debounce?, throttle? })
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
//     const fetch = getContextFetch(this);
//     if (!fetch) throw new Error('Controller requires context fetch');
//     const user = await fetch(`/api/users/${payload.id}`).then(r => r.json());
//     return user;
//   }
```

Daemon addressing:
```typescript
const release = provideContext(appRoot, { daemons: { session: new SessionDaemon() } });
const context = getContext(elementOrController);
// Consumers use { daemon: 'session' }; daemon methods default to their own private target.
// Provide before connect/attach. Call release() during app/test teardown.
```

Context transport:
```typescript
const release = provideContext(appRoot, appContext, { fetch: appFetch });
const fetch = getContextFetch(elementOrController);
// Router supplies its ContextAwareFetcher-bound Context.fetch automatically.
// AppContext is not mutated with a reserved transport key.
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
// Supported on pages, descendant elements, and attached controllers.
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

## URL Safety

```typescript
isSafeUrl(value: unknown, options?: { allowed?: readonly string[] }): boolean
// URL-sink validation. Relative references are accepted. Default absolute/network
// protocols: http:, https:, mailto:, tel:. Malformed input, raw ASCII controls,
// and every other explicit scheme are rejected. `allowed` replaces the protocol list.
```

## Templates

```typescript
html`...` // TemplateResult
css`...` // CSSResult

// Conditionals
<if ${condition}>
  primary
  <else-if ${other}>other</else-if>
  <else>fallback</else>
</if>
<case ${value}>
  <when value="x">...</when>
  <when ${typedValue}>...</when> // Object.is
  <default>...</default>
</case>

// Lists
${items.map(i => html`<li>${i}</li>`)}
// Keyed: DOM identity follows key on reorder/removal (use for stateful items)
${items.map(i => html`<li key=${i.id}>${i.name}</li>`)}
repeat(items, { key: i => i.id, render: i => html`...`, empty: () => html`...` })

// Bindings
attr="${val}" // Attribute
.prop="${val}" // Property
?attr="${bool}" // Boolean attribute
@event="${handler}" // Event listener
@event:modifier="${handler}" // With keyboard modifier
.value=${live(v)} // Compare against live DOM value (resets user-typed drift)
class:active=${condition} // Single-class toggle
style:color=${color} // Single CSS property
// Prefer direct bindings for known keys; spreads are for dynamic/forwarded bags.
...props=${object} // Named property spread
...attrs=${object} // Named attribute spread
...events=${object} // Named listener spread

// Event behavior modifiers (compose after keyboard filter)
@submit|prevent=${handler}
@click|once|stop=${handler}
@click|self=${handler}
// prevent, stop, immediate, once, capture, passive, self

// Promise and AsyncIterable render directly in node expressions

// Helpers
classMap({ box: true, active: cond }) // → 'box active' (truthy keys)
styleMap({ fontSize: '2rem', '--x': v }) // camelCase→kebab; --props pass through
svg`<circle r=${r}></circle>` // SVG-namespace fragment for use inside <svg>
```

Full references: [rendering.md](rendering.md) for renderer structure and [bindings.md](bindings.md) for exact binding-channel semantics.

## Types

```typescript
interface TemplateResult { readonly _$litType$: number; }
interface CSSResult { cssText: string; }
interface OnOptions { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive?, target?, scope? }
interface DispatchOptions extends EventInit { debounce?, throttle?, dispatchOnUndefined?, scope? }
type OnScope = 'global' | string | EventTarget | ((this: HTMLElement) => EventTarget | null)
interface RenderOptions { debounce?, throttle?, once?, sync?, differential? }
interface PropertyOptions { type?, attribute?, reflect?, deep?, converter?, hasChanged? }
interface StateOptions { deep?, hasChanged? }
interface ElementOptions { formAssociated?, renderRoot?, shadow?, delegatesFocus? }
interface Layout { update(context, placards, route, params) }
interface Placard { name, title, icon?, description?, order?, show?, visibleOn?, parent?, group?, searchTerms?, hotkeys?, breadcrumbs?, tooltip? }
// Guards receive context AND params; may be sync or async
type Guard<T> = (context: T, params: RouteParams) => boolean | Promise<boolean>
// No string redirects
// Multiple guards: AND logic, short-circuits on first false
```

## Exports

```typescript
import {
  element, controller, layout,  // NOTE: `page` comes from Router(), not from 'snice'
  SniceElement, property, state, watch, context,
  render, styles, html, svg, css,
  nothing, unsafeHTML, live, classMap, styleMap, setStrictRenderErrors,
  repeat,
  query, queryAll,
  on, dispatch,
  request, respond,
  observe,
  ready, dispose, moved, adopted,
  Router,
  debounce, throttle, once, memoize,
  attachController, detachController, getController,  // accept class or registry name
  useNativeElementControllers    // controller= on native HTML elements (auto-called on load, idempotent)
} from 'snice';
```
