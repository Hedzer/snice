# Routing API Documentation

Snice provides a powerful routing system for single-page applications with support for hash and pushstate routing, page transitions, route parameters, guards, and layouts.

## Table of Contents
- [Router Setup](#router-setup)
- [Page Components](#page-components)
- [Route Configuration](#route-configuration)
- [Navigation](#navigation)
- [Route Parameters](#route-parameters)
- [Page Transitions](#page-transitions)
- [Route Guards](#route-guards)
- [Layouts](#layouts)
- [Advanced Patterns](#advanced-patterns)

## Router Setup

### Creating a Router

```typescript
import { Router } from 'snice';

const router = Router({
  target: '#app',    // Target element selector
  type: 'hash'       // 'hash' or 'pushstate'
});

// Destructure router methods
const { page, initialize, navigate } = router;
```

### Router Options

```typescript
interface RouterOptions<T = any> {
  target: string;                    // Target element selector
  type: 'hash' | 'pushstate';        // Routing type
  window?: Window;                   // Override window object (for testing)
  document?: Document;               // Override document object (for testing)
  transition?: Transition;           // Global transition config
  layout?: string;                   // Default layout for all pages
  context?: T;                       // Router context object (shared state)
  fetcher?: Fetcher;                 // Optional fetch middleware (see docs/fetcher.md)
}
```

### Router Context

The context object provides shared state across all pages and layouts:

```typescript
// app-context.ts
class AppContext {
  user: User | null = null;
  theme: 'light' | 'dark' = 'light';

  setUser(user: User) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }
}

// main.ts
const { page, initialize } = Router({
  target: '#app',
  type: 'hash',
  context: new AppContext()
});
```

## Page Components

### Basic Page

```typescript
import { page, render, html, styles, css } from 'snice';

@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div class="home">
        <h1>Welcome Home</h1>
        <nav>
          <a href="#/about">About</a>
          <a href="#/contact">Contact</a>
        </nav>
      </div>
    `;
  }

  @styles()
  homeStyles() {
    return css`
      .home {
        padding: 20px;
        text-align: center;
      }

      nav a {
        margin: 0 10px;
        color: blue;
        text-decoration: none;
      }

      nav a:hover {
        text-decoration: underline;
      }
    `;
  }
}
```

### Page with Context

The `@context()` decorator is a **method decorator** that receives context updates from the router. The method is called whenever navigation occurs, with a Context object containing application state and navigation data.

```typescript
import { page, context, render, html, Context } from 'snice';

@page({ tag: 'profile-page', routes: ['/profile'] })
class ProfilePage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContextUpdate(ctx: Context) {
    // ctx.application is your router context (AppContext)
    this.appContext = ctx.application;
    // ctx.navigation contains { placards, route, params }
    // ctx.fetch is available for HTTP requests (with middleware if configured)
    this.requestRender();
  }

  @render()
  renderContent() {
    const user = this.appContext?.getUser();

    if (!user) {
      return html`
        <div>
          <p>Please log in to view your profile</p>
          <a href="#/login">Login</a>
        </div>
      `;
    }

    return html`
      <div class="profile">
        <h1>Profile: ${user.name}</h1>
        <p>Email: ${user.email}</p>
        <button @click=${this.logout}>Logout</button>
      </div>
    `;
  }

  logout() {
    this.appContext?.setUser(null);
  }
}
```

### Context Options

The `@context()` decorator accepts optional timing and behavior controls:

```typescript
@page({ tag: 'dashboard-page', routes: ['/dashboard'] })
class DashboardPage extends HTMLElement {
  private appContext?: AppContext;

  // Called immediately on every navigation
  @context()
  handleContext(ctx: Context) {
    this.appContext = ctx.application;
    this.requestRender();
  }

  // Debounce: Wait 300ms after last update before calling
  @context({ debounce: 300 })
  handleContextDebounced(ctx: Context) {
    // Useful for expensive operations
    this.updateExpensiveCalculation(ctx);
  }

  // Throttle: Call at most once per 100ms
  @context({ throttle: 100 })
  handleContextThrottled(ctx: Context) {
    // Useful for frequent updates
    this.updateAnimation(ctx);
  }

  // Once: Call only once, then unregister
  @context({ once: true })
  handleContextOnce(ctx: Context) {
    // Useful for one-time initialization
    this.initializeFromContext(ctx);
  }
}
```

### Context Object Structure

The Context object passed to `@context()` methods has the following structure:

```typescript
interface Context<T = any> {
  application: T;  // Your router context (e.g., AppContext)
  navigation: {
    placards: Placard[];           // All page placards
    route: string;                  // Current route name
    params: Record<string, string>; // Route parameters
  };
  update(): void;  // Notify all subscribers of changes
}
```

**Example:**

```typescript
@page({ tag: 'user-page', routes: ['/users/:userId'] })
class UserPage extends HTMLElement {
  private ctx?: Context<AppContext>;

  @context()
  handleContext(ctx: Context<AppContext>) {
    this.ctx = ctx;

    // Access application state
    const currentUser = ctx.application.getUser();

    // Access navigation data
    const userId = ctx.navigation.params.userId;
    const currentRoute = ctx.navigation.route;
    const allPlacards = ctx.navigation.placards;

    // Use this data
    this.loadUserData(userId, currentUser);
  }
}
```

### Triggering Context Updates

When you modify the application context, call `update()` to notify all subscribers:

```typescript
@page({ tag: 'settings-page', routes: ['/settings'] })
class SettingsPage extends HTMLElement {
  private ctx?: Context<AppContext>;

  @context()
  handleContext(ctx: Context<AppContext>) {
    this.ctx = ctx;
    this.requestRender();
  }

  changeTheme(theme: 'light' | 'dark') {
    // Modify the application context
    this.ctx!.application.theme = theme;

    // Notify all @context subscribers
    this.ctx!.update();
  }
}
```

**Note:** The router automatically calls `update()` during navigation. Only call it manually when changing application state outside of navigation (login, logout, theme changes, etc.).

## Route Configuration

### @page Decorator Options

```typescript
interface PageOptions<T = any> {
  tag: string;                       // Custom element tag name
  routes: string[];                  // Route patterns
  transition?: Transition;           // Page-specific transition
  guards?: Guard<T> | Guard<T>[];    // Route guards
  placard?: Placard<T>;              // Page metadata
}
```

### Multiple Routes

```typescript
@page({
  tag: 'user-page',
  routes: ['/user', '/users', '/profile']
})
class UserPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>User Page</h1>`;
  }
}
```

### Route with Parameters

```typescript
@page({
  tag: 'user-detail-page',
  routes: ['/users/:userId']
})
class UserDetailPage extends HTMLElement {
  @property()
  userId = '';

  @render()
  renderContent() {
    return html`
      <div>
        <h1>User Details</h1>
        <p>Viewing user: ${this.userId}</p>
      </div>
    `;
  }
}
```

### Multiple Parameters

```typescript
@page({
  tag: 'post-detail-page',
  routes: ['/users/:userId/posts/:postId']
})
class PostDetailPage extends HTMLElement {
  @property()
  userId = '';

  @property()
  postId = '';

  @render()
  renderContent() {
    return html`
      <h1>Post ${this.postId} by User ${this.userId}</h1>
    `;
  }
}
```

## Navigation

### Hash Navigation

```typescript
// In templates
html`<a href="#/about">About</a>`

// Programmatic navigation
navigate('/about');

// With parameters
navigate('/users/123');
```

### Pushstate Navigation

```typescript
// In templates
html`<a href="/about">About</a>`

// Programmatic navigation using the router instance
const { navigate } = Router({
  target: '#app',
  type: 'pushstate'
});

navigate('/about');
```

### Back/Forward Navigation

```typescript
// Browser back
window.history.back();

// Browser forward
window.history.forward();

// Go back 2 pages
window.history.go(-2);
```

## Route Parameters

### Accessing Parameters

Route parameters are automatically mapped to element properties:

```typescript
@page({
  tag: 'article-page',
  routes: ['/articles/:articleId']
})
class ArticlePage extends HTMLElement {
  @property()
  articleId = '';

  @ready()
  async loadArticle() {
    // articleId is automatically set from URL
    const article = await fetch(`/api/articles/${this.articleId}`);
    this.article = await article.json();
  }

  @render()
  renderContent() {
    return html`<h1>Article ${this.articleId}</h1>`;
  }
}
```

### Multiple Parameters

```typescript
@page({
  tag: 'comment-page',
  routes: ['/posts/:postId/comments/:commentId']
})
class CommentPage extends HTMLElement {
  @property()
  postId = '';

  @property()
  commentId = '';

  @ready()
  async loadData() {
    // Both postId and commentId are set from URL
    const [post, comment] = await Promise.all([
      fetch(`/api/posts/${this.postId}`).then(r => r.json()),
      fetch(`/api/comments/${this.commentId}`).then(r => r.json())
    ]);

    this.post = post;
    this.comment = comment;
  }

  @render()
  renderContent() {
    return html`
      <div>
        <h2>Comment on Post ${this.postId}</h2>
        <p>Comment ID: ${this.commentId}</p>
      </div>
    `;
  }
}
```

### Query Parameters

Query parameters are not automatically parsed but can be accessed via URL:

```typescript
@page({
  tag: 'search-page',
  routes: ['/search']
})
class SearchPage extends HTMLElement {
  @property()
  query = '';

  @property()
  page = 1;

  @ready()
  parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    this.query = params.get('q') || '';
    this.page = parseInt(params.get('page') || '1');
  }

  @render()
  renderContent() {
    return html`
      <div>
        <h1>Search Results for: ${this.query}</h1>
        <p>Page: ${this.page}</p>
      </div>
    `;
  }
}
```

## Page Transitions

### Global Transitions

```typescript
import { fadeTransition } from 'snice';

const router = Router({
  target: '#app',
  type: 'hash',
  transition: fadeTransition
});
```

### Page-Specific Transitions

```typescript
import { slideTransition } from 'snice';

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
  slideLeftTransition,
  slideRightTransition,
  slideUpTransition,
  slideDownTransition,
  scaleTransition
} from 'snice';
```

### Custom Transitions

```typescript
import { Transition } from 'snice';

const customTransition: Transition = {
  name: 'custom',
  duration: 500,
  enterClass: 'page-enter',
  enterActiveClass: 'page-enter-active',
  leaveClass: 'page-leave',
  leaveActiveClass: 'page-leave-active'
};

// CSS for custom transition
/*
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  transition: all 500ms ease-out;
}

.page-leave {
  opacity: 1;
}

.page-leave-active {
  opacity: 0;
  transition: all 500ms ease-in;
}
*/
```

## Route Guards

Guards protect routes and can redirect unauthorized access:

### Basic Guard

```typescript
import { Guard } from 'snice';

const isAuthenticated: Guard<AppContext> = (ctx) => {
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
const hasAdminRole: Guard<AppContext> = (ctx) => {
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

```typescript
const requiresAuth: Guard<AppContext> = (ctx) => {
  const isAuth = ctx.getUser() !== null;

  if (!isAuth) {
    // Redirect to login page
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 0);
  }

  return isAuth;
};
```

### Async Guards

```typescript
const checkPermission: Guard<AppContext> = async (ctx) => {
  const user = ctx.getUser();
  if (!user) return false;

  // Check with API
  const response = await fetch(`/api/permissions/${user.id}`);
  const permissions = await response.json();

  return permissions.includes('access_dashboard');
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
                  href="#/${p.name}"
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
  layout: null  // Disable layout for this page
})
class FullscreenPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<div>Fullscreen content</div>`;
  }
}
```

## Advanced Patterns

### Lazy Loading Pages

```typescript
@page({
  tag: 'lazy-page',
  routes: ['/lazy']
})
class LazyPage extends HTMLElement {
  @property({ type: Boolean })
  loaded = false;

  @ready()
  async loadContent() {
    // Simulate loading external content
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dynamically import module
    const module = await import('./lazy-content.js');
    module.initialize(this);

    this.loaded = true;
  }

  @render()
  renderContent() {
    if (!this.loaded) {
      return html`<div>Loading...</div>`;
    }

    return html`<div>Loaded content</div>`;
  }
}
```

### Nested Routing

```typescript
// Parent page with sub-navigation
@page({
  tag: 'settings-page',
  routes: ['/settings', '/settings/:section']
})
class SettingsPage extends HTMLElement {
  @property()
  section = 'general';

  @render()
  renderContent() {
    return html`
      <div class="settings">
        <nav>
          <a href="#/settings/general">General</a>
          <a href="#/settings/privacy">Privacy</a>
          <a href="#/settings/security">Security</a>
        </nav>

        <div class="content">
          <case ${this.section}>
            <when value="general">
              <div>General settings</div>
            </when>
            <when value="privacy">
              <div>Privacy settings</div>
            </when>
            <when value="security">
              <div>Security settings</div>
            </when>
            <default>
              <div>Unknown section</div>
            </default>
          </case>
        </div>
      </div>
    `;
  }
}
```

### Route-Based Data Loading

```typescript
@page({
  tag: 'product-page',
  routes: ['/products/:productId']
})
class ProductPage extends HTMLElement {
  @property()
  productId = '';

  @property()
  product: any = null;

  @property({ type: Boolean })
  loading = true;

  @ready()
  loadProduct() {
    this.fetchProduct();
  }

  @watch('productId')
  onProductIdChange() {
    // Reload when productId changes
    this.fetchProduct();
  }

  async fetchProduct() {
    this.loading = true;

    try {
      const response = await fetch(`/api/products/${this.productId}`);
      this.product = await response.json();
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      this.loading = false;
    }
  }

  @render()
  renderContent() {
    if (this.loading) {
      return html`<div>Loading product...</div>`;
    }

    if (!this.product) {
      return html`<div>Product not found</div>`;
    }

    return html`
      <div class="product">
        <h1>${this.product.name}</h1>
        <p>${this.product.description}</p>
        <span class="price">$${this.product.price}</span>
      </div>
    `;
  }
}
```

### Breadcrumb Navigation

```typescript
@page({
  tag: 'breadcrumb-page',
  routes: ['/categories/:category/products/:productId'],
  placard: {
    name: 'product-detail',
    title: 'Product Details',
    breadcrumbs: ['home', 'categories', 'products', 'product-detail']
  }
})
class BreadcrumbPage extends HTMLElement {
  @property()
  category = '';

  @property()
  productId = '';

  @render()
  renderContent() {
    return html`
      <nav class="breadcrumbs">
        <a href="#/">Home</a>
        <span>/</span>
        <a href="#/categories">Categories</a>
        <span>/</span>
        <a href="#/categories/${this.category}">
          ${this.category}
        </a>
        <span>/</span>
        <span>${this.productId}</span>
      </nav>
      <div class="content">
        <h1>Product ${this.productId} in ${this.category}</h1>
      </div>
    `;
  }
}
```

### Error Page (404)

```typescript
@page({
  tag: 'not-found-page',
  routes: ['/404', '*']  // Catch-all route
})
class NotFoundPage extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div class="not-found">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="#/">Go Home</a>
      </div>
    `;
  }

  @styles()
  errorStyles() {
    return css`
      .not-found {
        text-align: center;
        padding: 4rem;
      }

      h1 {
        color: #e74c3c;
        font-size: 3rem;
      }

      a {
        display: inline-block;
        margin-top: 2rem;
        padding: 0.5rem 2rem;
        background: #3498db;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      }
    `;
  }
}
```

### Protected Route Pattern

```typescript
// Context with auth state
class AppContext {
  private user: User | null = null;

  setUser(user: User | null) {
    this.user = user;

    // Redirect if logged out
    if (!user && window.location.hash.includes('/dashboard')) {
      window.location.hash = '#/login';
    }
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.user !== null;
  }
}

// Auth guard
const requireAuth: Guard<AppContext> = (ctx) => {
  if (!ctx.isAuthenticated()) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
};

// Protected page
@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  guards: requireAuth
})
class DashboardPage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context<AppContext>) {
    this.appContext = ctx.application;
    this.requestRender();
  }

  @render()
  renderContent() {
    const user = this.appContext?.getUser();

    return html`
      <div>
        <h1>Welcome, ${user?.name}!</h1>
        <p>This is your dashboard</p>
      </div>
    `;
  }
}

