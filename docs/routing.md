<!-- AI: For the AI-optimized version of this doc, see docs/ai/routing.md -->
# Routing

Creating a router, defining pages, and moving between them.

| Topic | Documented in |
|---|---|
| Protecting routes, wrapping pages, page transitions | [Guards and Layouts](./guards-and-layouts.md) |
| Page metadata for navigation | [Placards](./placards.md) |
| Context-aware fetch | [Fetcher](./fetcher.md) |

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
interface RouterOptions {
  target: string;                    // Target element selector
  type: 'hash' | 'pushstate';        // Routing type
  window?: Window;                   // Override window object (for testing)
  document?: Document;               // Override document object (for testing)
  transition?: Transition;           // Global transition config
  layout?: string;                   // Default layout for all pages
  context?: any;                     // App context (shared state and optional daemons)
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

Router provides this application context beneath its target before it connects a
page. That includes explicitly constructed daemon instances:

```typescript
const session = new SessionDaemon();

Router({
  target: '#app',
  type: 'hash',
  context: {
    user: null,
    daemons: { session }
  }
});
```

This uses the same `provideContext(root, context)` mechanism available to apps
without Router. Descendant elements and attached controllers address the instance
as `{ daemon: 'session' }`; they do not import `SessionDaemon`. See
[Daemons](./daemons.md).

That provider boundary supplies the full Router `Context` to `@context()`
methods on descendant elements and attached controllers. They use `ctx.fetch`
with the configured request/response middleware without importing the router
or adding a reserved field to the application context. `getContextFetch()` is
the lower-level transport-only lookup for explicit non-router providers.

## Page Components

### Basic Page

```typescript
import { render, html, styles, css } from 'snice';
import { page } from './router'; // page comes from Router(), not from 'snice'

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

The `@context()` decorator is a **method decorator** that receives context
updates from the router on pages, descendant elements, and attached
controllers. The method is called whenever navigation occurs, with a Context
object containing application state and navigation data.

```typescript
import { context, render, html, Context } from 'snice';
import { page } from './router';

@page({ tag: 'profile-page', routes: ['/profile'] })
class ProfilePage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContextUpdate(ctx: Context) {
    this.appContext = ctx.application;
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
interface Context {
  application: AppContext;  // Your router context (e.g., { user, theme, config })
  navigation: {
    placards: Placard[];           // All page placards
    route: string;                  // Current path (e.g. '/users/123')
    params: Record<string, string>; // Route parameters
  };
  fetch: typeof globalThis.fetch;  // Fetch function with middleware support
  update(): void;  // Signal all @context subscribers of changes
}
```

**Example:**

```typescript
@page({ tag: 'user-page', routes: ['/users/:userId'] })
class UserPage extends HTMLElement {
  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
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

When you modify the application context, call `update()` to signal all subscribers:

```typescript
@page({ tag: 'settings-page', routes: ['/settings'] })
class SettingsPage extends HTMLElement {
  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    this.requestRender();
  }

  changeTheme(theme: 'light' | 'dark') {
    // Modify the application context
    this.ctx!.application.theme = theme;

    // Signal all @context subscribers
    this.ctx!.update();
  }
}
```

**Note:** The router automatically signals `@context()` subscribers during navigation. Only call `update()` manually when changing application state outside of navigation (login, logout, theme changes, etc.).

## Route Configuration

### @page Decorator Options

```typescript
interface PageOptions {
  tag: string;                       // Custom element tag name
  routes: Array<string | {           // Strings are the normal form
    path: string;
    order?: number;                  // Lower wins on a specificity tie
  }>;
  transition?: Transition;           // Page-specific transition
  guards?: Guard | Guard[];          // Route guards
  layout?: string | false;           // Layout tag, or false to disable
  placard?: Placard | ((ctx: AppContext) => Placard);  // Page metadata
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

Routes are sorted by specificity first. If specificity ties, registration
order wins, including the order of plain strings in one `routes` array. Keep
that compact syntax for normal pages:

```typescript
@page({
  tag: 'work-orders-page',
  routes: ['/work-orders?status=:status', '/work-orders']
})
class WorkOrdersPage extends HTMLElement {}
```

Object notation is optional. Use it only when a route needs an explicit
tie-break across registrations; lower `order` values match first. Equal or
omitted values still preserve registration order.

```typescript
@page({
  tag: 'override-page',
  routes: [{ path: '/:section/:item', order: -10 }]
})
class OverridePage extends HTMLElement {}
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

Route parameters are automatically mapped to element properties — a `:param`
segment or named splat such as `*path` (including an optional splat) normally
binds to a **plain `@property()`** of the same name. A field declared
`@property({ attribute: false })` is opted OUT of route-param binding: the
Router never sets it and it silently keeps its initializer. (The Router sets
params through attributes; `attribute: false` fields have none.)

The parameter spelling must reach the property's observed attribute. On an
`HTMLElement` page, `:articleId` reaches a plain `articleId` property through
the lowercased `articleid` attribute. A `SniceElement` page uses kebab-case
implicit attributes, so its plain `articleId` property needs `:article-id` (or
an explicit `@property({ attribute: 'articleId' })`). Explicit aliases follow
the same rule: `@property({ attribute: 'article-id' }) articleId` binds from
`:article-id`, not `:articleId`.

A reflected native HTMLElement attribute such as `id` is already reachable
when no Snice property overrides it. An explicit
`@property({ attribute: false }) id` or differently aliased `id` overrides that
native channel, so `:id` no longer populates the property. A statically declared
`observedAttributes` entry paired with `attributeChangedCallback` can also
consume a route attribute.

Inheritance follows Snice's decorator transformation: a subclass `@state()`
member disables an inherited `@property()` channel of the same name, while a
plain field initializer or authored accessor still uses the inherited
transformed property accessor and remains bindable.

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

Define query parameters directly in the route pattern — they are extracted as route params automatically:

```typescript
@page({
  tag: 'search-page',
  routes: ['/search?q=:query']
})
class SearchPage extends HTMLElement {
  @property()
  query = '';

  @context()
  handleContext(ctx: Context) {
    this.query = ctx.navigation.params.query || '';
  }

  @render()
  renderContent() {
    return html`
      <div>
        <h1>Search Results for: ${this.query}</h1>
      </div>
    `;
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
      <div>
        <h1>404 - Page Not Found</h1>
        <a href="#/">Go Home</a>
      </div>
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
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.user !== null;
  }
}

// Auth guard — redirect to login if not authenticated
const isAuthenticated: Guard<AppContext> = (ctx, params) => {
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
  guards: isAuthenticated
})
class DashboardPage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context) {
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
  handleContext(ctx: Context) {
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

## Router API Reference

### Router()

```typescript
function Router(options: RouterOptions): {
  page: (pageOptions: PageOptions) => ClassDecorator;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard | Guard[], layout?: string | false, placard?: Placard | ((ctx: AppContext) => Placard), order?: number) => void;
}
```

### navigate()

```typescript
navigate(path: string): Promise<void>
```

Navigates to the specified path. Uses hash (#) or pushstate depending on router type.

Do not combine `@page` with `@element` on the same class. `@page` already
registers the custom element and applies Snice element behavior.

### initialize()

```typescript
initialize(): void
```

Initializes the router and starts listening for route changes. Must be called after all pages are defined.

### register()

```typescript
register(
  route: string,
  tag: string,
  transition?: Transition,
  guards?: Guard | Guard[],
  layout?: string | false,
  placard?: Placard | ((ctx: AppContext) => Placard)
): void
```

Manually register a route without using the `@page` decorator.
