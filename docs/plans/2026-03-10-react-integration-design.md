# Snice React Integration (Full Parity) — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let React developers build full Snice-powered apps using only hooks and JSX — routing, guards, layouts, context — without decorators or custom element classes.

**Architecture:** React-native implementations of Snice's router, context, guards, and layouts. Purpose-built for React's rendering model while mirroring Snice's API contracts so the same guards, same context shape, and same mental model work in both systems. Source in `src/react/`, built to `dist/react/`, copied to `adapters/react/`. Consumers import from `snice/react`.

**Key constraint:** Snice web component pages and React pages coexist in the same route table. Migration is incremental.

---

## Components & Hooks

| Export | Type | Purpose |
|---|---|---|
| `<SniceRouter>` | Component | Root provider. URL state, route matching, guard execution, layout selection, context. |
| `<Route>` | Component | Route definition. Child of `<SniceRouter>`. |
| `<SniceProvider>` | Component | Context provider (usable standalone without router). |
| `useSniceContext()` | Hook | Merged context: `{ application, navigation, navigate, params, route }` — mirrors `@context`. |
| `useNavigate()` | Hook | Returns `navigate(path)` function. Convenience alias. |
| `useParams()` | Hook | Returns current route params. Convenience alias. |
| `useRoute()` | Hook | Returns current matched route pattern. Convenience alias. |
| `useRequestHandler()` | Hook | Already built. Handles `@request` channels. |

## SniceRouter Props

```tsx
<SniceRouter
  mode="hash" | "history"        // URL strategy
  context={{ user, theme, ... }}  // AppContext — passed to guards, pages, layouts
  layout={DefaultLayout}          // Default layout (component or string tag)
  loading={<CustomLoader />}      // Shown during async guards. String = Snice tag. Default: centered spinner.
  fallback={<NotFound />}         // No route match. String = Snice tag.
>
  <Route ... />
</SniceRouter>
```

## Route Props

```tsx
<Route
  path="/users/:id"
  page={UserPage}              // React component OR string (Snice element tag name)

  guard={fn}                   // (ctx, params) => boolean | Promise<boolean>
  guards={[fn1, fn2]}         // Multiple guards (AND logic)
  guardRedirect="/login"       // Where to go if guard rejects

  layout={DashboardLayout}     // Override router-level layout (component or string tag)
  layout={false}               // No layout for this route
/>
```

`page` accepts either a React component or a string. String = Snice web component tag name; the router creates the element, sets route params as attributes, and mounts it. Component = standard React render.

Same for `layout`, `loading`, `fallback` — string means Snice tag, component/JSX means React.

## Context Shape

Mirrors Snice's `@context` decorator exactly:

```typescript
interface SniceReactContext {
  application: AppContext;       // User-defined app state
  navigation: {
    route: string;              // Current matched route pattern
    params: Record<string, string>;
    placards: Placard[];        // All route metadata
  };
  navigate: (path: string) => void;
  fetch: (url: string, opts?: RequestInit) => Promise<Response>; // If fetcher provided
}
```

## Guards

Same function signature for both Snice and React:

```typescript
type Guard = (
  context: AppContext,
  params: Record<string, string>
) => boolean | Promise<boolean>;
```

- Sync guards resolve immediately
- Async guards show the `loading` component until resolved
- Multiple guards: AND logic (all must pass)
- Failed guard → navigate to `guardRedirect`, or stay on current route if none specified
- `loading` is configured once at `SniceRouter` level (or `Router()` for vanilla Snice)
- Default loading: centered spinner (uses `<snice-spinner>` or equivalent)

### Async guard flow

1. User clicks link / navigate() called
2. Route matched, guards found
3. If any guard is async → show `loading` component immediately
4. All guards resolve → true: render page. false: redirect or stay.
5. Guard throws → treated as false (rejection)

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

Snice layouts (string tag) are mounted and pages inserted via slot.

## Mixed Pages Example

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

## Vanilla Snice Parity

The same concepts in vanilla Snice for comparison:

```typescript
const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell',
  loading: 'my-loader',  // tag name, or omit for default spinner
  context: {
    user: getStoredUser(),
    theme: 'dark',
  } as MyAppContext,
});
```

Guards, context shape, and page contracts are identical across both systems. A guard written for Snice works in React and vice versa.

## What This Does NOT Include

- Page transitions (React devs use framer-motion, etc.)
- SSR support
- Code splitting (React devs use lazy/Suspense as usual)
- Controller decorator equivalent (covered by `useRequestHandler`)
