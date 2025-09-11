# Routing API Documentation

Snice provides a powerful routing system for single-page applications with support for hash and pushstate routing, page transitions, and route parameters.

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
  target: '#app',           // Target element selector
  type: 'hash'      // 'hash' or 'pushstate'
});

// Destructure router methods
const { page, initialize, navigate, register } = router;
```

### Router Options

```typescript
interface RouterOptions {
  target: string;                    // Target element selector
  type: 'hash' | 'pushstate';        // Routing type
  window?: Window;                   // Override window object
  document?: Document;               // Override document object
  transition?: Transition;           // Global transition config
  layout?: string;                   // Default layout for all pages
  context?: any;                     // Router context object
}
```

## Page Components

### Basic Page

```typescript
import { Router } from 'snice';

const { page, initialize } = Router({
  target: '#app',
  type: 'hash'
});

@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  html() {
    return `
      <div class="home">
        <h1>Welcome Home</h1>
        <nav>
          <a href="#/about">About</a>
          <a href="#/contact">Contact</a>
        </nav>
      </div>
    `;
  }
  
  css() {
    return `
      .home {
        padding: 20px;
        text-align: center;
      }
      nav a {
        margin: 0 10px;
        color: blue;
      }
    `;
  }
}

@page({ tag: 'about-page', routes: ['/about'] })
class AboutPage extends HTMLElement {
  html() {
    return `
      <div class="about">
        <h1>About Us</h1>
        <p>Learn more about our company.</p>
        <a href="#/">Back to Home</a>
      </div>
    `;
  }
}

// Initialize router after pages are defined
initialize();
```

### Page Options

```typescript
interface PageOptions {
  tag: string;                // Custom element tag name
  routes: string[];           // Routes that trigger this page
  transition?: Transition; // Page-specific transition
}
```

## Route Configuration

### Multiple Routes per Page

```typescript
@page({ tag: 'product-page', routes: [
    '/product',
    '/products',
    '/item',
    '/items'
  ] 
})
class ProductPage extends HTMLElement {
  html() {
    return `<h1>Products</h1>`;
  }
}
```

### Nested Routes

```typescript
@page({ 
  tag: 'admin-dashboard', 
  routes: ['/admin', '/admin/dashboard'] 
})
class AdminDashboard extends HTMLElement {
  html() {
    return `
      <div class="admin">
        <h1>Admin Dashboard</h1>
        <nav>
          <a href="#/admin/users">Users</a>
          <a href="#/admin/settings">Settings</a>
        </nav>
      </div>
    `;
  }
}

@page({ 
  tag: 'admin-users', 
  routes: ['/admin/users'] 
})
class AdminUsers extends HTMLElement {
  html() {
    return `<h1>User Management</h1>`;
  }
}
```

### 404 Page

```typescript
@page({ 
  tag: 'not-found-page', 
  routes: ['/404'] 
})
class NotFoundPage extends HTMLElement {
  html() {
    return `
      <div class="error-404">
        <h1>404</h1>
        <p>Page not found</p>
        <a href="#/">Go Home</a>
      </div>
    `;
  }
  
  css() {
    return `
      .error-404 {
        text-align: center;
        padding: 50px;
      }
      .error-404 h1 {
        font-size: 72px;
        color: #ff0000;
      }
    `;
  }
}
```

## Navigation

### Programmatic Navigation

```typescript
const { navigate } = router;

// Navigate to a route
navigate('/about');
navigate('/user/123');
navigate('/search?q=typescript');

// Navigation in response to events
@element('nav-button')
class NavButton extends HTMLElement {
  @on('click', 'button')
  handleClick() {
    navigate('/dashboard');
  }
  
  html() {
    return `<button>Go to Dashboard</button>`;
  }
}
```

### Link Navigation

For hash routing:
```html
<a href="#/">Home</a>
<a href="#/about">About</a>
<a href="#/contact">Contact</a>
```

For pushstate routing with click handlers:
```typescript
@element('nav-menu')
class NavMenu extends HTMLElement {
  html() {
    return `
      <nav>
        <a href="/" data-route>Home</a>
        <a href="/about" data-route>About</a>
        <a href="/contact" data-route>Contact</a>
      </nav>
    `;
  }
  
