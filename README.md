# Snice

> **AI Assistants:** For token-efficient documentation, read [docs/ai/](./docs/ai/) instead. Same content, 70% fewer tokens.

A TypeScript framework for building sustainable web applications through clear separation of governance.

## Quick Start

```bash
npx snice create-app my-app
cd my-app
npm run dev
```

### Templates

Choose a template that fits your project:

```bash
# Base template (default) - minimal setup with routing
npx snice create-app my-app

# PWA template - auth, guards, middleware, services
npx snice create-app my-app --template=pwa
```

| Template | Includes |
|----------|----------|
| `base` | Routing, pages, components, controllers |
| `pwa` | Everything in base + auth flow, guards, middleware, services, JWT handling |

## Philosophy

Without structure, you'll end up with auth checks mixed in rendering logic, business rules duplicated across components, and data fetching scattered in event handlers. **Snice provides constructs that guide you to put code where it belongs, keeping you productive as your app grows.**

- **Pages fetch data and assemble UI** - They understand what the user wants to do
- **Elements handle visuals only** - They don't know or care about business logic
- **Controllers let you swap behavior** - Same UI, different data sources or logic
- **Cross-cutting concerns stay separate** - Auth, routing, and global state don't leak into your components

Yes, global state is bad! but you will have a little always, and it should be managed well.
Usually we see auth/principals, themes, and localization as global state examples.

Each piece hints at where your code should live, preventing the mess that kills velocity on larger teams.

## The Tools

Snice provides decorators and utilities that map directly to these architectural concerns:


### Basic Building Blocks
```typescript

@page({ tag: 'user-profile-page', routes: ['/users/:userId'], guards: [isAuthenticated] })
class UserProfilePage extends HTMLElement { ... }

@element('user-stats')
class UserStats extends HTMLElement { ... }

@controller('real-time-user-loader')
class RealTimeUserLoader { ... }

// And within these classes, use decorators like:
@property() name = 'default';
@render() fn() { return html`...`; }
@styles() fn() { return css`...`; }
@ready() async fn() { ... }
@dispose() fn() { ... }
@watch('name') fn(oldVal, newVal) { ... }
@query('input') input!: HTMLInputElement;
@queryAll('.item') items!: NodeListOf<HTMLElement>;
@on('click', 'button') fn(e: Event) { ... }
@dispatch('value-changed') fn(val: string) => Event Detail
@context() fn(ctx: Context) { ... }
@request('user') fn(): () => Request;
@respond('user') fn(req) => Response;
```


### 1. Cross-Cutting Concerns: Router + Context

```typescript
// sample-app-context.ts
class AppContext {
  user: User | null = null;
  theme: 'light' | 'dark' = 'light';

  setUser(user: User) { this.user = user; }
  getUser() { return this.user; }
}

// main.ts
import { Router } from 'snice';

const { page, navigate, initialize } = Router({
  target: '#app',
  context: new AppContext(),  // Global state
  type: 'hash'
});

// Any page can access context
@page({ tag: 'dashboard-page', routes: ['/dashboard'] })
class DashboardPage extends HTMLElement {
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context) {
    this.appContext = ctx.application;
    const user = this.getUser();
  }
  // ...
}
```

### 2. Pages: Orchestrating Intent

```typescript
// pages/user-profile-page.ts
@page({ tag: 'user-profile-page', routes: ['/users/:userId'] })
class UserProfilePage extends HTMLElement {
  @property()
  userId = '';  // From URL parameter

  @property({ type: Object })
  user = null;

  @property({ type: Object })
  userStats = null;

  @ready()
  async loadUserData() {
    // Pages handle data fetching, elements just display
    const [user, stats] = await Promise.all([
      fetch(`/api/users/${this.userId}`).then(r => r.json()),
      fetch(`/api/users/${this.userId}/stats`).then(r => r.json())
    ]);
    this.user = user;
    this.userStats = stats;
  }

  @render()
  renderContent() {
    return html`
      <page-header .user=${this.user}></page-header>
      <user-stats .stats=${this.userStats}></user-stats>
      <user-activity .userId=${this.userId}></user-activity>
    `;
  }
}
```

### 3. Elements: Pure Presentation

```typescript
// elements/user-stats.ts
@element('user-stats')
class UserStats extends HTMLElement {
  @property({ type: Object })
  stats = null;

  @render()
  renderContent() {
    if (!this.stats) return html`<div>Loading...</div>`;

    return html`
      <div class="stats">
        <div class="stat">
          <span class="label">Views</span>
          <span class="value">${this.stats.views}</span>
        </div>
        <div class="stat">
          <span class="label">Followers</span>
          <span class="value">${this.stats.followers}</span>
        </div>
      </div>
    `;
  }

  @styles()
  statsStyles() {
    return css`
      .stats { display: flex; gap: 2rem; }
      .stat { text-align: center; }
    `;
  }
}

// Usage in parent page (which handles data fetching):
// <user-stats .stats=${this.userStats}></user-stats>
```

