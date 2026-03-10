<!-- AI: For the AI-optimized version of this doc, see docs/ai/react-integration.md -->

# React Integration

Snice's React integration lets you build full Snice-powered apps using hooks and JSX — routing, guards, layouts, context — without decorators or custom element classes.

React pages and Snice web component pages coexist in the same route table. Migration is incremental.

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [SniceRouter](#snicerouter)
- [Route](#route)
- [Hooks](#hooks)
  - [useSniceContext](#usesnicecontext)
  - [useNavigate](#usenavigate)
  - [useParams](#useparams)
  - [useRoute](#useroute)
  - [useRequestHandler](#userequesthandler)
- [Guards](#guards)
- [Layouts](#layouts)
- [Mixed Pages](#mixed-pages)
- [Context (Standalone)](#context-standalone)
- [Context Shape Reference](#context-shape-reference)
- [Vanilla Snice Comparison](#vanilla-snice-comparison)
- [Behavior Notes](#behavior-notes)

## Installation

Snice's React integration is included in the main package:

```bash
npm install snice
```

Everything imports from `snice/react`:

```tsx
import {
  SniceRouter,
  Route,
  SniceProvider,
  useSniceContext,
  useNavigate,
  useParams,
  useRoute,
  useRequestHandler,
} from 'snice/react';
```

You can also deep-import individual modules:

```tsx
import { useRequestHandler } from 'snice/react/useRequestHandler';
```

### TypeScript Types

```tsx
import type {
  SniceReactContext,
  SniceRouterProps,
  RouteProps,
  SniceProviderProps,
  Placard,
  UseRequestRouteMap,
  UseRequestHandlerOptions,
} from 'snice/react';
```

## Quick Start

```tsx
import { SniceRouter, Route } from 'snice/react';

function App() {
  return (
    <SniceRouter mode="hash" context={{ user: null, theme: 'dark' }}>
      <Route path="/" page={HomePage} />
      <Route path="/about" page={AboutPage} />
    </SniceRouter>
  );
}

function HomePage() {
  return <h1>Welcome</h1>;
}

function AboutPage() {
  return <h1>About</h1>;
}
```

## SniceRouter

The root provider component. Manages URL state, route matching, guard execution, layout selection, and context propagation.

```tsx
<SniceRouter
  mode="hash"
  context={{ user, theme: 'dark' }}
  layout={DefaultLayout}
  loading={<Spinner />}
  fallback={<NotFound />}
>
  <Route ... />
</SniceRouter>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `"hash"` \| `"history"` | *required* | URL strategy. Hash uses `#/path`, history uses browser pushState. |
| `context` | `object` | `{}` | Application context passed to guards and available via `useSniceContext()`. |
| `layout` | `Component \| string` | none | Default layout wrapping all pages. String = Snice web component tag. |
| `loading` | `Component \| string \| JSX` | centered spinner | Shown while async guards are running. |
| `fallback` | `Component \| string \| JSX` | "404 — Page not found" | Shown when no route matches. |

For `layout`, `loading`, and `fallback`: pass a React component, a Snice web component tag name (string), or raw JSX.

## Route

Defines a route within `<SniceRouter>`. The `<Route>` component itself renders nothing — `SniceRouter` reads its props to build the route table.

```tsx
<Route
  path="/users/:id"
  page={UserPage}

  guard={authGuard}
  guardRedirect="/login"

  layout={DashboardLayout}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `path` | `string` | URL pattern. Supports dynamic segments: `/users/:id`, `/posts/:slug`. |
| `page` | `Component \| string` | What to render. React component receives route params as props. String = Snice web component tag name (params set as attributes). |
| `guard` | `(ctx, params) => boolean \| Promise<boolean>` | Single guard function. |
| `guards` | `function[]` | Multiple guards — all must pass (AND logic). |
| `guardRedirect` | `string` | Redirect path if any guard rejects. Without this, the router renders nothing on rejection. |
| `layout` | `Component \| string \| false` | Override the router's default layout. `false` = explicitly no layout. |
| `placard` | `Placard` | Page metadata for layouts — navigation titles, icons, breadcrumbs. Import `Placard` type from `snice/react`. |

## Hooks

### useSniceContext()

Returns the full merged context. Mirrors the shape of Snice's `@context` decorator:

```tsx
import { useSniceContext } from 'snice/react';

function UserPage() {
  const ctx = useSniceContext();

  // ctx.application  — your context object (whatever you passed to SniceRouter)
  // ctx.navigation.route   — matched route pattern, e.g., "/users/:id"
  // ctx.navigation.params  — route params, e.g., { id: "42" }
  // ctx.navigation.placards — all registered placards
  // ctx.navigate    — (path: string) => void
  // ctx.fetch       — fetch function (if provided to SniceProvider)

  return <div>User: {ctx.application.user?.name}</div>;
}
```

Must be used inside `<SniceRouter>` or `<SniceProvider>`. Throws if used outside.

### useNavigate()

Convenience hook for programmatic navigation:

```tsx
import { useNavigate } from 'snice/react';

function LoginButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>;
}
```

### useParams()

Returns current route parameters. Shortcut for `useSniceContext().navigation.params`:

```tsx
import { useParams } from 'snice/react';

// Route: <Route path="/users/:id" page={UserPage} />
function UserPage() {
  const params = useParams(); // { id: "42" }
  return <div>User #{params.id}</div>;
}
```

Note: React page components also receive params directly as props (e.g., `function UserPage({ id }) { ... }`), so `useParams()` is optional if you prefer the props pattern.

### useRoute()

Returns the current matched route pattern string:

```tsx
import { useRoute } from 'snice/react';

function ActiveIndicator() {
  const route = useRoute(); // "/users/:id"
  return <span>{route}</span>;
}
```

### useRequestHandler()

Handle `@request` channels from Snice web components in React. This is how React code responds to requests from Snice elements that use the `@request` decorator.

**Why:** Snice elements make requests via `@request('channel-name')`. Normally a `@respond` controller handles these. `useRequestHandler` lets React components be the responder — no controller class needed.

```tsx
import { useRef } from 'react';
import { useRequestHandler } from 'snice/react';

function Dashboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useRequestHandler(containerRef, {
    'fetch-user': async (payload) => {
      const res = await fetch(`/api/users/${payload.id}`);
      return res.json();
    },
    'save-settings': async (payload) => {
      await fetch('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
      return { ok: true };
    },
  });

  return (
    <div ref={containerRef}>
      <snice-user-card />
      <snice-settings-panel />
    </div>
  );
}
```

#### Global Handler

Pass `null` as the ref to listen on `document` (catches all bubbling requests):

```tsx
function GlobalProvider({ children }) {
  useRequestHandler(null, {
    'fetch-config': async () => ({ theme: 'dark', locale: 'en' }),
  });

  return <>{children}</>;
}
```

#### Options

```tsx
useRequestHandler(ref, routes, { passive: true });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `passive` | `boolean` | `false` | When `true`, doesn't stop event propagation. Allows multiple handlers to observe the same request (only one can respond). |

#### Behavior

- Route callbacks always use the latest version (ref-stable) — **no `useCallback` needed**
- Listeners re-attach only when the set of channel names changes
- Cleanup happens automatically on unmount

## Guards

Guards protect routes. The same function signature works in both Snice and React:

```typescript
type Guard = (
  context: Record<string, any>,    // your context object
  params: Record<string, string>   // route params
) => boolean | Promise<boolean>;
```

### Sync Guards

```tsx
const authGuard = (ctx, params) => !!ctx.user;

<Route path="/settings" page={SettingsPage} guard={authGuard} guardRedirect="/login" />
```

### Async Guards

Async guards show the `loading` component while resolving:

```tsx
const roleGuard = async (ctx, params) => {
  const roles = await fetchUserRoles(ctx.user.id);
  return roles.includes('admin');
};

<SniceRouter loading={<Spinner />}>
  <Route path="/admin" page={AdminPage} guard={roleGuard} guardRedirect="/forbidden" />
</SniceRouter>
```

If no `loading` prop is set, a default centered spinner is shown.

### Multiple Guards

All guards must pass (AND logic). They run sequentially — first failure short-circuits:

```tsx
<Route
  path="/admin/users/:id"
  page={AdminUserPage}
  guards={[authGuard, roleGuard]}
  guardRedirect="/login"
/>
```

### Guard Failure

When a guard returns `false` (or rejects):
1. If `guardRedirect` is set → navigate to that path
2. If no `guardRedirect` → render nothing (blank)

Guard errors (thrown exceptions) are treated as rejection.

### Sharing Guards

Guards are plain functions. The same guard works in both vanilla Snice and React:

```typescript
// guards.ts — shared between vanilla and React
export const isAuthenticated = (ctx, params) => !!ctx.user;
export const isAdmin = (ctx, params) => ctx.user?.role === 'admin';
export const hasPermission = (permission) => (ctx, params) =>
  ctx.user?.permissions?.includes(permission);
```

## Layouts

React layouts are components that render `{children}`:

```tsx
function DashboardLayout({ children }) {
  const ctx = useSniceContext();
  return (
    <div className="dashboard">
      <Sidebar user={ctx.application.user} />
      <main>{children}</main>
    </div>
  );
}
```

### Default Layout

Set on the router — wraps all pages by default:

```tsx
<SniceRouter layout={DashboardLayout}>
  <Route path="/" page={HomePage} />
  <Route path="/users/:id" page={UserPage} />
</SniceRouter>
```

### Per-Route Override

Override the default layout for specific routes:

```tsx
<SniceRouter layout={DashboardLayout}>
  <Route path="/" page={HomePage} />
  <Route path="/reports" page={ReportsPage} layout={ReportsLayout} />
  <Route path="/login" page={LoginPage} layout={false} />
</SniceRouter>
```

- `layout={ReportsLayout}` — use a different layout
- `layout={false}` — explicitly no layout (e.g., login page)

### Snice Layouts

Pass a string to use a Snice web component as the layout:

```tsx
<Route path="/legacy" page="legacy-page" layout="legacy-layout" />
```

## Mixed Pages

Snice web component pages and React pages coexist in the same route table:

```tsx
function App() {
  return (
    <SniceRouter mode="hash" context={{ user, theme: 'dark' }} layout={AppShell}>
      {/* React pages */}
      <Route path="/" page={HomePage} />
      <Route path="/settings" page={SettingsPage} guard={authGuard} guardRedirect="/login" />

      {/* Snice web component pages */}
      <Route path="/legacy" page="legacy-dashboard" />
      <Route path="/reports" page="report-page" layout="report-layout" />

      {/* No layout */}
      <Route path="/login" page={LoginPage} layout={false} />
    </SniceRouter>
  );
}
```

When `page` is a string, the router creates the web component element and sets route params as attributes. When `page` is a React component, params are passed as props.

The same string-or-component pattern works for `layout`, `loading`, and `fallback`.

## Context (Standalone)

`<SniceProvider>` can be used without a router for simpler apps that just need shared context:

```tsx
import { SniceProvider, useSniceContext } from 'snice/react';

function App() {
  return (
    <SniceProvider context={{ user: currentUser, theme: 'dark' }}>
      <MyComponent />
    </SniceProvider>
  );
}

function MyComponent() {
  const ctx = useSniceContext();
  return <div>Theme: {ctx.application.theme}</div>;
}
```

### SniceProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `context` | `object` | `{}` | Application context. |
| `navigate` | `(path: string) => void` | no-op | Navigation function. |
| `route` | `string` | `""` | Current route pattern. |
| `params` | `Record<string, string>` | `{}` | Current route params. |
| `placards` | `Placard[]` | `[]` | Registered placards. |
| `fetch` | `typeof fetch` | none | Optional context-aware fetch function. |

When used inside `<SniceRouter>`, these props are set automatically. Use `<SniceProvider>` directly only when you don't need routing.

## Context Shape Reference

`useSniceContext()` returns a `SniceReactContext` object:

```typescript
interface SniceReactContext {
  /** Your application context (whatever you passed to context={}) */
  application: Record<string, any>;

  /** Navigation state */
  navigation: {
    route: string;                    // matched route pattern, e.g., "/users/:id"
    params: Record<string, string>;   // route params, e.g., { id: "42" }
    placards: Placard[];              // all registered placards
  };

  /** Programmatic navigation */
  navigate: (path: string) => void;

  /** Context-aware fetch (if provided to SniceProvider) */
  fetch?: typeof globalThis.fetch;
}
```

This mirrors the shape of Snice's vanilla `Context` class used by the `@context` decorator.

## Vanilla Snice Comparison

| Concept | Vanilla Snice | React |
|---------|--------------|-------|
| Router setup | `Router({ target, type: 'hash', layout, context })` | `<SniceRouter mode="hash" layout={...} context={...}>` |
| Page definition | `@page({ tag, routes, guards })` | `<Route path="..." page={...} guard={...} />` |
| Navigation | `navigate('/path')` | `const nav = useNavigate(); nav('/path')` |
| Context access | `@context() handleCtx(ctx) { ... }` | `const ctx = useSniceContext()` |
| Request handling | `@respond('channel')` controller | `useRequestHandler(ref, { 'channel': handler })` |
| Guards | `(ctx, params) => boolean \| Promise<boolean>` | Same — shared functions work in both |
| Layouts | `@layout('tag') class ... { }` | `function Layout({ children }) { ... }` |

Guards, context shape, and page contracts are identical across both systems. A guard written for vanilla Snice works in React and vice versa.

## Behavior Notes

**Guards run on navigation, not on context change.** If your context changes (e.g., user logs out), guards on the current route are not re-evaluated until the next navigation. This matches standard router behavior.

**Route params as props.** React page components receive the matched route params directly as props: `<Route path="/users/:id" page={UserPage} />` means `UserPage` gets `{ id: "42" }` as props. You can also access them via `useParams()`.

**Route matching uses [pica-route](https://www.npmjs.com/package/pica-route)** — the same library as vanilla Snice's router. Routes are sorted by specificity (longest path first), so `/users/:id` takes priority over `/users`.

**Default loading.** If no `loading` prop is provided, async guards show a simple centered CSS spinner. Pass your own `loading` component/JSX to customize it.
