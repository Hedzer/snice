# Placards

Human reference: `docs/placards.md`. Page metadata layouts consume to build nav, breadcrumbs, help, and search. See docs/ai/routing.md for `PageOptions.placard` and the `Layout.update()` signature that receives `Placard[]`.

## Overview

Enables layouts to be built from data instead of hardcoded content: dynamic navigation menus, hierarchical breadcrumbs, context-sensitive help, search functionality, keyboard shortcuts.

## Basic usage

```typescript
import { Placard, render, html } from 'snice';
import { page } from './router'; // page comes from Router(), not from 'snice'

const placard: Placard<AppContext> = {
  name: 'dashboard', title: 'Dashboard', href: '#/dashboard',
  description: 'Main analytics and overview dashboard', icon: '📊', show: true, order: 1
};

@page({ tag: 'dashboard-page', routes: ['/dashboard'], placard })
class DashboardPage extends HTMLElement {
  @render() renderContent() { return html`<h1>Dashboard</h1>`; }
}
```

## `Placard<T>` interface

```typescript
interface Placard<T = any> {
  name: string;                        // required, unique, kebab-case (e.g. 'user-settings')
  title: string;                       // required, display name
  href?: string;                       // anchor href in nav/breadcrumbs; omitted → renders empty href
  description?: string;                // longer description, used in tooltips/search/help
  icon?: string;                       // emoji, icon-font class, or SVG path
  tooltip?: string;                    // brief hover help text
  searchTerms?: string[];              // extra search keywords
  hotkeys?: string[];                  // e.g. ['ctrl+d', 'cmd+d', 'alt+shift+d']
  helpUrl?: string;                    // link to detailed docs/help for this page
  breadcrumbs?: string[];              // explicit breadcrumb trail (placard names)
  group?: string;                      // nav grouping key — same-group pages display together
  parent?: string;                     // parent placard's `name` — builds hierarchy
  order?: number;                      // sort order within group/parent, lower first
  show?: boolean;                      // show in nav menus; default true
  visibleOn?: Guard<T> | Guard<T>[];   // dynamic nav visibility
  attributes?: Record<string, any>;    // arbitrary domain/framework-specific metadata
}
```

## Field notes

- `name` — referenced by `parent` and `breadcrumbs`; convention is kebab-case.
- `href` — consumer controls routing mode: `#/path` (hash), `/path` (pushstate), full URL (external link).
- `visibleOn` — guard(s) deciding nav visibility:
  - Sync guard: evaluated on every render.
  - Async guard (`Promise<boolean>`): placard hidden until resolved `true`; silently hidden on `false` or rejection.
  - Multiple guards: ALL must pass (AND).
  ```typescript
  visibleOn: [isAuthenticated, hasAdminRole]                       // sync
  visibleOn: async (ctx) => (await fetch('/api/me/permissions').then(r => r.json())).includes('admin')  // async
  ```
- `attributes` — free-form bag for custom layout needs, e.g. `{ category: 'reporting', experimental: true, requiredFeatures: ['analytics', 'charts'] }`.

## Hierarchy example

```typescript
const usersPlacard: Placard<AppContext> = { name: 'users', title: 'Users', icon: '👥', show: true, order: 1, group: 'admin' };
const userListPlacard: Placard<AppContext> = { name: 'user-list', title: 'All Users', parent: 'users', order: 1, show: true };
const userCreatePlacard: Placard<AppContext> = { name: 'user-create', title: 'Create User', parent: 'users', order: 2, show: true, visibleOn: [canCreateUsers] };
// grandchild, hidden from nav but reachable via direct link
const userEditPlacard: Placard<AppContext> = { name: 'user-edit', title: 'Edit User', parent: 'user-list', show: false, breadcrumbs: ['users', 'user-list', 'user-edit'] };
```

## Breadcrumb resolution

- **Explicit**: set `breadcrumbs: ['dashboard', 'settings', 'advanced-settings']` — used as-is.
- **Automatic**: omit `breadcrumbs`; a layout resolves the trail by walking the `parent` chain (e.g. `parent: 'user-profile'` → resolves `Users > Profile > Settings`).

## Layout integration

Layouts access placard data via the same `update()` call as documented in docs/ai/routing.md:

```typescript
update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any): void
```

Mechanism is router-implementation-specific, but typically involves: (1) **Router Context** — placards available through router context, (2) **Navigation Builder** — helper functions to build nav from placards, (3) **Event System** — layouts listen for route changes and update UI.

### Nav (flat, top-level only)
```typescript
this.placards.filter(p => p.show !== false && !p.parent)
  .map(p => html`<a href="${p.href || ''}" class="${this.currentRoute === p.name ? 'active' : ''}">${p.icon} ${p.title}</a>`)
```

### Nav (grouped, sorted)
```typescript
this.placards = placards.filter(p => p.show !== false);
this.grouped = this.placards.reduce((acc, p) => {
  const group = p.group || 'main';
  if (!acc[group]) acc[group] = [];
  acc[group].push(p);
  return acc;
}, {} as Record<string, Placard[]>);
// render: items.sort((a, b) => (a.order || 0) - (b.order || 0))
```

### Breadcrumb trail construction
```typescript
function buildBreadcrumbs(placard: Placard, all: Placard[]): Placard[] {
  if (placard.breadcrumbs) {
    return placard.breadcrumbs.map(name => all.find(p => p.name === name)).filter(Boolean) as Placard[];
  }
  const trail: Placard[] = [placard];
  let current = placard;
  while (current.parent) {
    const parent = all.find(p => p.name === current.parent);
    if (!parent) break;
    trail.unshift(parent);
    current = parent;
  }
  return trail;
}
// find current: placards.find(p => p.name === currentRoute)
```
