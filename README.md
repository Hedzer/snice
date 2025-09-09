# Snice

An imperative TypeScript framework for building vanilla web components with decorators and routing

## Quick Start

Create a new Snice app with one command:

```bash
npx snice create-app my-app
cd my-app
npm run dev
```

## Core Philosophy: Imperative, Not Reactive

Snice takes an **imperative approach** to web components. Unlike reactive frameworks that automatically re-render when data changes, Snice components:

- **Render once** when connected to the DOM
- **Never re-render** automatically
- Require **explicit method calls** to update visual state
- Give you **full control** over when and how updates happen

This approach gives you direct control over DOM updates without hidden complexity or automatic re-renders.

## Core Concepts

Snice provides a clear separation of concerns through decorators:

### Class Decorators
- **`@element`** - Creates custom HTML elements with encapsulated visual behavior and styling
- **`@controller`** - Handles data fetching, server communication, and business logic separate from visual components  
- **`@page`** - Defines routable page components that render when their route is active, with URL params passed as attributes

### Property & Query Decorators
- **`@property`** - Declares properties that can reflect to attributes
- **`@query`** - Queries a single element from shadow DOM
- **`@queryAll`** - Queries multiple elements from shadow DOM
- **`@watch`** - Watches property changes and calls a method when they occur
- **`@ready`** - Runs a method after the element's shadow DOM is ready
- **`@dispose`** - Runs a method when the element is removed from the DOM

### Event Decorators
- **`@on`** - Listens for events on elements
- **`@dispatch`** - Dispatches custom events after method execution
- **`@request`** - Makes requests from elements or controllers
- **`@respond`** - Responds to requests in elements or controllers

This separation keeps your components focused: elements handle presentation, controllers manage data, and pages define navigation.

## Basic Component

```typescript
import { element } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  html() {
    return `<button>Click me</button>`;
  }
}
```

That's it. Your component renders when added to the DOM:

```html
<my-button></my-button>
```

## The Imperative Way

In Snice, updates are explicit. Components expose methods that controllers or other components call to update state:

```typescript
import { element, property, query } from 'snice';

@element('counter-display')
class CounterDisplay extends HTMLElement {
  @property({ type: Number })
  count = 0;
  
  @query('.count')
  countElement?: HTMLElement;
  
  @query('.status')
  statusElement?: HTMLElement;

  html() {
    // Renders ONCE - no automatic re-rendering
    return `
      <div class="counter">
        <span class="count">${this.count}</span>
        <span class="status">Ready</span>
      </div>
    `;
  }
  
  // Imperative update methods - YOU control when updates happen
  setCount(newCount: number) {
    this.count = newCount;
    if (this.countElement) {
      this.countElement.textContent = String(newCount);
    }
  }
  
  setStatus(status: string) {
    if (this.statusElement) {
      this.statusElement.textContent = status;
    }
  }
  
  increment() {
    this.setCount(this.count + 1);
    this.setStatus('Incremented!');
  }
}
```

**Key Points:**
- The `html()` method runs **once** when the element connects
- Updates happen through **explicit method calls** like `setCount()`
- You have **full control** over what updates and when
- No surprises, no magic, no hidden re-renders

## Properties

Properties can be reflected to attributes but do NOT trigger re-renders. The HTML is rendered once when the element connects to the DOM. Use properties for initial configuration.

```typescript
import { element, property } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property({ reflect: true })
  name = 'Anonymous';
  
  @property({ attribute: 'user-role' })  // Maps to user-role attribute
  role = 'User';
  
  @property({ type: Boolean })
  verified = false;

  html() {
    // This renders ONCE with the initial property values
    return `
      <div class="card">
        <h3>${this.name}</h3>
        <span class="role">${this.role}</span>
        ${this.verified ? '<span class="badge">✓ Verified</span>' : ''}
      </div>
    `;
  }
}
```

Use it with attributes:
```html
<user-card name="Jane Doe" user-role="Admin" verified></user-card>
```

For arrays of basic types, use `SimpleArray` for safe reflection:

```typescript
import { element, property, SimpleArray } from 'snice';

@element('tag-list')
class TagList extends HTMLElement {
  @property({ type: SimpleArray, reflect: true })
  tags = ['javascript', 'typescript', 'web'];
  
  html() {
    return `<div>${this.tags.join(', ')}</div>`;
  }
}
```