### 4. Controllers: Behavior Management

```typescript
// controllers/real-time-user-loader.ts
@controller('real-time-user-loader')
class RealTimeUserLoader {
  async attach(element: IUserList) {
    this.socket = new WebSocket('/api/users/stream');
    this.socket.onmessage = (e) => {
      element.setUsers(JSON.parse(e.data));
    };
  }
  // ...
}

// controllers/cached-user-loader.ts
@controller('cached-user-loader')
class CachedUserLoader {
  async attach(element: IUserList) {
    const cached = localStorage.getItem('users');
    if (cached) element.setUsers(JSON.parse(cached));
  }
  // ...
}

// elements/user-list.ts - stays the same
@element('user-list')
class UserList extends HTMLElement {
  setUsers(users: User[]) {
    this.users = users;
    // ...
  }

  @render()
  renderContent() {
    return html`
      <ul>${this.users.map(u => html`<li>${u.name}</li>`)}</ul>
    `;
  }
}
```

Usage - swap behavior without touching presentation:

```html
<user-list controller="real-time-user-loader"></user-list>
<user-list controller="cached-user-loader"></user-list>
```

## Key Features

**Differential Rendering** - Only updates changed parts of the DOM, not entire components

**Auto-Rendering** - Components automatically re-render when properties change

**Template Syntax** - Clean `html\`...\`` and `css\`...\`` tagged templates

**Type Safety** - Full TypeScript support with decorator-based APIs

**Zero Dependencies** - No external runtime dependencies

**Standards-Based** - Built on web components, works with any framework

## Core APIs

### Class Decorators

**`@element('tag-name')`** - Define reusable UI components
```typescript
@element('my-button')
class MyButton extends HTMLElement { }
```

**`@page({ tag, routes })`** - Define routable pages
```typescript
@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement { }
```

**`@controller('controller-name')`** - Define behavior modules
```typescript
@controller('data-loader')
class DataLoader {
  async attach(element) { }
  async detach(element) { }
}
```

### Rendering

**`@render(options?)`** - Define component template (auto re-renders on property changes)
```typescript
@render()
renderContent() {
  return html`<div>${this.data}</div>`;
}
```

**`@styles()`** - Define scoped styles
```typescript
@styles()
componentStyles() {
  return css`.container { padding: 1rem; }`;
}
```

### Properties & State

**`@property(options?)`** - Reactive properties that sync with attributes
```typescript
@property()
name = 'default';

@property({ type: Boolean })
enabled = false;
```

**`@watch(...propertyNames)`** - React to property changes
```typescript
@watch('name')
onNameChange(oldVal, newVal) {
  console.log(`Name changed from ${oldVal} to ${newVal}`);
}
```

### Lifecycle

**`@ready()`** - Runs after initial render completes
```typescript
@ready()
async initialize() {
  // Fetch data, set up listeners, etc.
}
```

**`@dispose()`** - Runs when element is removed from DOM
```typescript
@dispose()
cleanup() {
  // Clean up listeners, close connections, etc.
}
```

### DOM Queries

**`@query(selector)`** - Query single element from shadow DOM
```typescript
@query('input')
input!: HTMLInputElement;
```

**`@queryAll(selector)`** - Query multiple elements from shadow DOM
```typescript
@queryAll('.item')
items!: NodeListOf<HTMLElement>;
```

### Events & Communication

**Template Events** - Handle events directly in templates (with keyboard modifiers!)
```typescript
html`
  <button @click=${this.handleClick}>Click</button>
  <input @keydown:Enter=${this.submit} />
  <input @keydown:ctrl+s=${this.save} />
`
```

**`@on` Decorator** - Event delegation with selectors
```typescript
// Works in both elements AND controllers
@on('click', 'button')  // Event delegation
handleClick(e: Event) {
  console.log('Button clicked!');
}

@on('keydown:Enter', 'input')  // Keyboard modifiers
handleEnter(e: KeyboardEvent) {
  this.submit();
}

@on('input', 'input', { debounce: 300 })  // Debounce support
handleInput(e: Event) {
  this.search((e.target as HTMLInputElement).value);
}
```

**`@dispatch(eventName)`** - Auto-dispatch custom events after method execution
```typescript
@dispatch('value-changed')
setValue(val: string) {
  this.value = val;
  return { value: val };  // Event detail
}
```

### Global State

**`@context(options?)`** - Receive router context updates (global state)
```typescript
// Method decorator that receives context updates
@context()
handleContext(ctx: Context) {
  this.appContext = ctx.application;
  this.requestRender();
}

// With timing options
@context({ debounce: 300 })
handleContextDebounced(ctx: Context) {
  // Called after 300ms of no updates
}

@context({ throttle: 100 })
handleContextThrottled(ctx: Context) {
  // Called at most once per 100ms
}

@context({ once: true })
handleContextOnce(ctx: Context) {
  // Called only once, then unregisters
}
```