  @on('click', 'a[data-route]')
  handleNavClick(event: Event) {
    event.preventDefault();
    const link = event.target as HTMLAnchorElement;
    navigate(link.pathname);
  }
}
```

## Route Parameters

### Dynamic Routes

```typescript
@page({ tag: 'user-profile', routes: ['/user/:id'] })
class UserProfile extends HTMLElement {
  @property()
  id = '';
  
  @query('.content')
  contentDiv?: HTMLElement;
  
  html() {
    return `
      <div class="profile">
        <h1>User Profile</h1>
        <div class="content">Loading...</div>
      </div>
    `;
  }
  
  @watch('id')
  async loadUser() {
    if (!this.id) return;
    
    console.log('User ID:', this.id);
    const response = await fetch(`/api/users/${this.id}`);
    const user = await response.json();
    this.renderUser(user);
  }
  
  renderUser(user: any) {
    if (this.contentDiv) {
      this.contentDiv.innerHTML = `
        <h2>${user.name}</h2>
        <p>${user.email}</p>
      `;
    }
  }
}
```

### Multiple Parameters

```typescript
@page({ tag: 'blog-post', routes: ['/blog/:year/:month/:slug'] })
class BlogPost extends HTMLElement {
  @property()
  year = '';
  
  @property()
  month = '';
  
  @property()
  slug = '';
  
  html() {
    return `
      <article>
        <h1 class="title">Loading...</h1>
        <time class="date"></time>
        <div class="content"></div>
      </article>
    `;
  }
  
  @watch('slug')
  @watch('year')
  @watch('month')
  async loadPost() {
    if (!this.slug || !this.year || !this.month) return;
    
    const url = `/api/posts/${this.year}/${this.month}/${this.slug}`;
    const response = await fetch(url);
    const post = await response.json();
    this.renderPost(post);
  }
  
  renderPost(post: any) {
    const title = this.shadowRoot?.querySelector('.title');
    const date = this.shadowRoot?.querySelector('.date');
    const content = this.shadowRoot?.querySelector('.content');
    
    if (title) title.textContent = post.title;
    if (date) date.textContent = `${this.year}-${this.month}`;
    if (content) content.innerHTML = post.content;
  }
}
```

### Optional Parameters

```typescript
@page({ 
  tag: 'search-page', 
  routes: [ '/search', '/search/:query' ] 
})
class SearchPage extends HTMLElement {
  @property()
  query = '';
  
  @query('input[type="text"]')
  searchInput?: HTMLInputElement;
  
  @query('.results')
  resultsDiv?: HTMLElement;
  
  html() {
    return `
      <div class="search">
        <h1>Search</h1>
        <input type="text" value="${this.query}" placeholder="Enter search term">
        <div class="results"></div>
      </div>
    `;
  }
  
  @watch('query')
  async performSearch() {
    if (this.searchInput) {
      this.searchInput.value = this.query;
    }
    
    if (!this.query) {
      if (this.resultsDiv) {
        this.resultsDiv.innerHTML = '';
      }
      return;
    }
    
    console.log('Searching for:', this.query);
    // Perform actual search and update results
    const results = await this.fetchResults(this.query);
    this.displayResults(results);
  }
  
  async fetchResults(query: string) {
    // Simulate API call
    return [`Result 1 for ${query}`, `Result 2 for ${query}`];
  }
  
  displayResults(results: string[]) {
    if (this.resultsDiv) {
      this.resultsDiv.innerHTML = results
        .map(r => `<div>${r}</div>`)
        .join('');
    }
  }
}
```

## Page Transitions

### Transition Configuration

```typescript
interface Transition {
  name?: string;                     // Transition name
  outDuration?: number;              // Out transition duration (ms)
  inDuration?: number;               // In transition duration (ms)
  out?: string;                      // CSS for out transition
  in?: string;                       // CSS for in transition
  mode?: 'sequential' | 'simultaneous'; // Transition mode
}
```

### Global Transitions

```typescript
const router = Router({
  target: '#app',
  type: 'hash',
  transition: {
    name: 'fade',
    outDuration: 300,
    inDuration: 300,
    out: 'opacity: 0',
    in: 'opacity: 1',
    mode: 'simultaneous'
  }
});
```

### Page-Specific Transitions

```typescript
@page({ 
  tag: 'animated-page',
  routes: ['/animated'],
  transition: {
    name: 'slide',
    outDuration: 500,
    inDuration: 500,
    out: 'transform: translateX(-100%); opacity: 0',
    in: 'transform: translateX(0); opacity: 1',
    mode: 'sequential'
  }
})
class AnimatedPage extends HTMLElement {
  html() {
    return `<h1>Animated Page</h1>`;
  }
}
```

### Custom Transition Examples

```typescript
// Fade transition
const fadeTransition: Transition = {
  name: 'fade',
  outDuration: 200,
  inDuration: 200,
  out: 'opacity: 0',
  in: 'opacity: 1',
  mode: 'simultaneous'
};

