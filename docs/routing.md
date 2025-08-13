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
  routing_type: 'hash'      // 'hash' or 'pushstate'
});

// Destructure router methods
const { page, initialize, navigate, register } = router;
```

### Router Options

```typescript
interface RouterOptions {
  target: string;                    // Target element selector
  routing_type: 'hash' | 'pushstate'; // Routing type
  window?: Window;                   // Override window object
  document?: Document;               // Override document object
  transition?: PageTransition;       // Global transition config
}
```

## Page Components

### Basic Page

```typescript
import { Router } from 'snice';

const { page, initialize } = Router({
  target: '#app',
  routing_type: 'hash'
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
  transition?: PageTransition; // Page-specific transition
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
interface PageTransition {
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
  routing_type: 'hash',
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
const fadeTransition: PageTransition = {
  name: 'fade',
  outDuration: 200,
  inDuration: 200,
  out: 'opacity: 0',
  in: 'opacity: 1',
  mode: 'simultaneous'
};

// Slide transition
const slideTransition: PageTransition = {
  name: 'slide',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateX(-100%)',
  in: 'transform: translateX(0)',
  mode: 'sequential'
};

// Scale transition
const scaleTransition: PageTransition = {
  name: 'scale',
  outDuration: 250,
  inDuration: 250,
  out: 'transform: scale(0.9); opacity: 0',
  in: 'transform: scale(1); opacity: 1',
  mode: 'simultaneous'
};

// Rotate transition
const rotateTransition: PageTransition = {
  name: 'rotate',
  outDuration: 400,
  inDuration: 400,
  out: 'transform: rotate(180deg) scale(0.5); opacity: 0',
  in: 'transform: rotate(0) scale(1); opacity: 1',
  mode: 'sequential'
};
```

## Advanced Patterns

### Protected Routes

```typescript
// Auth service
class AuthService {
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  static requireAuth(fallbackRoute: string = '/login') {
    if (!this.isAuthenticated()) {
      navigate(fallbackRoute);
      return false;
    }
    return true;
  }
}

@page({ 
  tag: 'protected-page',
  routes: ['/dashboard']
})
class ProtectedPage extends HTMLElement {
  connectedCallback() {
    super.connectedCallback?.();
    
    // Check authentication
    if (!AuthService.requireAuth()) {
      return;
    }
    
    // Load protected content
    this.loadDashboard();
  }
  
  loadDashboard() {
    console.log('Loading dashboard...');
  }
  
  html() {
    return `<h1>Protected Dashboard</h1>`;
  }
}
```

### Route Guards

```typescript
// Create a route guard system
class RouteGuard {
  private static guards = new Map<string, () => boolean>();
  
  static register(route: string, guard: () => boolean) {
    this.guards.set(route, guard);
  }
  
  static canActivate(route: string): boolean {
    const guard = this.guards.get(route);
    return guard ? guard() : true;
  }
}

// Register guards
RouteGuard.register('/admin', () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
});

// Modified page with guard check
@page({ 
  tag: 'admin-page',
  routes: ['/admin']
})
class AdminPage extends HTMLElement {
  connectedCallback() {
    super.connectedCallback?.();
    
    if (!RouteGuard.canActivate('/admin')) {
      navigate('/unauthorized');
      return;
    }
    
    this.loadAdminData();
  }
  
  loadAdminData() {
    console.log('Loading admin data...');
  }
  
  html() {
    return `<h1>Admin Panel</h1>`;
  }
}
```

### Lazy Loading Pages

```typescript
// Lazy load page components
async function lazyLoadPage(modulePath: string, pageName: string) {
  const module = await import(modulePath);
  return module[pageName];
}

// Register lazy loaded routes
async function setupLazyRoutes() {
  const { register } = router;
  
  // Register route without loading component
  register('/heavy-page', 'heavy-page');
  
  // Load component when needed
  window.addEventListener('hashchange', async () => {
    const hash = window.location.hash;
    
    if (hash === '#/heavy-page' && !customElements.get('heavy-page')) {
      const HeavyPage = await lazyLoadPage('./pages/heavy-page.js', 'HeavyPage');
      customElements.define('heavy-page', HeavyPage);
    }
  });
}
```

### Breadcrumb Navigation

```typescript
@element('breadcrumb-nav')
class BreadcrumbNav extends HTMLElement {
  @property()
  currentPath = '';
  
  @query('.breadcrumb')
  navElement?: HTMLElement;
  
  html() {
    return `
      <nav class="breadcrumb">
        ${this.generateBreadcrumbs()}
      </nav>
    `;
  }
  
  css() {
    return `
      .breadcrumb {
        padding: 10px;
        background: #f5f5f5;
      }
      .breadcrumb a {
        color: blue;
        text-decoration: none;
        margin: 0 5px;
      }
      .breadcrumb span {
        margin: 0 5px;
      }
    `;
  }
  
  generateBreadcrumbs(): string {
    const parts = this.currentPath.split('/').filter(Boolean);
    const breadcrumbs: string[] = ['<a href="#/">Home</a>'];
    
    parts.forEach((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/');
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      
      if (index === parts.length - 1) {
        breadcrumbs.push(`<span>${label}</span>`);
      } else {
        breadcrumbs.push(`<a href="#${path}">${label}</a>`);
      }
    });
    
    return breadcrumbs.join(' > ');
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    
    // Update on navigation
    window.addEventListener('hashchange', () => {
      this.currentPath = window.location.hash.slice(1) || '/';
    });
    
    // Set initial path
    this.currentPath = window.location.hash.slice(1) || '/';
  }
  
  @watch('currentPath')
  updateBreadcrumbs() {
    if (this.navElement) {
      this.navElement.innerHTML = this.generateBreadcrumbs();
    }
  }
}
```

### Route Analytics

```typescript
class RouteAnalytics {
  private static startTime: number;
  
  static init() {
    // Track initial page load
    this.trackPageView(window.location.pathname);
    
    // Track navigation
    window.addEventListener('hashchange', () => {
      this.trackPageView(window.location.hash.slice(1));
    });
    
    // For pushstate
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      RouteAnalytics.trackPageView(window.location.pathname);
    };
  }
  
  static trackPageView(path: string) {
    const endTime = Date.now();
    const duration = this.startTime ? endTime - this.startTime : 0;
    
    // Send analytics
    console.log('Page view:', {
      path,
      duration,
      timestamp: endTime,
      referrer: document.referrer
    });
    
    // Update start time for next navigation
    this.startTime = endTime;
    
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path
      });
    }
  }
}

