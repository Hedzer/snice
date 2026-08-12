# Routing

Human reference: docs/routing.md

Guards, layouts, and page transitions: guards-and-layouts.md

## Setup

```typescript
import { Router } from 'snice';

const router = Router({ target: '#app', type: 'hash' }); // type is REQUIRED: 'hash' | 'pushstate'
const { page, initialize, navigate } = router;
```

**`page` comes from the `Router()` return value — it is NOT exported from `'snice'`.** Re-export it from a router module and import pages from there, not from `'snice'`.

### RouterOptions

```typescript
interface RouterOptions {
  target: string;                    // target element selector (required)
  type: 'hash' | 'pushstate';        // required
  window?: Window;                   // override window object (testing)
  document?: Document;               // override document object (testing)
  transition?: Transition;           // global transition config
  layout?: string;                   // default layout tag for all pages
  context?: any;                     // app context; may expose daemons
  fetcher?: Fetcher;                 // optional fetch middleware — see docs/ai/fetcher.md
}
```

### Router context

Plain object/class instance passed as `context`, shared across all pages and layouts:

```typescript
class AppContext {
  user: User | null = null;
  theme: 'light' | 'dark' = 'light';
  setUser(user: User) { this.user = user; }
  getUser() { return this.user; }
}

const { page, initialize } = Router({ target: '#app', type: 'hash', context: new AppContext() });
```

Router also provides the raw app context beneath `target`, using the same
`provideContext()` mechanism available to non-router applications. Explicitly
constructed `@daemon` instances may be addressed through `context.daemons`:

```typescript
const session = new SessionDaemon();
Router({
  target: '#app',
  type: 'hash',
  context: { daemons: { session } }
});
```

The same boundary supplies the full Router `Context` to `@context()` methods on
descendant elements and attached controllers. They use `ctx.fetch` with the
configured request/response middleware without importing the router or adding
a reserved field to the application context. `getContextFetch()` is the
lower-level transport-only lookup for explicit non-router providers.

### Module structure (avoids circular imports)

```typescript
// router.ts
export const { page, navigate, initialize } = Router({ target: '#app', type: 'hash', context: new AppContext() });

// main.ts
import './pages/home-page';       // side-effect imports register pages
import { initialize } from './router';
initialize();

// pages/home-page.ts
import { page } from '../router'; // NOT from 'snice'
```

## Page components

```typescript
import { render, html, styles, css } from 'snice';
import { page } from './router';

@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  @render() renderContent() { return html`<h1>Welcome Home</h1>`; }
  @styles() homeStyles() { return css`.home { padding: 20px; }`; }
}
```

### `@context()` — method decorator

Receives context updates from the router on pages, descendant elements, and
attached controllers; called on navigation and on `ctx.update()`.

```typescript
@context(options?: { debounce?: number; throttle?: number; once?: boolean })
```

- No options: called immediately on every navigation.
- `debounce: N` — wait N ms after the last update before calling (expensive ops).
- `throttle: N` — call at most once per N ms (frequent updates, e.g. animation).
- `once: true` — call once, then unregister (one-time init).

```typescript
@page({ tag: 'profile-page', routes: ['/profile'] })
class ProfilePage extends HTMLElement {
  private appContext?: AppContext;
  @context()
  handleContextUpdate(ctx: Context) {
    this.appContext = ctx.application;
    this.requestRender();
  }
  @render() renderContent() { /* ... */ }
}
```

### Context object

```typescript
interface Context {
  application: AppContext;              // your router context
  navigation: {
    placards: Placard[];                // all page placards
    route: string;                      // current path, e.g. '/users/123'
    params: Record<string, string>;     // route parameters
  };
  fetch: typeof globalThis.fetch;       // middleware-aware fetch
  update(): void;                       // signal all @context subscribers
}
```

- Router auto-calls `@context()` subscribers on navigation.
- Call `ctx.update()` manually only when mutating application state **outside** navigation (login, logout, theme change, etc.) — navigation already signals subscribers.

```typescript
changeTheme(theme: 'light' | 'dark') {
  this.ctx!.application.theme = theme;
  this.ctx!.update();
}
```

## Route configuration

### `@page` decorator — `PageOptions`

```typescript
interface PageOptions {
  tag: string;                       // custom element tag name
  routes: Array<string | {           // strings are the normal form
    path: string;
    order?: number;                  // lower wins on a specificity tie
  }>;
  transition?: Transition;           // page-specific transition
  guards?: Guard | Guard[];          // route guards
  layout?: string | false;           // layout tag, or false to disable
  placard?: Placard | ((ctx: AppContext) => Placard);  // page metadata — see docs/ai/placards.md
}
```

