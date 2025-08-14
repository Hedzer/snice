# Routing API Documentation

Snice provides a powerful routing system for single-page applications with support for hash and pushstate routing, page transitions, and route parameters.

## Table of Contents
- [Router Setup](#router-setup)
- [Page Components](#page-components)
- [Route Configuration](#route-configuration)
- [Navigation](#navigation)
- [Route Parameters](#route-parameters)
- [Page Transitions](#page-transitions)
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

### Guards with Route Parameters

Guards receive route parameters as the second argument:

```typescript
// Guard that checks if user owns the resource
const ownsResource: Guard<AppContext> = (ctx, params: RouteParams) => {
  const user = ctx.getUser();
  if (!user) return false;
  
  // params.resourceId comes from route like '/resources/:resourceId'
  return user.ownedResources.includes(parseInt(params.resourceId));
};

@page({ 
  tag: 'resource-editor',
  routes: ['/resources/:resourceId/edit'],
  guards: ownsResource
})
class ResourceEditor extends HTMLElement {
  @property()
  resourceId = '';
  
  html() {
    return `<h1>Editing Resource ${this.resourceId}</h1>`;
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

**Important**: Guards cannot access route parameters since they run before the element is created. For parameter-based access control, check permissions in the component's `connectedCallback`:

```typescript
@page({ 
  tag: 'item-edit',
  routes: ['/items/:itemId/edit'],
  guards: isAuthenticated  // Basic auth check in guard
})
class ItemEdit extends HTMLElement {
  @property()
  itemId = '';
  
  async connectedCallback() {
    super.connectedCallback?.();
    
    // Parameter-based access check in component
    const user = getCurrentUser();
    if (!user.ownedItems.includes(parseInt(this.itemId))) {
      this.renderForbidden();
      return;
    }
    
    this.loadItem();
  }
  
  renderForbidden() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `<h1>You don't own this item</h1>`;
    }
  }
  
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

### Nested Page Components

Create pages that contain sub-navigation:

```typescript
@page({ tag: 'settings-page', routes: ['/settings'] })
class SettingsPage extends HTMLElement {
  @query('.sub-content')
  subContent?: HTMLElement;
  
  html() {
    return `
      <div class="settings">
        <h1>Settings</h1>
        <nav class="sub-nav">
          <button data-section="profile">Profile</button>
          <button data-section="security">Security</button>
          <button data-section="notifications">Notifications</button>
        </nav>
        <div class="sub-content">
          <!-- Sub-content loads here -->
        </div>
      </div>
    `;
  }
  
  @on('click', '[data-section]')
  loadSection(event: Event) {
    const button = event.target as HTMLElement;
    const section = button.dataset.section;
    
    if (this.subContent) {
      switch(section) {
        case 'profile':
          this.subContent.innerHTML = '<h2>Profile Settings</h2>';
          break;
        case 'security':
          this.subContent.innerHTML = '<h2>Security Settings</h2>';
          break;
        case 'notifications':
          this.subContent.innerHTML = '<h2>Notification Settings</h2>';
          break;
      }
    }
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    // Load default section
    this.loadSection({ target: { dataset: { section: 'profile' } } } as any);
  }
}

## Best Practices

1. **Route Organization**: Group related routes together
2. **Parameter Validation**: Validate route parameters
3. **Error Handling**: Provide 404 and error pages
4. **Loading States**: Show loading indicators during navigation
5. **Deep Linking**: Support bookmarkable URLs
6. **SEO Considerations**: Use proper meta tags and titles
7. **Performance**: Lazy load heavy pages
8. **Accessibility**: Manage focus on navigation