<!-- AI: For the AI-optimized version of this doc, see docs/ai/react-integration.md -->

# React Integration

Snice's React integration lets you build full Snice-powered apps using hooks and JSX — routing, guards, layouts, context — without decorators or custom element classes.

## Installation

Snice's React integration is included in the main package:

```bash
npm install snice
```

```tsx
import { SniceRouter, Route, useSniceContext } from 'snice/react';
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
  mode="hash" | "history"        // URL strategy
  context={{ user, theme, ... }}  // AppContext — passed to guards, pages, layouts
  layout={DefaultLayout}          // Default layout (component or string tag)
  loading={<CustomLoader />}      // Shown during async guards
  fallback={<NotFound />}         // No route match
>
  <Route ... />
</SniceRouter>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `"hash"` \| `"history"` | URL strategy. Hash uses `#/path`, history uses browser pushState. |
| `context` | `object` | Application context passed to guards and available via `useSniceContext()`. |
| `layout` | `Component \| string` | Default layout wrapping all pages. String = Snice web component tag. |
| `loading` | `Component \| string \| JSX` | Shown while async guards are running. |
| `fallback` | `Component \| string \| JSX` | Shown when no route matches. |

## Route

Defines a route within `<SniceRouter>`. Does not render anything — the router reads its props.

```tsx
<Route
  path="/users/:id"
  page={UserPage}              // React component OR string (Snice element tag name)

  guard={fn}                   // (ctx, params) => boolean | Promise<boolean>
  guards={[fn1, fn2]}         // Multiple guards (AND logic)
  guardRedirect="/login"       // Where to go if guard rejects

  layout={DashboardLayout}     // Override router-level layout
  layout={false}               // No layout for this route
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `path` | `string` | URL pattern. Supports dynamic segments: `/users/:id`. |
| `page` | `Component \| string` | What to render. String = Snice web component tag name. |
| `guard` | `function` | Single guard function. |
| `guards` | `function[]` | Multiple guards — all must pass (AND logic). |
| `guardRedirect` | `string` | Redirect path if any guard rejects. |
| `layout` | `Component \| string \| false` | Override the router's default layout. `false` = no layout. |
| `placard` | `Placard` | Page metadata for layouts (navigation, breadcrumbs). |

## Hooks

### useSniceContext()

Returns the full merged context — mirrors Snice's `@context` decorator shape:

```tsx
function UserPage() {
  const ctx = useSniceContext();
  // ctx.application  — your app context
  // ctx.navigation   — { route, params, placards }
  // ctx.navigate     — (path) => void
  return <div>User: {ctx.application.user?.name}</div>;
}
```

### useNavigate()

Convenience hook for programmatic navigation:

```tsx
function LoginButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/dashboard')}>Login</button>;
}
```

### useParams()

Returns current route parameters:

```tsx
// Route: <Route path="/users/:id" page={UserPage} />
function UserPage() {
  const params = useParams(); // { id: "42" }
  return <div>User #{params.id}</div>;
}
```

### useRoute()

Returns the current matched route pattern:

```tsx
function BreadcrumbBar() {
  const route = useRoute(); // "/users/:id"
  return <nav>{route}</nav>;
}
```

### useRequestHandler()

Handle `@request` channels from Snice web components. See [Request/Response docs](./request-response.md#react-userequesthandler).

```tsx
import { useRequestHandler } from 'snice/react/useRequestHandler';

function Dashboard() {
  const ref = useRef(null);
  useRequestHandler(ref, {
    'fetch-user': async (payload) => {
      const res = await fetch(`/api/users/${payload.id}`);
      return res.json();
    },
  });
  return <div ref={ref}><snice-user-card /></div>;
}
```

## Guards

Guards protect routes. Same function signature works in both Snice and React:

```typescript
type Guard = (
  context: AppContext,
  params: Record<string, string>
) => boolean | Promise<boolean>;
```

### Sync Guards

```tsx
const authGuard = (ctx, params) => !!ctx.principal;

<Route path="/settings" page={SettingsPage} guard={authGuard} guardRedirect="/login" />
```

### Async Guards

Async guards show the `loading` component while resolving:

```tsx
const roleGuard = async (ctx, params) => {
  const roles = await fetchUserRoles(ctx.principal.id);
  return roles.includes('admin');
};

<SniceRouter loading={<Spinner />}>
  <Route path="/admin" page={AdminPage} guard={roleGuard} guardRedirect="/forbidden" />
</SniceRouter>
```

### Multiple Guards

All guards must pass (AND logic):

```tsx
<Route
  path="/admin/users/:id"
  page={AdminUserPage}
  guards={[authGuard, roleGuard]}
  guardRedirect="/login"
/>
```

## Layouts

React layouts are components that render `{children}`:

```tsx
function DashboardLayout({ children }) {
  const ctx = useSniceContext();
  return (
    <div className="shell">
      <Sidebar user={ctx.application.user} />
      <main>{children}</main>
    </div>
  );
}
```

Set a default layout on the router:

```tsx
<SniceRouter layout={DashboardLayout}>
  <Route path="/" page={HomePage} />
  <Route path="/login" page={LoginPage} layout={false} />  {/* No layout */}
  <Route path="/reports" page={ReportsPage} layout={ReportsLayout} />  {/* Override */}
</SniceRouter>
```

Snice layouts (string tag) work too:

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

String values for `page`, `layout`, `loading`, and `fallback` are treated as Snice web component tag names. The router creates the element and mounts it.

## Context (Standalone)

`<SniceProvider>` can be used without a router for simpler apps:

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

## Vanilla Snice Comparison

The same concepts in vanilla Snice:

```typescript
const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell',
  context: { user: null, theme: 'dark' },
});

@page({ tag: 'settings-page', routes: ['/settings'], guards: [authGuard] })
class SettingsPage extends HTMLElement { ... }
```

Guards, context shape, and page contracts are identical across both systems.
