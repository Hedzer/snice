# Snice v3.0.0

An imperative TypeScript framework for building vanilla web components with decorators, **differential rendering**, and routing.

## What's New in v3.0.0

🚀 **Differential Rendering** - Only updates changed parts of your components, not the entire DOM
⚡ **Tagged Templates** - `html\`\`` and `css\`\`` for clean, type-safe templates
🎯 **Auto-Rendering** - Components automatically re-render when properties change
🔥 **Template Events** - `@click=${handler}` syntax directly in templates
📦 **Smaller Bundles** - No external dependencies, custom lit-html-inspired implementation

**Breaking Changes:** v3.0.0 removes `html()`, `css()`, `@part`, and `@on`. See [MIGRATION_V2_TO_V3.md](./MIGRATION_V2_TO_V3.md).

## Quick Start

Create a new Snice app with one command:

```bash
npx snice create-app my-app
cd my-app
npm run dev
```

## Core Philosophy: Imperative with Smart Updates

Snice v3.0.0 combines **imperative control** with **automatic differential rendering**:

- Components render when **properties change** (automatic)
- Updates are **differential** - only changed parts re-render
- **Full control** over when renders happen (debounce, throttle, manual)
- **No virtual DOM** - direct, efficient DOM updates
- **Template-based** with `html\`\`` tagged templates

You control the data flow imperatively, Snice handles efficient DOM updates automatically.

## The Snice Way: Elements + Controllers

Snice separates UI from data: **elements handle UI, controllers handle behavior and data**.

```typescript
import { element, controller, property, render, styles, html, css } from 'snice';

export interface IUserCard extends HTMLElement {
  userId: string;
  user: { name: string; email: string } | null;
}

// Element: Just UI with auto-rendering
@element('user-card')
class UserCard extends HTMLElement implements IUserCard {
  @property({ attribute: 'user-id' })
  userId = '';

  @property({ type: Object })
  user: { name: string; email: string } | null = null;

  @render()
  renderContent() {
    return html`
      <div class="card">
        ${this.user
          ? html`
            <h3>${this.user.name}</h3>
            <p>${this.user.email}</p>
          `
          : html`
            <h3>Loading...</h3>
            <p>Please wait...</p>
          `
        }
      </div>
    `;
  }

  @styles()
  cardStyles() {
    return css`
      .card {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
      }
    `;
  }
}

// Controller: Data and behavior
@controller('user-loader')
class UserLoaderController {
  element!: IUserCard;

  async attach(element: IUserCard) {
    const response = await fetch(`/api/users/${element.userId}`);
    const user = await response.json();

    element.user = user; // Auto re-renders!
  }

  async detach(element: IUserCard) { /* Cleanup */ }
}
```

Connect them in HTML:
```html
<user-card user-id="123" controller="user-loader"></user-card>
```

That's it. Element auto-renders when properties change, controller manages data, differential rendering keeps it fast.

## Core Concepts

Snice provides a clear separation of concerns through decorators:

### Class Decorators
- **`@element`** - Creates custom HTML elements with differential rendering
- **`@controller`** - Handles data fetching, server communication, and business logic
- **`@page`** - Defines routable page components with URL params

### Rendering Decorators (v3.0.0)
- **`@render`** - Defines the component template with `html\`\`` (auto re-renders on property changes)
- **`@styles`** - Defines component styles with `css\`\``

### Property & Query Decorators
- **`@property`** - Declares properties that sync with DOM attributes and trigger renders
- **`@query`** - Queries a single element from shadow DOM
- **`@queryAll`** - Queries multiple elements from shadow DOM
- **`@watch`** - Watches property changes for side effects (runs alongside auto-render)
- **`@ready`** - Runs after initial render and setup
- **`@dispose`** - Runs when element is removed from DOM

