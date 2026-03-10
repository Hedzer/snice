# React Integration

Source: `src/react/` → Build: `dist/react/` → Published: `adapters/react/`
Import: `import { SniceRouter, Route, useSniceContext } from 'snice/react'`
Deep import: `import { useRequestHandler } from 'snice/react/useRequestHandler'`

## Components

| Export | Type | Purpose |
|---|---|---|
| `<SniceRouter>` | Component | Root provider. URL state, route matching, guards, layouts, context. |
| `<Route>` | Component | Route definition. Child of `<SniceRouter>`. |
| `<SniceProvider>` | Component | Context provider (standalone, no router needed). |

## Hooks

| Export | Returns | Purpose |
|---|---|---|
| `useSniceContext()` | `SniceReactContext` | Full merged context: `{ application, navigation: {route, params, placards}, navigate, fetch? }` |
| `useNavigate()` | `(path) => void` | Programmatic navigation |
| `useParams()` | `Record<string, string>` | Current route params (shortcut for `ctx.navigation.params`) |
| `useRoute()` | `string` | Current matched route pattern (shortcut for `ctx.navigation.route`) |
| `useRequestHandler(ref, routes, options?)` | `void` | Handle @request channels from Snice elements |

## SniceRouter Props

- `mode`: `"hash"` | `"history"` — URL strategy (required)
- `context`: `object` — App context passed to guards, available via `useSniceContext()` (default `{}`)
- `layout`: `Component | string` — Default layout wrapping all pages
- `loading`: `Component | string | JSX` — Shown during async guards (default: centered spinner)
- `fallback`: `Component | string | JSX` — No route match (default: "404" text)

## Route Props

- `path`: Route pattern (e.g., `/users/:id`)
- `page`: React component (receives params as props) OR Snice tag name string (params set as attributes)
- `guard`: `(ctx, params) => boolean | Promise<boolean>`
- `guards`: Array of guard functions (AND logic, sequential, short-circuit)
- `guardRedirect`: Redirect path on guard failure (without it: renders nothing)
- `layout`: Override layout. `false` = no layout
- `placard`: `Placard` — page metadata for layouts

## Guards

Same signature for both Snice and React:
`(context: Record<string, any>, params: Record<string, string>) => boolean | Promise<boolean>`

- Sync guards resolve immediately
- Async guards show `loading` component until resolved
- Guard error (throw) treated as rejection
- Guards run on navigation only, NOT on context change

## useRequestHandler

```tsx
useRequestHandler(ref, routes, options?)
```

- `ref`: React ref to DOM element, or `null` for document-level
- `routes`: `Record<string, (payload) => any | Promise<any>>`
- `options.passive`: `boolean` (default false) — don't stop propagation
- Callbacks are ref-stable — no `useCallback` needed
- Re-subscribes only when channel names change
- Auto-cleanup on unmount

## Context Shape

```typescript
interface SniceReactContext {
  application: Record<string, any>;  // your context object
  navigation: { route: string; params: Record<string, string>; placards: Placard[] };
  navigate: (path: string) => void;
  fetch?: typeof globalThis.fetch;   // if provided to SniceProvider
}
```

## SniceProvider Props (standalone use)

- `context`, `navigate`, `route`, `params`, `placards`, `fetch` — all optional
- When inside `<SniceRouter>`, these are set automatically

## Mixed Pages

`page` accepts React component OR string (Snice tag name).
Same for `layout`, `loading`, `fallback`.

```tsx
<SniceRouter mode="hash" context={{ user }}>
  <Route path="/" page={HomePage} />
  <Route path="/legacy" page="legacy-dashboard" />
</SniceRouter>
```

## Type Exports

`SniceReactContext`, `SniceRouterProps`, `RouteProps`, `SniceProviderProps`, `Placard`,
`UseRequestRoute`, `UseRequestRouteMap`, `UseRequestHandlerOptions`
