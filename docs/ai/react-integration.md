# React Integration

Source: `src/react/` → Build: `dist/react/` → Published: `adapters/react/`
Import: `import { SniceRouter, Route, useSniceContext } from 'snice/react'`

## Components

| Export | Type | Purpose |
|---|---|---|
| `<SniceRouter>` | Component | Root provider. URL state, route matching, guards, layouts, context. |
| `<Route>` | Component | Route definition. Child of `<SniceRouter>`. |
| `<SniceProvider>` | Component | Context provider (standalone, no router needed). |

## Hooks

| Export | Returns | Purpose |
|---|---|---|
| `useSniceContext()` | `SniceReactContext` | Full merged context (`application`, `navigation`, `navigate`, `params`, `route`) |
| `useNavigate()` | `(path) => void` | Programmatic navigation |
| `useParams()` | `Record<string, string>` | Current route params |
| `useRoute()` | `string` | Current matched route pattern |
| `useRequestHandler()` | `void` | Handle @request channels from Snice elements |

## SniceRouter Props

- `mode`: `"hash"` | `"history"` — URL strategy
- `context`: `object` — App context passed to guards, pages, layouts
- `layout`: `Component | string` — Default layout
- `loading`: `Component | string | JSX` — Shown during async guards
- `fallback`: `Component | string | JSX` — No route match

## Route Props

- `path`: Route pattern (e.g., `/users/:id`)
- `page`: React component OR Snice tag name (string)
- `guard`: `(ctx, params) => boolean | Promise<boolean>`
- `guards`: Array of guard functions (AND logic)
- `guardRedirect`: Redirect path on guard failure
- `layout`: Override layout. `false` = no layout
- `placard`: Page metadata for layouts

## Guards

Same signature for both Snice and React:
`(context, params) => boolean | Promise<boolean>`

Async guards show the `loading` component until resolved.

## Context Shape

```typescript
interface SniceReactContext {
  application: Record<string, any>;
  navigation: { route: string; params: Record<string, string>; placards: Placard[] };
  navigate: (path: string) => void;
  fetch?: typeof globalThis.fetch;
}
```

## Mixed Pages

`page` accepts React component OR string (Snice tag name).
Same for `layout`, `loading`, `fallback`.

```tsx
<SniceRouter mode="hash" context={{ user }}>
  <Route path="/" page={HomePage} />
  <Route path="/legacy" page="legacy-dashboard" />
</SniceRouter>
```