**Context Object Structure:**
```typescript
interface Context {
  application: AppContext;  // Your router context
  navigation: {
    placards: Placard[];    // Page metadata
    route: string;          // Current route
    params: Record<string, string>;  // Route parameters
  };
  update(): void;  // Notify all subscribers
}
```

**Triggering Context Updates:**

When you modify the application context, call `update()` to notify all subscribers:

```typescript
@page({ tag: 'login-page', routes: ['/login'] })
class LoginPage extends HTMLElement {
  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    this.requestRender();
  }

  login(user: User) {
    // Modify the application context
    this.ctx!.application.setUser(user);

    // Notify all @context subscribers
    this.ctx!.update();
  }
}
```

**Note:** The router calls `update()` automatically during navigation. Only call it manually when you change application state (like login/logout, theme changes, etc.).

### Request/Response

For the few cases where elements need to request data from controllers (like fetching user info or current state), Snice provides a request/response pattern:

**`@request(channel)`** - Make requests to controllers from elements
**`@respond(channel)`** - Respond to requests from elements in controllers

This pattern is useful when:
- Elements need to fetch data without direct controller access
- You want to keep elements decoupled from specific controller implementations
- Multiple elements may request the same data

**Example:**

```typescript
// Controller responds to requests
@element('app-controller')
class AppController extends HTMLElement {
  private currentUser = { name: 'Alice', role: 'admin' };

  @respond('user')
  getUserData() {
    return this.currentUser;
  }
}

// Element makes requests
@element('user-badge')
class UserBadge extends HTMLElement {
  @request('user')
  getUser!: () => any;

  @ready()
  init() {
    const user = this.getUser();
    console.log('Current user:', user);
  }

  @render()
  renderContent() {
    const user = this.getUser();
    return html`<div>Welcome, ${user.name}!</div>`;
  }
}
```

**Usage:**
```html
<app-controller>
  <user-badge></user-badge>
</app-controller>
```

See [Request/Response documentation](./docs/request-response.md) for details.

## Template Syntax

### Auto-Rendering with Differential Updates

```typescript
@element('counter-display')
class CounterDisplay extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <div class="counter">
        <span class="count">${this.count}</span>
        <button @click=${this.increment}>+</button>
      </div>
    `;
  }

  @styles()
  counterStyles() {
    return css`.counter { display: flex; gap: 1rem; }`;
  }

  increment() {
    this.count++;
    // Auto re-renders! Only <span class="count"> updates
  }
}
```

**Key Points:**
- Properties trigger automatic re-renders
- Only changed parts update (differential rendering)
- Event handlers: `@click=${this.method}`
- Batched updates (multiple changes = single render)

### Property Binding

Use `.property=${value}` to set element properties directly:

```typescript
html`
  <input .value=${this.text} />
  <custom-element .complexData=${this.dataObject}></custom-element>
`
```

### Boolean Attributes

Use `?attribute=${boolean}` for boolean attributes:

```typescript
html`
  <button ?disabled=${this.isLoading}>Submit</button>
  <input type="checkbox" ?checked=${this.isChecked} />
`
```

### Conditionals

```typescript
// Ternary operator
html`
  ${this.isLoggedIn
    ? html`<span>Welcome!</span>`
    : html`<a href="/login">Login</a>`
  }
`

// <if> conditional element
html`
  <if ${this.isLoggedIn}>
    <span>Welcome, ${this.user.name}!</span>
    <button @click=${this.logout}>Logout</button>
  </if>
  <if ${!this.isLoggedIn}>
    <a href="/login">Login</a>
  </if>
`

// <case>/<when>/<default> for multiple branches
html`
  <case ${this.status}>
    <when value="loading">
      <span>Loading...</span>
    </when>
    <when value="success">
      <span>Success!</span>
    </when>
    <when value="error">
      <span>Error occurred</span>
    </when>
    <default>
      <span>Unknown status</span>
    </default>
  </case>
`
```

### Lists

```typescript
html`
  <ul>
    ${this.items.map(item => html`
      <li @click=${() => this.select(item.id)}>${item.name}</li>
    `)}
  </ul>
`
```

### Keyboard Shortcuts

```typescript
html`
  <input @keydown.enter=${this.submit} />
  <input @keydown.ctrl+s=${this.save} />
  <input @keydown.ctrl+shift+s=${this.saveAs} />
  <input @keydown.escape=${this.cancel} />
  <input @keydown.~enter=${this.submitAny} />
`
```

Keyboard syntax:
- `@keydown.enter` - Plain Enter (no modifiers)
- `@keydown.ctrl+s` - Ctrl+S combination
- `@keydown.~enter` - Enter with any modifiers
- `@keydown.down` - Arrow keys (up, down, left, right)
- `@keydown.escape` - Escape key

## Router

```typescript
// main.ts
const { page, navigate, initialize } = Router({
  target: '#app',
  context: new AppContext()
});