// Slide transition
const slideTransition: Transition = {
  name: 'slide',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateX(-100%)',
  in: 'transform: translateX(0)',
  mode: 'sequential'
};

// Scale transition
const scaleTransition: Transition = {
  name: 'scale',
  outDuration: 250,
  inDuration: 250,
  out: 'transform: scale(0.9); opacity: 0',
  in: 'transform: scale(1); opacity: 1',
  mode: 'simultaneous'
};

// Rotate transition
const rotateTransition: Transition = {
  name: 'rotate',
  outDuration: 400,
  inDuration: 400,
  out: 'transform: rotate(180deg) scale(0.5); opacity: 0',
  in: 'transform: rotate(0) scale(1); opacity: 1',
  mode: 'sequential'
};
```

## Route Guards

Snice provides built-in guard functionality to protect routes based on conditions. Guards are functions that determine if navigation should proceed.

### Basic Guard Usage

```typescript
import { Router, Guard, RouteParams } from 'snice';

// Define your app context class
class AppContext {
  private user: { id: number; role: string } | null = null;
  private permissions: string[] = [];
  
  getUser() {
    return this.user;
  }
  
  setUser(user: { id: number; role: string } | null) {
    this.user = user;
  }
  
  getPermissions() {
    return this.permissions;
  }
  
  setPermissions(permissions: string[]) {
    this.permissions = permissions;
  }
}

// Create context instance
const appContext = new AppContext();

// Create router with context
const router = Router({
  target: '#app',
  type: 'hash',
  context: appContext
});

const { page, navigate, initialize } = router;

// Create guard functions (receive context and route params)
const isAuthenticated: Guard<AppContext> = (ctx, params) => ctx.getUser() !== null;
const isAdmin: Guard<AppContext> = (ctx, params) => ctx.getUser()?.role === 'admin';

// Page with single guard
@page({ 
  tag: 'protected-page',
  routes: ['/protected'],
  guards: isAuthenticated
})
class ProtectedPage extends HTMLElement {
  html() {
    return `<h1>Protected Content</h1>`;
  }
}
```

### Multiple Guards

All guards must pass for navigation to proceed:

```typescript
// Guard factory function
const hasPermission = (perm: string): Guard<AppContext> => 
  (ctx, params) => ctx.getPermissions().includes(perm);

// Page with multiple guards (AND logic)
@page({ 
  tag: 'admin-panel',
  routes: ['/admin'],
  guards: [isAuthenticated, isAdmin, hasPermission('manage-users')]
})
class AdminPanel extends HTMLElement {
  html() {
    return `<h1>Admin Panel</h1>`;
  }
}
```


### Async Guards

Guards can be async for checking permissions from APIs:

```typescript
const canEditResource: Guard<AppContext> = async (ctx, params: RouteParams) => {
  const user = ctx.getUser();
  if (!user) return false;
  
  // Use params in API call
  const response = await fetch(`/api/resources/${params.resourceId}/permissions/${user.id}`);
  const permissions = await response.json();
  return permissions.includes('edit');
};

@page({ 
  tag: 'editor-page',
  routes: ['/editor'],
  guards: canEditResource
})
class EditorPage extends HTMLElement {
  html() {
    return `<h1>Resource Editor</h1>`;
  }
}
```

### Custom 403 Page

When guards deny access, a 403 page is rendered:

```typescript
// Define custom 403 page
@page({ 
  tag: 'forbidden-page',
  routes: ['/403']
})
class ForbiddenPage extends HTMLElement {
  html() {
    return `
      <div class="forbidden">
        <h1>403 - Access Denied</h1>
        <p>You don't have permission to view this page.</p>
        <a href="#/">Return to Home</a>
      </div>
    `;
  }
  