```html
<tag-list tags="react，vue，angular"></tag-list>
```

## Watching Property Changes

Use `@watch` to imperatively update DOM when properties change:

```typescript
import { element, property, watch, query } from 'snice';

@element('theme-toggle')
class ThemeToggle extends HTMLElement {
  @property({ reflect: true })
  theme: 'light' | 'dark' = 'light';
  
  @query('.icon')
  icon?: HTMLElement;
  
  html() {
    return `
      <button>
        <span class="icon">🌞</span>
      </button>
    `;
  }
  
  @watch('theme')
  updateTheme(oldValue: string, newValue: string) {
    if (this.icon) {
      this.icon.textContent = newValue === 'dark' ? '🌙' : '🌞';
    }
  }
  
  @on('click', 'button')
  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }
}
```

**Key Points:**
- `@watch` methods are called when the property value changes
- Receives `oldValue`, `newValue`, and `propertyName` as parameters
- Perfect for imperatively updating DOM elements
- Can watch multiple properties with multiple decorators
- Works with both programmatic changes and attribute changes

You can watch multiple properties with a single decorator:

```typescript
@watch('width', 'height', 'scale')
updateDimensions(_old: number, _new: number, _name: string) {
  // Called when any of these properties change
  console.log(`${_name} changed from ${_old} to ${_new}`);
  this.recalculateLayout();
}
```

Watch all property changes with the wildcard:

```typescript
@watch('*')
handleAnyPropertyChange(_old: any, _new: any, _name: string) {
  console.log(`Property ${_name} changed from ${_old} to ${_new}`);
  // Useful for debugging or when all properties affect the same output
}
```

## Queries

Query single elements with `@query`:

```typescript
import { element, query } from 'snice';

@element('my-form')
class MyForm extends HTMLElement {
  @query('input')
  input?: HTMLInputElement;

  html() {
    return `<input type="text" />`;
  }

  getValue() {
    return this.input?.value;
  }
}
```

Query multiple elements with `@queryAll`:

```typescript
import { element, queryAll } from 'snice';

@element('checkbox-group')
class CheckboxGroup extends HTMLElement {
  @queryAll('input[type="checkbox"]')
  checkboxes?: NodeListOf<HTMLInputElement>;

  html() {
    return `
      <input type="checkbox" value="option1" />
      <input type="checkbox" value="option2" />
      <input type="checkbox" value="option3" />
    `;
  }

  getSelectedValues() {
    if (!this.checkboxes) return [];
    return Array.from(this.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }
}
```

## Events

Listen for events with `@on`:

```typescript
import { element, on } from 'snice';

@element('my-clicker')
class MyClicker extends HTMLElement {
  html() {
    return `
      <button>Click me</button>
      <input type="text" placeholder="Press Enter" />
    `;
  }

  @on('click', 'button')
  handleClick() {
    console.log('Button clicked!');
  }

  @on('keydown:Enter', 'input')  // Only plain Enter (no modifiers)
  handleEnter() {
    console.log('Enter pressed!');
  }
  
  @on('keydown:ctrl+Enter', 'input')  // Only Ctrl+Enter
  handleCtrlEnter() {
    console.log('Ctrl + Enter pressed!');
  }
  
  @on('focus')  // Listen on the host element itself (no target)
  handleFocus() {
    console.log('Element received focus!');
  }
}
```

## Dispatching Events

Automatically dispatch custom events with `@dispatch`:

```typescript
import { element, dispatch, on, query } from 'snice';

@element('toggle-switch')
class ToggleSwitch extends HTMLElement {
  private isOn = false;

  @query('.toggle')
  toggleButton?: HTMLElement;

  html() {
    return `<button class="toggle">OFF</button>`;
  }
  
  @on('click', '.toggle')
  @dispatch('toggled')
  toggle() {
    this.isOn = !this.isOn;
    if (this.toggleButton) {
      this.toggleButton.textContent = this.isOn ? 'ON' : 'OFF';
    }
    return { on: this.isOn };
  }
}
```

The `@dispatch` decorator:
- Dispatches after the method completes
- Uses the return value as the event detail
- Works with async methods
- Bubbles by default

```typescript
// With options from EventInit
@dispatch('my-event', { bubbles: false, cancelable: true })

// Don't dispatch if method returns undefined
@dispatch('maybe-data', { dispatchOnUndefined: false })
```

## Styling

