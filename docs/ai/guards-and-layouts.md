# Guards and Layouts

Human reference: docs/guards-and-layouts.md

The router itself: routing.md

## Route guards

```typescript
const isAuthenticated: Guard<AppContext> = (ctx, params) => ctx.getUser() !== null;

@page({ tag: 'dashboard-page', routes: ['/dashboard'], guards: isAuthenticated })
class DashboardPage extends HTMLElement { /* ... */ }
```

- `guards?: Guard | Guard[]` on `PageOptions` — single guard or array.
- Guard signature: `(ctx: T, params) => boolean` — synchronous.
- Guards can trigger side effects (e.g. redirect) before returning `false`:
  ```typescript
  const isAuthenticated: Guard<AppContext> = (ctx, params) => {
    if (!ctx.getUser()) { window.location.hash = '#/login'; return false; }
    return true;
  };
  ```
- A guard returning `false` → router renders the `/403` page (if registered), else a default 403 message.
- Guards are synchronous — pre-load permissions into context before navigating (can't `await` inside a guard).

## Layouts

Layouts wrap pages with shared UI (headers, footers, nav).

```typescript
interface Layout {
  update(
    appContext: any,
    placards: Placard[],
    currentRoute: string,
    routeParams: Record<string, string>
  ): void;
}
```

```typescript
@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  private placards: Placard[] = [];
  private currentRoute = '';
  @render() renderContent() {
    return html`
      <nav>${this.placards.filter(p => p.show !== false).map(p => html`
        <a href="${p.href || ''}" class="${this.currentRoute === p.name ? 'active' : ''}">${p.icon || ''} ${p.title}</a>
      `)}</nav>
      <slot name="page"></slot>
    `;
  }
  update(appContext, placards, currentRoute, routeParams) {
    this.placards = placards;
    this.currentRoute = currentRoute;
    // property changes trigger re-render
  }
}
```

- Router calls `update()` on every route change.
- Wire globally: `Router({ ..., layout: 'app-shell' })` (layout tag name).
- Per-page override: `@page({ ..., layout: false })` disables the layout for that page (`layout?: string | false` on `PageOptions`).
- Page content renders into the layout's `<slot name="page">`.

## Page transitions

- Global: `Router({ ..., transition: fadeTransition })`.
- Per-page: `@page({ ..., transition: slideTransition })` — overrides the global transition for that page.

### Built-ins (`from 'snice/transitions'`)

`fadeTransition`, `slideTransition`, `slideRightTransition`, `slideUpTransition`, `slideDownTransition`, `scaleTransition`, `rotateTransition`, `flipTransition`, `zoomTransition`, `noneTransition`

### Custom `Transition`

```typescript
interface Transition {
  name: string;
  outDuration: number;               // ms
  inDuration: number;                // ms
  out: string;                       // inline CSS decl string — end state of the leaving page
  in: string;                        // inline CSS decl string — end state of the entering page (starts invisible, transitions to this)
  mode: 'sequential' | 'simultaneous';
}
```