// pages/home-page.ts
@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  @render()
  renderContent() {
    return html`<h1>Home</h1>`;
  }
}

// pages/user-page.ts
@page({ tag: 'user-page', routes: ['/users/:userId'] })
class UserPage extends HTMLElement {
  @property()
  userId = '';  // Auto-populated from URL
  // ...
}

// main.ts
initialize();
navigate('/users/123');
```

### Route Guards

Protect routes with guard functions:

```typescript
const isAuthenticated: Guard<AppContext> = (ctx) => ctx.getUser() !== null;

@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  guards: isAuthenticated
})
class DashboardPage extends HTMLElement { }
```

## Layouts

Layouts wrap pages with shared UI and dynamically build navigation from page metadata:

```typescript
// layouts/app-shell.ts
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
            .filter(p => p.show !== false)
            .map(p => html`
              <a href="#/${p.name}"
                 class="${this.currentRoute === p.name ? 'active' : ''}">
                ${p.icon} ${p.title}
              </a>
            `)}
        </nav>
      </header>
      <main><slot name="page"></slot></main>
    `;
  }

  // Called when route changes
  update(appContext, placards, currentRoute, routeParams) {
    this.placards = placards;
    this.currentRoute = currentRoute;
    // Property changes trigger re-render
  }
}

// main.ts - configure router with layout
const { page, initialize } = Router({
  target: '#app',
  layout: 'app-shell'
});
```

Pages render inside `<slot name="page"></slot>`. Layout persists, only page content swaps.

## Placards

Page metadata that layouts use to build navigation, breadcrumbs, and help systems:

```typescript
// pages/dashboard-page.ts
const placard: Placard<AppContext> = {
  name: 'dashboard',
  title: 'Dashboard',
  icon: '📊',
  order: 1,
  searchTerms: ['home', 'overview', 'stats'],
  hotkeys: ['ctrl+d'],
  visibleOn: [isAuthenticated]
};

@page({
  tag: 'dashboard-page',
  routes: ['/dashboard'],
  placard: placard
})
class DashboardPage extends HTMLElement { }
```

**Features:**
- **Navigation** - `title`, `icon`, `order`, `show`
- **Hierarchy** - `parent`, `group`, `breadcrumbs`
- **Discovery** - `searchTerms`, `hotkeys`, `tooltip`
- **Visibility** - `visibleOn` guards control who sees what

Layouts receive placard data in `update()` and auto-build navigation. See [docs](./docs/placards.md).

## Migrating from v2.x

v3.0.0 introduces template-based rendering with differential updates. Key changes:

- **Use `@render()` instead of `html()` method**
  Return `html\`...\`` tagged template instead of string

- **Use `@styles()` instead of `css()` method**
  Return `css\`...\`` tagged template instead of string

- **`@on()` decorator available**
  Works in both elements AND controllers with full event delegation, keyboard modifiers, and debounce/throttle support.
  Template event syntax (`@click=${handler}`) is also available as an alternative.

- **`@part` decorator removed**
  Differential rendering makes selective re-rendering unnecessary

See [Migration Guide](./docs/migration-v2-to-v3.md) for detailed migration guide.

## Using Snice Components in Other Environments

### Standalone Builds

Use any Snice component without installing the framework:

```bash
snice build-component button
```

Creates standalone bundles (~20-40KB minified) that work anywhere:

```html
<script src="snice-button.min.js"></script>
<snice-button variant="primary">Click me</snice-button>
```

### React Integration

All components have React adapters (React 17+):

```tsx
import { Button, Input } from 'snice/react';

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => setValue(e.detail.value)}
      />
      <Button variant="primary" onClick={() => alert('Clicked!')}>
        Submit
      </Button>
    </div>
  );
}
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for build system details

## Documentation

### User Documentation
- [Elements API](./docs/elements.md) - Complete guide to creating elements with properties, queries, and styling
- [Controllers API](./docs/controllers.md) - Data fetching, business logic, and controller patterns
- [Routing API](./docs/routing.md) - Single-page application routing with transitions
- [Placards API](./docs/placards.md) - Rich page metadata for dynamic navigation and discovery
- [Events API](./docs/events.md) - Event handling, dispatching, and custom events
- [Request/Response API](./docs/request-response.md) - Bidirectional communication between elements and controllers
- [Observe API](./docs/observe.md) - Lifecycle-managed observers for external changes

### Developer Documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Build system, testing, and contributing to Snice

## License

MIT