// Login page
@page({
  tag: 'login-page',
  routes: ['/login']
})
class LoginPage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context<AppContext>) {
    this.appContext = ctx.application;
  }

  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleLogin}>
        <input type="text" name="username" placeholder="Username" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
    `;
  }

  handleLogin(e: Event) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Simulate login
    const user = {
      id: 1,
      name: formData.get('username') as string
    };

    this.appContext?.setUser(user);

    // Redirect to dashboard
    window.location.hash = '#/dashboard';
  }
}
```

## Best Practices

1. **Use semantic routes**: `/users/123` instead of `/page?id=123`
2. **Leverage route parameters**: Automatically mapped to properties
3. **Use guards for protection**: Keep auth logic separate from pages
4. **Implement transitions**: Smooth user experience between pages
5. **Use layouts efficiently**: Share common UI without duplication
6. **Handle 404s**: Always include a catch-all route
7. **Use context for shared state**: Avoid prop drilling
8. **Lazy load when needed**: Improve initial load time
9. **Type your guards**: Use TypeScript generics for context
10. **Test navigation**: Ensure all routes work correctly

## Router API Reference

### Router()

```typescript
function Router<T = any>(options: RouterOptions<T>): {
  page: PropertyDecorator;
  navigate: (path: string) => void;
  initialize: () => void;
  getCurrentRoute: () => string;
  getRouteParams: () => Record<string, string>;
}
```

### navigate()

```typescript
navigate(path: string): void
```

Navigates to the specified path. Uses hash (#) or pushstate depending on router type.

### initialize()

```typescript
initialize(): void
```

Initializes the router and starts listening for route changes. Must be called after all pages are defined.

### getCurrentRoute()

```typescript
getCurrentRoute(): string
```

Returns the current route path.

### getRouteParams()

```typescript
getRouteParams(): Record<string, string>
```

Returns current route parameters as an object.