  css() {
    return `
      .forbidden {
        text-align: center;
        padding: 50px;
      }
      .forbidden h1 {
        color: #ff4444;
      }
    `;
  }
}
```

### Guards with Route Parameters

Guards receive route parameters as the second argument and can access them for permission checks:

```typescript
// Guard that checks if user owns the resource
const ownsItem: Guard<AppContext> = (ctx, params: RouteParams) => {
  const user = ctx.getUser();
  if (!user) return false;
  
  // params.itemId comes from route '/items/:itemId/edit'
  return user.ownedItems.includes(parseInt(params.itemId));
};

@page({ 
  tag: 'item-edit',
  routes: ['/items/:itemId/edit'],
  guards: [isAuthenticated, ownsItem]  // Both guards check different things
})
class ItemEdit extends HTMLElement {
  @property()
  itemId = '';
  
  html() {
    return `<h1>Edit Item ${this.itemId}</h1>`;
  }
}
```

### Working with Context

Context is exposed by the router and can be modified through your context object's methods:

```typescript
// Use the same context instance from above
const { navigate, context } = router;

// After login, update the context
async function login(credentials: any) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  const userData = await response.json();
  
  // Update context through its methods
  context.setUser(userData.user);
  context.setPermissions(userData.permissions);
  
  // Navigate to protected area
  navigate('/dashboard');
}

// On logout, clear context
function logout() {
  context.setUser(null);
  context.setPermissions([]);
  navigate('/');
}
```

### Guard Best Practices

1. **Keep guards simple**: Guards should only check conditions, not perform side effects
2. **Use async sparingly**: Only use async guards when necessary (API checks)
3. **Provide feedback**: Always define a custom 403 page for better UX
4. **Cache results**: For expensive checks, cache guard results
5. **Test thoroughly**: Write tests for all guard scenarios

## Layouts

Layouts provide a way to wrap pages in shared components like navigation bars, headers, footers, and sidebars. This creates consistent structure across your application while keeping page content focused.

### Layout Components

Create layout components using the `@layout` decorator:

```typescript
import { layout } from 'snice';

@layout('app-shell')
class AppShell extends HTMLElement {
  html() {
    return /*html*/`
      <div class="app-layout">
        <header class="header">
          <nav>
            <a href="#/">Home</a>
            <a href="#/products">Products</a>
            <a href="#/about">About</a>
          </nav>
        </header>
        <main class="content">
          <slot name="page"></slot>
        </main>
        <footer class="footer">
          <p>&copy; 2024 My Company</p>
        </footer>
      </div>
    `;
  }

  css() {
    return /*css*/`
      .app-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      
      .header {
        background: #333;
        color: white;
        padding: 1rem;
      }
      
      .content {
        flex: 1;
        padding: 2rem;
      }
      
      .footer {
        background: #f5f5f5;
        padding: 1rem;
        text-align: center;
      }
    `;
  }
}
```

**Key requirement**: Layouts must include `<slot name="page"></slot>` where page content will be rendered.

### Router Layout Configuration

Configure layouts at the router level for default behavior:

```typescript
const router = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell'  // Default layout for all pages
});
```

### Page Layout Configuration

Override layouts on a per-page basis:

```typescript
// Use default layout
@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  html() {
    return `<h1>Welcome Home</h1>`;
  }
}

// Use different layout
@page({ tag: 'admin-page', routes: ['/admin'], layout: 'admin-shell' })
class AdminPage extends HTMLElement {
  html() {
    return `<h1>Admin Dashboard</h1>`;
  }
}

// Disable layout entirely
@page({ tag: 'fullscreen-page', routes: ['/presentation'], layout: false })
class FullscreenPage extends HTMLElement {
  html() {
    return `<div class="fullscreen">Presentation Mode</div>`;
  }
}
```

### Layout Transitions

Layouts persist across page changes, providing smooth transitions:

```typescript
const router = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell',
  transition: {
    name: 'fade',
    duration: 300
  }
});
```

When transitioning between pages that use the same layout:
1. **Layout remains**: The layout wrapper stays in place
2. **Page transitions**: Only the content inside `<slot name="page">` transitions

### Multiple Layouts

Different sections of your app can use different layouts:

```typescript
// Main app layout
@layout('app-shell')
class AppShell extends HTMLElement {
  html() {
    return /*html*/`
      <header>Main Navigation</header>
      <main><slot name="page"></slot></main>
    `;
  }
}

