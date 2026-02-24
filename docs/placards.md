# Placards API

Placards provide rich metadata about pages that layouts can consume to dynamically build navigation, breadcrumbs, help systems, and other UI elements. This enables layouts to be populated with data instead of having hardcoded content.

## Overview

The Placard system allows pages to declare metadata that describes their purpose, structure, and behavior. Layouts can then query this metadata to automatically build:

- Dynamic navigation menus
- Hierarchical breadcrumbs
- Context-sensitive help
- Search functionality
- Keyboard shortcuts

## Basic Usage

Define a placard for your page using the `placard` option in the `@page` decorator:

```typescript
import { Placard, render, html } from 'snice';
import { page } from './router'; // page comes from Router(), not from 'snice'

const placard: Placard<AppContext> = {
  name: 'dashboard',
  title: 'Dashboard',
  description: 'Main analytics and overview dashboard',
  icon: '📊',
  show: true,
  order: 1
};

@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  placard: placard
})
class DashboardPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>Dashboard</h1>`;
  }
}
```

## Placard Interface

```typescript
interface Placard<T = any> {
  // Identification
  name: string;

  // Core display
  title: string;
  description?: string;
  icon?: string;

  // Help & discovery
  tooltip?: string;
  searchTerms?: string[];
  hotkeys?: string[];
  helpUrl?: string;

  // Navigation structure
  breadcrumbs?: string[];
  group?: string;
  parent?: string;
  order?: number;
  show?: boolean;

  // Dynamic visibility
  visibleOn?: Guard<T> | Guard<T>[];

  // Extensibility
  attributes?: Record<string, any>;
}
```

## Field Reference

### Identification

**`name`** (required)
- Unique identifier for this placard
- Used for referencing in breadcrumbs and parent-child relationships
- Should be kebab-case, e.g., 'user-settings', 'admin-dashboard'

### Core Display

**`title`** (required)
- Display name shown in navigation and breadcrumbs
- Should be concise and descriptive

**`description`** (optional)
- Longer description of the page's purpose
- Used in tooltips, search results, or help text

**`icon`** (optional)
- Visual icon representing the page
- Can be emoji, icon font class, or SVG path

### Help & Discovery

**`tooltip`** (optional)
- Brief help text shown on hover
- Explains what the page does or when to use it

**`searchTerms`** (optional)
- Additional keywords for search functionality
- Helps users discover pages through alternate terms

```typescript
searchTerms: ['settings', 'preferences', 'config', 'options']
```

**`hotkeys`** (optional)
- Keyboard shortcuts to navigate to this page
- Uses standard key notation

```typescript
hotkeys: ['ctrl+d', 'cmd+d', 'alt+shift+d']
```

**`helpUrl`** (optional)
- Link to detailed documentation or help for this page

### Navigation Structure

**`group`** (optional)
- Logical grouping for navigation organization
- Pages with the same group are displayed together

```typescript
group: 'admin'  // Groups with other admin pages
```

**`parent`** (optional)
- References another placard's `name` to create hierarchy
- Used for nested navigation and breadcrumb construction

```typescript
parent: 'users'  // Child of the 'users' page
```

**`order`** (optional)
- Numeric sort order within the group or parent
- Lower numbers appear first

**`show`** (optional)
- Whether to display this page in navigation menus
- Defaults to `true` if not specified

### Dynamic Visibility

**`visibleOn`** (optional)
- Guard functions for layouts to evaluate when building navigation menus
- The router passes all placards to layouts unfiltered — layouts must check `visibleOn` themselves
- Reuses the same guard type as route protection

```typescript
visibleOn: [isAuthenticated, hasAdminRole]
```

### Extensibility

**`attributes`** (optional)
- Arbitrary metadata for custom layout needs
- Domain-specific or framework-specific data

```typescript
attributes: {
  category: 'reporting',
  experimental: true,
  requiredFeatures: ['analytics', 'charts']
}
```

## Hierarchical Navigation Example

```typescript
// Parent page
const usersPlacard: Placard<AppContext> = {
  name: 'users',
  title: 'Users',
  icon: '👥',
  show: true,
  order: 1,
  group: 'admin'
};

// Child pages
const userListPlacard: Placard<AppContext> = {
  name: 'user-list',
  title: 'All Users',
  parent: 'users',
  order: 1,
  show: true
};

