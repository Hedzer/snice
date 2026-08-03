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

Receives context updates from the router; called on navigation and on `ctx.update()`.

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
  routes: string[];                  // route patterns
  transition?: Transition;           // page-specific transition
  guards?: Guard | Guard[];          // route guards
  layout?: string | false;           // layout tag, or false to disable
  placard?: Placard | ((ctx: AppContext) => Placard);  // page metadata — see docs/ai/placards.md
}
```

- Multiple routes: `routes: ['/user', '/users', '/profile']` — all resolve to the same page.
- Route params: `:name` segments inside a route pattern (see Route Parameters below).

## Navigation

- Hash: `` html`<a href="#/about">About</a>` `` — programmatic: `navigate('/about')`.
- Pushstate: `` html`<a href="/about">About</a>` `` — programmatic: `navigate('/about')` (router created with `type: 'pushstate'`).
- Back/forward — plain browser APIs, no router wrapper: `window.history.back()`, `window.history.forward()`, `window.history.go(-2)`.

## Route parameters

- `:param` segments in `routes` auto-map to `@property()` fields of the same name on the page element, set before `@ready()` fires.
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
  register: (route: string, tag: string, transition?: Transition, guards?: Guard | Guard[]) => void;
}
```

- `navigate(path: string): Promise<void>` — navigates to `path`; uses hash or pushstate depending on router `type`.
- `initialize(): void` — starts listening for route changes; must be called after all pages are defined.
- Do not add `@element` to an `@page` class. The Router-returned page decorator
  already registers the custom element and applies Snice element behavior.
- `register(route: string, tag: string, transition?: Transition, guards?: Guard | Guard[], layout?: string | false, placard?: Placard | ((ctx: AppContext) => Placard)): void` — manually registers a route without the `@page` decorator. Note: the return-type shape above lists `register` with 4 params; this fuller 6-param signature (adding `layout`, `placard`) is documented separately in the source.
