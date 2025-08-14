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

### Event Decorators
- **`@on`** - Listens for events on elements
- **`@dispatch`** - Dispatches custom events after method execution
- **`@channel`** - Enables bidirectional communication between elements and controllers

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
    return `<button>Click me</button>`;
  }

  @on('click', 'button')
  handleClick() {
    console.log('Button clicked!');
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

## Channels

Bidirectional communication between elements and controllers:

```typescript
// Element sends request, controller responds
@element('user-profile')
class UserProfile extends HTMLElement {

  @channel('fetch-user')
  async *getUser() {
    const user = await (yield { userId: 123 });
    return user;
  }
  
  async connectedCallback() {
    const userData = await this.getUser();
    this.displayUser(userData);
  }
  
}

@controller('user-controller')
class UserController {

  @channel('fetch-user')
  async handleFetchUser(request: { userId: number }) {
    const response = await fetch(`/api/users/${request.userId}`);
    return response.json();
  }

}
```

## Documentation

- [Elements API](./docs/elements.md) - Complete guide to creating elements with properties, queries, and styling
- [Controllers API](./docs/controllers.md) - Data fetching, business logic, and controller patterns
- [Events API](./docs/events.md) - Event handling, dispatching, and custom events
- [Channels API](./docs/channels.md) - Bidirectional communication between elements and controllers
- [Routing API](./docs/routing.md) - Single-page application routing with transitions
- [Migration Guide](./docs/migration-guide.md) - Migrating from React, Vue, Angular, and other frameworks

## License

MIT