// Initialize analytics
RouteAnalytics.init();
```

### Multi-Layout System

```typescript
// Base layout
@element('base-layout')
class BaseLayout extends HTMLElement {
  @query('.content')
  contentArea?: HTMLElement;
  
  html() {
    return `
      <header>
        <nav><!-- Navigation --></nav>
      </header>
      <main class="content"></main>
      <footer><!-- Footer --></footer>
    `;
  }
  
  setContent(element: HTMLElement) {
    if (this.contentArea) {
      this.contentArea.innerHTML = '';
      this.contentArea.appendChild(element);
    }
  }
}

// Admin layout
@element('admin-layout')
class AdminLayout extends HTMLElement {
  @query('.content')
  contentArea?: HTMLElement;
  
  html() {
    return `
      <div class="admin-wrapper">
        <aside class="sidebar"><!-- Admin menu --></aside>
        <main class="content"></main>
      </div>
    `;
  }
  
  setContent(element: HTMLElement) {
    if (this.contentArea) {
      this.contentArea.innerHTML = '';
      this.contentArea.appendChild(element);
    }
  }
}

// Route with layout
class LayoutRouter {
  static layouts = new Map<string, string>();
  
  static setLayout(route: string, layoutTag: string) {
    this.layouts.set(route, layoutTag);
  }
  
  static getLayout(route: string): string {
    // Check specific route
    if (this.layouts.has(route)) {
      return this.layouts.get(route)!;
    }
    
    // Check route patterns
    for (const [pattern, layout] of this.layouts) {
      if (route.startsWith(pattern)) {
        return layout;
      }
    }
    
    return 'base-layout';
  }
}

// Configure layouts
LayoutRouter.setLayout('/admin', 'admin-layout');
LayoutRouter.setLayout('/user', 'base-layout');
```

## Best Practices

1. **Route Organization**: Group related routes together
2. **Parameter Validation**: Validate route parameters
3. **Error Handling**: Provide 404 and error pages
4. **Loading States**: Show loading indicators during navigation
5. **Deep Linking**: Support bookmarkable URLs
6. **SEO Considerations**: Use proper meta tags and titles
7. **Performance**: Lazy load heavy pages
8. **Accessibility**: Manage focus on navigation