```typescript
@element('styled-card')
class StyledCard extends HTMLElement {
  html() {
    return `<div class="card">Hello</div>`;
  }

  css() {
    return `
      .card {
        padding: 20px;
        background: #f0f0f0;
        border-radius: 8px;
      }
    `;
  }
}
```

CSS is automatically scoped to your component.

## Routing

```typescript
import { Router } from 'snice';

const router = Router({ target: '#app', type: 'hash' });

const { page, navigate, initialize } = router;

@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  html() {
    return `<h1>Home</h1>`;
  }
}

@page({ tag: 'about-page', routes: ['/about'] })
class AboutPage extends HTMLElement {
  html() {
    return `<h1>About</h1>`;
  }
}

// Page with URL parameter  
import { property } from 'snice';

@page({ tag: 'user-page', routes: ['/users/:userId'] })
class UserPage extends HTMLElement {
  @property()
  userId = '';
  
  html() {
    return `<h1>User ${this.userId}</h1>`;
  }
}

// Start the router
initialize();

// Navigate programmatically
navigate('/about');
navigate('/users/123');  // Sets userId="123" on UserPage
```

### Route Guards

Protect routes with guard functions that control access:

```typescript
import { Router, Guard, RouteParams } from 'snice';

// Create router with context
const router = Router({
  target: '#app',
  type: 'hash',
  context: new AppContext(),  // Your app's context object
});

const { page, navigate, initialize } = router;

// Simple guards (params is empty object for non-parameterized routes)
const isAuthenticated: Guard<AppContext> = (ctx, params) => ctx.getUser() !== null;
const isAdmin: Guard<AppContext> = (ctx, params) => ctx.getUser()?.role === 'admin';

// Protected page with single guard
@page({ tag: 'dashboard-page', routes: ['/dashboard'], guards: isAuthenticated })
class DashboardPage extends HTMLElement {
  html() {
    return `<h1>Dashboard</h1>`;
  }
}

// Admin page with multiple guards (all must pass)
@page({ tag: 'admin-page', routes: ['/admin'], guards: [isAuthenticated, isAdmin] })
class AdminPage extends HTMLElement {
  html() {
    return `<h1>Admin Panel</h1>`;
  }
}

// Guard that uses route params to check resource-specific permissions
const canEditUser: Guard<AppContext> = async (ctx, params) => {
  const user = ctx.getUser();
  if (!user) return false;
  
  // params.id comes from route '/users/:id/edit'
  const response = await fetch(`/api/permissions/users/${params.id}/can-edit`);
  return response.ok;
};

// Guard that checks ownership
const ownsItem: Guard<AppContext> = (ctx, params) => {
  const user = ctx.getUser();
  if (!user) return false;
  
  // params.itemId comes from route '/items/:itemId'
  return user.ownedItems.includes(parseInt(params.itemId));
};

@page({ tag: 'user-edit', routes: ['/users/:id/edit'], guards: [isAuthenticated, canEditUser] })
class UserEditPage extends HTMLElement {
  @property()
  id = '';  // Automatically set from route param
  
  html() {
    return `<h1>Edit User ${this.id}</h1>`;
  }
}

@page({ tag: 'item-view', routes: ['/items/:itemId'], guards: [isAuthenticated, ownsItem] })
class ItemView extends HTMLElement {
  @property()
  itemId = '';  // Automatically set from route param
  
  html() {
    return `<h1>Item ${this.itemId}</h1>`;
  }
}

// Custom 403 page (optional)
@page({ tag: 'forbidden-page', routes: ['/403'] })
class ForbiddenPage extends HTMLElement {
  html() {
    return `
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
      <a href="#/">Return to home</a>
    `;
  }
}

initialize();
```

When a guard denies access:
- The 403 page is rendered if defined
- Otherwise, a default "Unauthorized" message is shown
- The URL doesn't change (no redirect)

## Controllers (Data Fetching)

Controllers handle server communication separately from visual components:

```typescript
import { controller, element } from 'snice';

@controller('user-controller')
class UserController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    const response = await fetch('/api/users');
    const users = await response.json();
    (element as any).setUsers(users);
  }

  async detach(element: HTMLElement) {
    // Cleanup
  }
}

@element('user-list')
class UserList extends HTMLElement {
  users: any[] = [];

  html() {
    return `
      <ul>
        ${this.users.map(u => `<li>${u.name}</li>`).join('')}
      </ul>
    `;
  }

  setUsers(users: any[]) {
    this.users = users;
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = this.html();
    }
  }
}
```

