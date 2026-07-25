<!-- AI: For the AI-optimized version of this doc, see docs/ai/guards-and-layouts.md -->
# Guards and Layouts

Deciding whether a route may render, what wraps it, and how it animates in.
The router itself is covered in [Routing](./routing.md).

## Route Guards

Guards protect routes and can redirect unauthorized access:

### Basic Guard

```typescript
import { Guard } from 'snice';

const isAuthenticated: Guard<AppContext> = (ctx, params) => {
  return ctx.getUser() !== null;
};

@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  guards: isAuthenticated
})
class DashboardPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>Dashboard</h1>`;
  }
}
```

### Multiple Guards

```typescript
const hasAdminRole: Guard<AppContext> = (ctx, params) => {
  const user = ctx.getUser();
  return user?.role === 'admin';
};

@page({
  tag: 'admin-page',
  routes: ['/admin'],
  guards: [isAuthenticated, hasAdminRole]
})
class AdminPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>Admin Dashboard</h1>`;
  }
}
```

### Guard with Redirect

When a guard returns `false`, the router renders the `/403` page (if registered) or a default 403 message. Guards can also trigger side effects like redirects:

```typescript
const isAuthenticated: Guard<AppContext> = (ctx, params) => {
  if (!ctx.getUser()) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
};
```

### Permission Guard

Guards are synchronous — pre-load permissions into context before navigating:

```typescript
const hasAdminAccess: Guard<AppContext> = (ctx, params) => {
  const user = ctx.getUser();
  return user?.role === 'admin';
};
```

## Layouts

Layouts wrap pages with shared UI like headers, footers, and navigation:

### Creating a Layout

```typescript
import { layout, render, html, styles, css, Layout } from 'snice';

@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  renderContent() {
    return html`
      <div class="app-shell">
        <header>
          <h1>My App</h1>
          <nav>
            ${this.placards
              .filter(p => p.show !== false)
              .map(p => html`
                <a
                  href="${p.href || ''}"
                  class="${this.currentRoute === p.name ? 'active' : ''}"
                >
                  ${p.icon || ''} ${p.title}
                </a>
              `)}
          </nav>
        </header>

        <main>
          <slot name="page"></slot>
        </main>

        <footer>
          <p>&copy; 2024 My App</p>
        </footer>
      </div>
    `;
  }

  @styles()
  shellStyles() {
    return css`
      .app-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      header {
        background: #333;
        color: white;
        padding: 1rem;
      }

      nav a {
        color: white;
        margin: 0 1rem;
        text-decoration: none;
      }

      nav a.active {
        font-weight: bold;
        text-decoration: underline;
      }

      main {
        flex: 1;
        padding: 2rem;
      }

      footer {
        background: #f0f0f0;
        padding: 1rem;
        text-align: center;
      }
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

### Using a Layout

```typescript
const router = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell',  // Layout tag name
  context: new AppContext()
});
```

### Layout Interface

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

### Conditional Layout

Different pages can use different layouts or no layout:

```typescript
// Router with default layout
const router = Router({
  target: '#app',
  layout: 'app-shell'
});

// Page without layout
@page({
  tag: 'fullscreen-page',
  routes: ['/fullscreen'],
  layout: false  // Disable layout for this page
})
class FullscreenPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<div>Fullscreen content</div>`;
  }
}
```

## Page Transitions

### Global Transitions

```typescript
import { fadeTransition } from 'snice/transitions';

const router = Router({
  target: '#app',
  type: 'hash',
  transition: fadeTransition
});
```

### Page-Specific Transitions

```typescript
import { slideTransition } from 'snice/transitions';

@page({
  tag: 'about-page',
  routes: ['/about'],
  transition: slideTransition
})
class AboutPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>About</h1>`;
  }
}
```

### Built-in Transitions

```typescript
import {
  fadeTransition,
  slideTransition,
  slideRightTransition,
  slideUpTransition,
  slideDownTransition,
  scaleTransition,
  rotateTransition,
  flipTransition,
  zoomTransition,
  noneTransition
} from 'snice/transitions';
```

### Custom Transitions

Transitions use inline CSS property strings for `out` (leaving) and `in` (entering) states:

```typescript
import { Transition } from 'snice/transitions';

const customTransition: Transition = {
  name: 'custom',
  outDuration: 300,
  inDuration: 300,
  out: 'opacity: 0; transform: translateY(-20px)',
  in: 'opacity: 1; transform: translateY(0)',
  mode: 'sequential'  // or 'simultaneous'
};
```

The `out` string is the end state of the leaving page. The `in` string is the end state of the entering page (which starts invisible and transitions to this state).