### Event & Communication Decorators
- **Template events** - `@click=${handler}` syntax in templates (no decorator needed)
- **`@dispatch`** - Dispatches custom events after method execution
- **`@request`** - Makes requests from elements or controllers
- **`@respond`** - Responds to requests in elements or controllers

This separation keeps your components focused: elements handle presentation with auto-rendering, controllers manage data, pages define navigation.

## Basic Component

```typescript
import { element, render, html } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() {
    return html`<button>Click me</button>`;
  }
}
```

That's it. Your component renders when added to the DOM:

```html
<my-button></my-button>
```

## Auto-Rendering with Differential Updates

In Snice v3.0.0, components automatically re-render when properties change, but **only the changed parts update**:

```typescript
import { element, property, render, styles, html, css } from 'snice';

@element('counter-display')
class CounterDisplay extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @property()
  status = 'Ready';

  @render()
  renderContent() {
    return html`
      <div class="counter">
        <span class="count">${this.count}</span>
        <span class="status">${this.status}</span>
        <button @click=${this.increment}>+</button>
      </div>
    `;
  }

  @styles()
  counterStyles() {
    return css`
      .counter {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `;
  }

  increment() {
    this.count++;
    this.status = 'Incremented!';
    // Auto re-renders! Only <span class="count"> and <span class="status"> update
    // Button is unchanged, so it's not touched
  }
}
```

**Key Points:**
- The `@render()` method defines your template with `html\`\``
- **Automatic re-rendering** when properties change
- **Differential updates** - only changed `<span>` elements update, not entire shadow DOM
- **Event handlers** in templates: `@click=${this.method}`
- **Batched updates** - multiple property changes = single render (microtask batching)

## Properties

Properties automatically sync with DOM attributes in both directions. The HTML is rendered once when the element connects to the DOM. Use properties for initial configuration and watch for changes to update the UI.

```typescript
import { element, property } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property()
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

Use it with attributes (both ways work):
```html
<!-- Setting attributes automatically updates properties -->
<user-card name="Jane Doe" user-role="Admin" verified></user-card>

<script>
  const card = document.querySelector('user-card');
  card.name = 'John Smith';      // Sets name="John Smith" attribute
  card.verified = true;          // Sets verified attribute
</script>
```

For arrays of basic types, use `SimpleArray` for safe reflection:

```typescript
import { element, property, SimpleArray } from 'snice';

@element('tag-list')
class TagList extends HTMLElement {
  @property({ type: SimpleArray })
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
  @property()
  theme: 'light' | 'dark' = 'light';

  @query('.icon')
  icon!: HTMLSpanElement;
  
  html() {
    return `
      <button>
        <span class="icon">🌞</span>
      </button>
    `;
  }
  
  @watch('theme')
  updateTheme(oldValue: string, newValue: string) {
    this.icon.textContent = newValue === 'dark' ? '🌙' : '🌞';
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
  input!: HTMLInputElement;

  html() {
    return `<input type="text" />`;
  }

  getValue() {
    return this.input.value;
  }
}
```

Query multiple elements with `@queryAll`:

```typescript
import { element, queryAll } from 'snice';

@element('checkbox-group')
class CheckboxGroup extends HTMLElement {
  @queryAll('input[type="checkbox"]')
  checkboxes!: NodeListOf<HTMLInputElement>;

  html() {
    return `
      <input type="checkbox" value="option1" />
      <input type="checkbox" value="option2" />
      <input type="checkbox" value="option3" />
    `;
  }

  getSelectedValues() {
    return Array.from(this.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }
}
```

## Events

Handle events directly in templates with `@event` syntax:

```typescript
import { element, property, render, html } from 'snice';

@element('my-clicker')
class MyClicker extends HTMLElement {
  @property()
  inputValue = '';

  @render()
  renderContent() {
    return html`
      <button @click=${this.handleClick}>Click me</button>
      <input
        type="text"
        placeholder="Type something"
        .value=${this.inputValue}
        @input=${this.handleInput}
        @keydown=${this.handleKeydown}
      />
      <p>You typed: ${this.inputValue}</p>
    `;
  }

  handleClick(event: Event) {
    console.log('Button clicked!', event);
  }

  handleInput(event: Event) {
    this.inputValue = (event.target as HTMLInputElement).value;
    // Auto re-renders!
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      console.log('Enter pressed:', this.inputValue);
    }
  }
}
```

**Template Event Syntax:**
- `@click=${handler}` - Any DOM event
- `@input=${handler}`, `@change=${handler}` - Form events
- `@keydown=${handler}`, `@keyup=${handler}` - Keyboard events
- Event handlers receive the native `Event` object
- Handlers are automatically bound to component context

## Advanced Template Features

### Property Binding

Use `.property=${value}` to set element properties (not attributes):

```typescript
@render()
renderContent() {
  return html`
    <input .value=${this.text} @input=${this.onInput} />
    <custom-element .complexData=${this.dataObject}></custom-element>
  `;
}
```

### Boolean Attributes

Use `?attribute=${boolean}` for boolean attributes:

```typescript
@render()
renderContent() {
  return html`
    <button ?disabled=${this.isLoading}>Submit</button>
    <input type="checkbox" ?checked=${this.isChecked} />
  `;
}
```

### Conditionals

```typescript
@render()
renderContent() {
  return html`
    ${this.isLoggedIn
      ? html`<span>Welcome, ${this.user.name}!</span>`
      : html`<a href="/login">Login</a>`
    }
  `;
}
```

### Lists and Loops

```typescript
@render()
renderContent() {
  return html`
    <ul>
      ${this.items.map(item => html`
        <li>
          ${item.name}
          <button @click=${() => this.remove(item.id)}>Remove</button>
        </li>
      `)}
    </ul>
  `;
}
```

**Note:** For lists to trigger re-renders, reassign the array:
```typescript
// ✅ Good - triggers render
this.items = [...this.items, newItem];

// ❌ Bad - doesn't trigger render
this.items.push(newItem);
```

### Render Options

Control when and how renders happen:

```typescript
// Debounce renders (useful for search)
@render({ debounce: 300 })
renderContent() {
  return html`<div>Search: ${this.searchTerm}</div>`;
}

// Throttle renders (useful for scroll)
@render({ throttle: 100 })
renderContent() {
  return html`<div>Scroll: ${this.scrollY}</div>`;
}

// Render only once (manual control)
@render({ once: true })
renderContent() {
  return html`<div>Static: ${this.data}</div>`;
}

// Synchronous rendering (skip batching)
@render({ sync: true })
renderContent() {
  return html`<div>Immediate: ${this.value}</div>`;
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
  toggleButton!: HTMLElement;

  html() {
    return `<button class="toggle">OFF</button>`;
  }
  
  @on('click', '.toggle')
  @dispatch('toggled')
  toggle() {
    this.isOn = !this.isOn;
    this.toggleButton.textContent = this.isOn ? 'ON' : 'OFF';
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
const canEditUser: Guard<AppContext> = (ctx, params) => {
  const user = ctx.getUser();
  if (!user) return false;

  // params.id comes from route '/users/:id/edit'
  return ctx.hasPermission('users.edit', params.id);
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

interface IUserElement extends HTMLElement {
  setUsers(users: any[]): void;
}

@controller('user-controller')
class UserController {
  element!: IUserElement;

  async attach(element: IUserElement) {
    const response = await fetch('/api/users');
    const users = await response.json();
    element.setUsers(users);
  }

  async detach(element: IUserElement) { /* Cleanup */ }
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

## Layouts

Wrap your pages in shared layout components for consistent navigation, headers, and footers across your application.

### Basic Layout Usage

```typescript
import { Router, layout, page } from 'snice';

// Create a layout component
@layout('app-shell')
class AppShell extends HTMLElement {
  html() {
    return `
      <header>
        <nav>
          <a href="#/">Home</a>
          <a href="#/about">About</a>
        </nav>
      </header>
      <main>
        <slot name="page"></slot>
      </main>
      <footer>© 2024 My App</footer>
    `;
  }
}

// Configure router with default layout
const router = Router({
  target: '#app',
  type: 'hash',
  layout: 'app-shell'  // All pages use this layout by default
});

const { page, initialize } = router;

// Pages automatically render inside the layout
@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  html() {
    return `<h1>Home Content</h1>`;
  }
}

// Override layout per page
@page({ tag: 'full-page', routes: ['/fullscreen'], layout: false })
class FullPage extends HTMLElement {
  html() {
    return `<div>No layout wrapper</div>`;
  }
}

initialize();
```

### Layout Features

- **Shared wrapper**: Layout components wrap page content using `<slot name="page"></slot>`
- **Default layouts**: Set `layout: 'component-name'` in router options
- **Per-page override**: Use `layout: 'other-layout'` or `layout: false` in page options
- **Smooth transitions**: Layout persists during page transitions for better UX
- **Nested layouts**: Layouts can contain other layouts for complex structures

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
  element!: HTMLElement;
  
  @context()
  ctx?: AppContext;
  
  attach(element: HTMLElement) {
    // Context is available in controllers too
    if (!this.ctx?.isAuthenticated()) {
      window.location.hash = '#/login';
    }
  }
  
  detach(element: HTMLElement) { /* Cleanup */ }
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

## Lifecycle Callbacks

Snice provides decorators for advanced DOM lifecycle events that go beyond basic connected/disconnected callbacks:

### @moved Decorator

The `@moved` decorator runs methods when an element is moved within the DOM using `Element.moveBefore()`. This is useful for handling position changes without full disconnection/reconnection:

```typescript
@element('my-element')
class MyElement extends HTMLElement {
  @moved()
  onElementMoved() {
    console.log('Element moved to new position');
    this.updatePosition();
  }

  // With timing options
  @moved({ debounce: 100 })
  onMovedDebounced() {
    // Only called once after moves stop for 100ms
    this.recalculateLayout();
  }

  @moved({ throttle: 500 })
  onMovedThrottled() {
    // Called at most once every 500ms during rapid moves
    this.optimizePerformance();
  }
}
```

### @adopted Decorator

The `@adopted` decorator runs methods when an element is moved to a new document (like iframes or document fragments):

```typescript
@element('portable-element')
class PortableElement extends HTMLElement {
  @adopted()
  onAdoptedToNewDocument() {
    console.log('Element moved to new document');
    this.updateDocumentReferences();
  }

  // With timing options
  @adopted({ debounce: 200 })
  onAdoptedDebounced() {
    // Debounced for performance during rapid document moves
    this.reinitializeForNewContext();
  }
}
```

### Timing Options

Both decorators support the same timing options as `@part`:

- **`debounce`** - Delays execution until after calls stop for the specified milliseconds
- **`throttle`** - Limits execution to once per specified milliseconds

```typescript
// Examples of timing control
@moved({ debounce: 150 })    // Wait 150ms after moves stop
@adopted({ throttle: 300 })  // Maximum once per 300ms
```

These lifecycle callbacks are perfect for:
- **Performance optimization** during rapid DOM changes
- **Layout recalculation** when elements move
- **Context updates** when elements move between documents
- **Resource cleanup/setup** during document adoption

## Documentation

- [Elements API](./docs/elements.md) - Complete guide to creating elements with properties, queries, and styling
- [Controllers API](./docs/controllers.md) - Data fetching, business logic, and controller patterns
- [Events API](./docs/events.md) - Event handling, dispatching, and custom events
- [Request/Response API](./docs/request-response.md) - Bidirectional communication between elements and controllers
- [Routing API](./docs/routing.md) - Single-page application routing with transitions
- [Observe API](./docs/observe.md) - Lifecycle-managed observers for external changes

## License

MIT