Use it:

```html
<user-list controller="user-controller"></user-list>
```

## Request/Response

Bidirectional communication between elements and controllers:

```typescript
import { element, request, type Response } from 'snice';

// Element makes request, controller responds
@element('user-profile')  
class UserProfile extends HTMLElement {

  @request('fetch-user')
  async *getUser(): Response<{ name: string; email: string }> {
    const user = await (yield { userId: 123 });
    return user;
  }

  @ready()
  async load() {
    const userData = await this.getUser();
    this.displayUser(userData);
  }
  
}

@controller('user-controller')
class UserController {

  @respond('fetch-user')
  async handleFetchUser(request: { userId: number }) {
    const response = await fetch(`/api/users/${request.userId}`);
    return response.json();
  }

}
```

## Router Context

Access router context in page components, nested elements, and controllers using the `@context` decorator.

### ⚠️ Important Warning About Global State

**Context is global shared state and should be treated with extreme caution.** Mutating context from multiple components creates hard-to-debug issues, race conditions, and tightly coupled code. This is a serious footgun if used improperly.

**Best practices:**
- Treat context as **read-only** in components
- Only mutate context through well-defined methods in the context class
- Use context for truly global, app-wide state (user auth, theme, locale)
- For component-specific state, use properties instead
- Consider the context immutable from the component's perspective

### Basic Usage in Pages

```typescript
// Define your context class with controlled mutations
class AppContext {
  private user: User | null = null;
  
  // Controlled mutation through methods
  setUser(user: User) {...}
  
  // Read-only access
  getUser() {...}
  
  isAuthenticated() {...}
}

// Create router with context
const appContext = new AppContext();
const { page, initialize } = Router({
  target: '#app',
  type: 'hash',
  context: appContext
});

// Access context in page components
@page({ tag: 'profile-page', routes: ['/profile'] })
class ProfilePage extends HTMLElement {
  @context()
  ctx?: AppContext;
  
  html() {
    // READ context, don't mutate it directly
    const user = this.ctx?.getUser();
    if (!user) {
      return `<p>Please log in</p>`;
    }
    return `
      <h1>Welcome, ${user.name}!</h1>
      <p>Email: ${user.email}</p>
    `;
  }
}
```

### Context in Nested Elements

Nested elements within pages can also access context:

```typescript
// This element can be used inside any page
@element('user-avatar')
class UserAvatar extends HTMLElement {
  @context()
  ctx?: AppContext;
  
  html() {
    // Context is available even in nested elements
    const user = this.ctx?.getUser();
    return user 
      ? `<img src="${user.avatar}" alt="${user.name}">`
      : `<div class="placeholder">?</div>`;
  }
}

// Use it in a page
@page({ tag: 'dashboard', routes: ['/'] })
class Dashboard extends HTMLElement {
  html() {
    return `
      <h1>Dashboard</h1>
      <user-avatar></user-avatar>  <!-- Will have access to context -->
    `;
  }
}
```

### Context in Controllers

Controllers attached to page elements automatically acquire context:

```typescript
@controller('nav-controller')
class NavController {
  element: HTMLElement | null = null;
  
  @context()
  ctx?: AppContext;
  
  attach(element: HTMLElement) {
    // Context is available in controllers too
    if (!this.ctx?.isAuthenticated()) {
      window.location.hash = '#/login';
    }
  }
  
  detach(element: HTMLElement) {
    // Cleanup if needed
  }
}

@page({ tag: 'admin-page', routes: ['/admin'] })
class AdminPage extends HTMLElement {
  html() {
    return `<div controller="nav-controller">Admin Panel</div>`;
  }
}
```

The `@context` decorator:
- Injects the router's context into page components
- Available to nested elements via event bubbling
- Available to controllers attached to pages
- Returns the same context instance everywhere
- Automatically cleaned up when elements are removed

**Remember:** With great power comes great responsibility. Global state is dangerous - use it wisely and sparingly.

## Observing External Changes

The `@observe` decorator provides lifecycle-managed observation of external changes like viewport intersection, element resize, media queries, and DOM mutations:

```typescript
import { element, observe } from 'snice';

@element('lazy-image')
class LazyImage extends HTMLElement {
  html() {
    return `
      <img data-src="photo.jpg" class="lazy" />
      <div class="loading">Loading...</div>
    `;
  }

  // Observe when image enters viewport
  @observe('intersection', '.lazy', { threshold: 0.1 })
  loadImage(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      img.classList.add('loaded');
      return false; // Stop observing after loading
    }
  }

  // Respond to viewport size changes
  @observe('media:(min-width: 768px)')
  handleDesktop(matches: boolean) {
    this.classList.toggle('desktop-mode', matches);
  }
}
```

All observers are automatically cleaned up when elements disconnect from the DOM. See the [Observe API documentation](./docs/observe.md) for more examples.

## Parts - Selective Re-rendering

For complex components with frequent updates to specific sections, the `@part` decorator enables selective re-rendering of template parts without rebuilding the entire component:

```typescript
import { element, part, property, on } from 'snice';

@element('user-dashboard')
class UserDashboard extends HTMLElement {
  @property()
  user = { name: 'Loading...', stats: { views: 0, likes: 0 } };
  
  notifications = [];
  messages = [];

  html() {
    return `
      <header part="user-info"></header>
      <main>
        <section part="stats"></section>
        <aside part="notifications"></aside>
        <div part="messages"></div>
      </main>
    `;
  }

  @part('user-info')
  renderUserInfo() {
    return `
      <h1>${this.user.name}</h1>
      <button id="refresh-user">Refresh</button>
    `;
  }

  @part('stats')
  renderStats() {
    return `
      <div class="stats">
        <span>Views: ${this.user.stats.views}</span>
        <span>Likes: ${this.user.stats.likes}</span>
      </div>
    `;
  }

  @part('notifications', { throttle: 300 })
  renderNotifications() {
    return `
      <h3>Notifications (${this.notifications.length})</h3>
      ${this.notifications.map(n => `<div>${n}</div>`).join('')}
    `;
  }

  @part('messages')
  async renderMessages() {
    if (this.messages.length === 0) {
      return '<p>No messages</p>';
    }
    return this.messages.map(m => `<div class="message">${m}</div>`).join('');
  }

  // Update specific parts without re-rendering everything
  updateUserName(newName) {
    this.user.name = newName;
    this.renderUserInfo(); // Only re-renders the header
  }

  incrementViews() {
    this.user.stats.views++;
    this.renderStats(); // Only re-renders the stats section
  }

  addNotification(notification) {
    this.notifications.unshift(notification);
    this.renderNotifications(); // Only re-renders notifications
  }

  @on('click', '#refresh-user')
  async handleRefreshUser() {
    // Simulate API call
    const userData = await this.fetchUserData();
    this.user = userData;
    this.renderUserInfo(); // Update just the user info part
    this.renderStats();    // Update just the stats part
  }
}
```

**Benefits of `@part`:**
- **Performance** - Update only what changed instead of re-rendering entire templates
- **Granular Control** - Target specific sections for updates
- **Complex UIs** - Perfect for dashboards, lists, or components with independent sections
- **Async Support** - Part methods can be async for data fetching
- **Throttle/Debounce** - Control render frequency to optimize performance

### Performance Options

The `@part` decorator supports throttle and debounce options to optimize render performance:

```typescript
// Throttle: Limit renders to once per 300ms
@part('notifications', { throttle: 300 })
renderNotifications() { /* ... */ }

// Debounce: Delay render until 150ms after last call
@part('search-results', { debounce: 150 })
renderSearchResults() { /* ... */ }
```

- **Throttle** - Limits renders to a maximum frequency (e.g., once every 300ms)
- **Debounce** - Delays renders until after calls stop for the specified time

The `@part` decorator is ideal when you have components with multiple independent sections that update at different frequencies or from different data sources.

## Documentation

- [Elements API](./docs/elements.md) - Complete guide to creating elements with properties, queries, and styling
- [Controllers API](./docs/controllers.md) - Data fetching, business logic, and controller patterns
- [Events API](./docs/events.md) - Event handling, dispatching, and custom events
- [Request/Response API](./docs/request-response.md) - Bidirectional communication between elements and controllers
- [Routing API](./docs/routing.md) - Single-page application routing with transitions
- [Observe API](./docs/observe.md) - Lifecycle-managed observers for external changes
- [Migration Guide](./docs/migration-guide.md) - Migrating from React, Vue, Angular, and other frameworks

## License

MIT