const userCreatePlacard: Placard<AppContext> = {
  name: 'user-create',
  title: 'Create User',
  parent: 'users',
  order: 2,
  show: true,
  visibleOn: [canCreateUsers]
};

// Grandchild page
const userEditPlacard: Placard<AppContext> = {
  name: 'user-edit',
  title: 'Edit User',
  parent: 'user-list',
  show: false, // Hidden from nav, accessible via direct link
  breadcrumbs: ['users', 'user-list', 'user-edit']
};
```

## Breadcrumb Resolution

Breadcrumbs can be automatically resolved using the `parent` hierarchy or explicitly defined:

```typescript
// Automatic breadcrumbs using parent chain
const settingsPlacard: Placard<AppContext> = {
  name: 'user-settings',
  title: 'Settings',
  parent: 'user-profile'
  // Layout can resolve breadcrumbs using parent chain: Users > Profile > Settings
};

// Explicit breadcrumbs
const advancedPlacard: Placard<AppContext> = {
  name: 'advanced-settings',
  title: 'Advanced',
  breadcrumbs: ['dashboard', 'settings', 'advanced-settings']
  // Explicitly defined breadcrumb path
};
```

## Layout Integration

Layouts can access placard data to build dynamic UI. The exact mechanism depends on your router implementation, but typically involves:

1. **Router Context** - Placards available through router context
2. **Navigation Builder** - Helper functions to build nav from placards
3. **Event System** - Layouts listen for route changes and update UI

```typescript
import { layout, render, html, Layout } from 'snice';

@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  renderContent() {
    return html`
      <header>
        <nav>
          ${this.placards
            .filter(p => p.show !== false && !p.parent)
            .map(p => html`
              <a
                href="#/${p.name}"
                class="${this.currentRoute === p.name ? 'active' : ''}"
              >
                ${p.icon} ${p.title}
              </a>
            `)}
        </nav>
      </header>
      <main>
        <slot name="page"></slot>
      </main>
    `;
  }

  // Called by router when route changes
  update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
    this.placards = placards;
    this.currentRoute = currentRoute;
    // Property changes trigger re-render
  }
}
```

### Building Navigation from Placards

```typescript
@layout('sidebar-layout')
class SidebarLayout extends HTMLElement implements Layout {
  private placards: Placard[] = [];
  private grouped: Record<string, Placard[]> = {};

  @render()
  renderContent() {
    return html`
      <aside class="sidebar">
        ${Object.entries(this.grouped).map(([group, items]) => html`
          <div class="nav-group">
            <h3>${group}</h3>
            <ul>
              ${items
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(p => html`
                  <li>
                    <a href="#/${p.name}" title="${p.tooltip || ''}">
                      ${p.icon} ${p.title}
                    </a>
                  </li>
                `)}
            </ul>
          </div>
        `)}
      </aside>
      <main>
        <slot name="page"></slot>
      </main>
    `;
  }

  update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
    this.placards = placards.filter(p => p.show !== false);

    // Group placards
    this.grouped = this.placards.reduce((acc, p) => {
      const group = p.group || 'main';
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {} as Record<string, Placard[]>);
  }
}
```

### Building Breadcrumbs

```typescript
@layout('breadcrumb-layout')
class BreadcrumbLayout extends HTMLElement implements Layout {
  private breadcrumbs: Placard[] = [];

  @render()
  renderContent() {
    return html`
      <nav class="breadcrumbs">
        ${this.breadcrumbs.map((p, i) => html`
          ${i > 0 ? html`<span class="separator">/</span>` : ''}
          <a href="#/${p.name}">${p.title}</a>
        `)}
      </nav>
      <main>
        <slot name="page"></slot>
      </main>
    `;
  }

  update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
    // Find current page placard
    const current = placards.find(p => p.name === currentRoute);
    if (!current) return;

    // Build breadcrumb trail
    this.breadcrumbs = this.buildBreadcrumbs(current, placards);
  }

  buildBreadcrumbs(placard: Placard, all: Placard[]): Placard[] {
    const trail: Placard[] = [placard];

    // Use explicit breadcrumbs if defined
    if (placard.breadcrumbs) {
      return placard.breadcrumbs
        .map(name => all.find(p => p.name === name))
        .filter(Boolean) as Placard[];
    }

    // Otherwise follow parent chain
    let current = placard;
    while (current.parent) {
      const parent = all.find(p => p.name === current.parent);
      if (!parent) break;
      trail.unshift(parent);
      current = parent;
    }

    return trail;
  }
}
```