// Admin layout with sidebar
@layout('admin-shell') 
class AdminShell extends HTMLElement {
  html() {
    return /*html*/`
      <div class="admin-layout">
        <aside class="sidebar">
          <nav>Admin Menu</nav>
        </aside>
        <main class="admin-content">
          <slot name="page"></slot>
        </main>
      </div>
    `;
  }
}

// Configure pages
@page({ tag: 'home-page', routes: ['/'], layout: 'app-shell' })
class HomePage extends HTMLElement {}

@page({ tag: 'admin-dashboard', routes: ['/admin'], layout: 'admin-shell' })
class AdminDashboard extends HTMLElement {}
```

### Layout Context Access

Layouts can access router context just like pages:

```typescript
import { layout, context } from 'snice';

@layout('user-shell')
class UserShell extends HTMLElement {
  @context()
  appContext!: AppContext;

  html() {
    const user = this.appContext.currentUser;
    return /*html*/`
      <header>
        <div class="user-info">
          Welcome, ${user?.name || 'Guest'}
        </div>
        <nav>Navigation</nav>
      </header>
      <main><slot name="page"></slot></main>
    `;
  }
}
```

### Layout Best Practices

1. **Keep layouts focused**: Include only truly shared UI elements
2. **Use semantic HTML**: Structure layouts with proper landmarks
3. **Handle responsive design**: Make layouts work across screen sizes
4. **Minimize layout switching**: Frequent layout changes disrupt UX
5. **Test transitions**: Ensure smooth transitions between different layouts
6. **Consider accessibility**: Use proper ARIA attributes in layout navigation

## Advanced Patterns

### Navigation Wrapper

Create a navigation service to handle common patterns:

```typescript
import { Router } from 'snice';

class NavigationService {
  private router: ReturnType<typeof Router>;
  private navigate: (path: string) => Promise<void>;
  
  constructor(routerInstance: ReturnType<typeof Router>) {
    this.router = routerInstance;
    this.navigate = routerInstance.navigate;
  }
  
  // Navigate with hash or pushstate prefix
  go(path: string) {
    this.navigate(path);
  }
  
  // Navigate after delay
  async goDelayed(path: string, delay: number) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.navigate(path);
  }
  
  // Navigate with confirmation
  async goWithConfirm(path: string, message: string) {
    if (confirm(message)) {
      this.navigate(path);
    }
  }
}

// Usage
const router = Router({ target: '#app', type: 'hash' });
const nav = new NavigationService(router);

// In components
av.go('/dashboard');
av.goWithConfirm('/delete', 'Are you sure?');
```

### Handling Navigation Events

Listen to router events using the target element:

```typescript
const router = Router({ target: '#app', type: 'hash' });
const { initialize } = router;

initialize();

// Listen for navigation by watching DOM changes
const target = document.querySelector('#app');
if (target) {
  const observer = new MutationObserver((mutations) => {
    // Page changed
    const currentPage = target.firstElementChild;
    if (currentPage) {
      console.log('Navigated to:', currentPage.tagName.toLowerCase());
      
      // Update page title
      document.title = `App - ${currentPage.tagName}`;
      
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_title: currentPage.tagName,
          page_location: window.location.href
        });
      }
    }
  });
  
  observer.observe(target, { childList: true });
}
```

### Preloading Pages

Ensure page components are defined before navigation:

```typescript
// Define all pages upfront
import './pages/home-page';
import './pages/about-page';
import './pages/contact-page';

// Or dynamically load and define
async function preloadPage(tag: string, modulePath: string) {
  if (!customElements.get(tag)) {
    const module = await import(modulePath);
    // Module should define the custom element
  }
}

// Preload critical pages
await preloadPage('home-page', './pages/home-page.js');
await preloadPage('dashboard-page', './pages/dashboard-page.js');

// Then initialize router
const router = Router({ target: '#app', type: 'hash' });
router.initialize();
```