- Multiple routes: `routes: ['/user', '/users', '/profile']` — all resolve to the same page.
- Route params: `:name` segments inside a route pattern (see Route Parameters below).
- Routes are sorted by specificity first. When specificity ties, string entries
  keep registration order, including their order in one `routes` array.
- Object notation is optional. Use `{ path, order }` only for an explicit tie-break
  across registrations; lower `order` values match first. Equal or omitted values
  still preserve registration order.

```typescript
@page({
  tag: 'work-orders-page',
  routes: ['/work-orders?status=:status', '/work-orders']
})
class WorkOrdersPage extends HTMLElement {}

@page({
  tag: 'override-page',
  routes: [{ path: '/:section/:item', order: -10 }]
})
class OverridePage extends HTMLElement {}
```

## Navigation

- Hash: `` html`<a href="#/about">About</a>` `` — programmatic: `navigate('/about')`.
- Pushstate: `` html`<a href="/about">About</a>` `` — programmatic: `navigate('/about')` (router created with `type: 'pushstate'`).
- Back/forward — plain browser APIs, no router wrapper: `window.history.back()`, `window.history.forward()`, `window.history.go(-2)`.

## Route parameters

- Named `:param` segments and named splats (`*path`, including optional splats) in string routes and `{ path, order }` routes bind through attributes before `@ready()` fires; normally declare a plain `@property()` field of the same name.
- The route-param spelling must match the observed attribute after HTML lowercasing. `HTMLElement`: `:articleId` -> plain `articleId` (`articleid`). `SniceElement`: plain `articleId` observes `article-id`, so use `:article-id` or `@property({ attribute: 'articleId' }) articleId`.
- Explicit alias: `@property({ attribute: 'article-id' }) articleId` binds from `:article-id`, not `:articleId`.
- `@property({ attribute: false })` opts OUT — Router cannot set it, so it silently keeps its initializer.
- A reflected native HTMLElement attribute such as `id` is already a binding target. A custom element can also consume a statically declared `observedAttributes` entry in `attributeChangedCallback`; do not redeclare native IDL properties merely to satisfy the analyzer.
- A subclass field, accessor, or `@state()` member shadows an inherited `@property()` of the same JavaScript name, so it is not an inherited route binding target.
- Multiple `:param`s all populate independently, e.g. `/posts/:postId/comments/:commentId` → `postId`, `commentId` properties.
- Query params: declare directly in the route pattern, e.g. `routes: ['/search?q=:query']` — extracted as a route param (`ctx.navigation.params.query`), not parsed from `location.search`.

## Advanced patterns

- **Lazy loading**: `@ready()` async-loads via dynamic `import()`, toggles a `loaded` property; `@render()` branches on `loaded`.
- **Nested routing**: one page registers multiple route patterns (`routes: ['/settings', '/settings/:section']`), maps `:section` to a `@property()`, and switches internal content with `<case>`/`<when>`.
- **Route-based data loading**: `@ready()` does the initial fetch; `@watch('productId')` re-fetches when the route param changes.
- **Breadcrumbs**: set via `placard: { name, title, breadcrumbs: [...] }` on `@page` — consumed by a layout (see docs/ai/placards.md).
- **404 / catch-all**: `routes: ['/404', '*']` — `'*'` is the catch-all route pattern.
- **Protected route pattern**: guard checks `ctx.isAuthenticated()`, sets `window.location.hash = '#/login'` and returns `false` on failure; login page receives `ctx` via `@context()`, mutates `appContext` (e.g. `setUser()`), then navigates via `window.location.hash = '#/dashboard'`.

## Router API reference

```typescript
function Router(options: RouterOptions): {
  page: (pageOptions: PageOptions) => ClassDecorator;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard | Guard[], layout?: string | false, placard?: Placard | ((ctx: AppContext) => Placard), order?: number) => void;
}
```

- `navigate(path: string): Promise<void>` — navigates to `path`; uses hash or pushstate depending on router `type`.
- `initialize(): void` — starts listening for route changes; must be called after all pages are defined.
- Do not add `@element` to an `@page` class. The Router-returned page decorator
  already registers the custom element and applies Snice element behavior.
- `register(route, tag, transition?, guards?, layout?, placard?, order?): void` — manually registers a route without `@page`. Lower `order` values win only after specificity ties; omitted/equal order preserves registration order.
