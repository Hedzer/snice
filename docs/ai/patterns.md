# Common Patterns

## Element
```typescript
@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number }) count = 0;

  @render()
  renderContent() {
    return html`
      <div>${this.count}</div>
      <button @click=${() => this.count++}>+</button>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host { display: block; }
      :host([variant="primary"]) { background: blue; }
      :host([disabled]) { opacity: 0.5; }
    `;
  }
}
```

## Controller
```typescript
@controller('data-loader')
class DataLoader implements IController {
  element: HTMLElement;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @on('click', '.item')
  handleClick(e: Event) {}
}

// Usage: <my-list controller="data-loader"></my-list>
```

## Page + Router

**Module Structure (avoids circular imports):**
```typescript
// router.ts - creates and exports router pieces
import { Router } from 'snice';

interface AppContext { user: { name: string } | null; theme: string; }

export const { page, navigate, initialize } = Router({
  target: '#app',
  context: { user: null, theme: 'light' } as AppContext,
  layout: 'app-shell'
});
export type { AppContext };

// main.ts - imports pages, initializes
import './pages/home-page';  // side-effect import
import './pages/user-page';
import { initialize } from './router';
initialize();

// pages/user-page.ts - imports page from router
import { page } from '../router';  // NOT from 'snice'!
```

**Page with Context:**
```typescript
@page({ tag: 'user-page', routes: ['/users/:id'], guards: isAuth })
class UserPage extends HTMLElement {
  @property() id = '';
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context) {
    this.appContext = ctx.application;
    this.requestRender();
  }

  @ready()
  async load() {
    const user = await fetch(`/api/users/${this.id}`).then(r => r.json());
    // ...
  }
}
```

## Layout
```typescript
@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  placards: Placard[] = [];
  route = '';

  @render()
  renderContent() {
    return html`
      <nav>${this.placards.map(p => html`<a href="#/${p.name}">${p.title}</a>`)}</nav>
      <slot name="page"></slot>
    `;
  }

  update(ctx, placards, route, params) {
    this.placards = placards;
    this.route = route;
  }
}
```

## Request/Response
```typescript
// Controller responds to requests (receives payload, returns result directly)
@controller('api')
class API {
  @respond('fetch-user')
  async handleFetchUser(payload: { id: string }) {
    const user = await fetch(`/api/users/${payload.id}`).then(r => r.json());
    return user;  // Direct return, not callback
  }
}

// Element makes requests (async generator: yield sends, await receives)
@element('user-profile')
class UserProfile extends HTMLElement {
  @request('fetch-user')
  async *fetchUser(id: string): any {
    const user = await (yield { id });  // yield = send request, await = get response
    return user;
  }

  async loadUser(id: string) {
    const user = await this.fetchUser(id);  // Returns Promise
  }
}

// Wiring: <user-profile controller="api"></user-profile>
```

## Fetch with Middleware

```typescript
import { Router, ContextAwareFetcher } from 'snice';

const fetcher = new ContextAwareFetcher();

// Request middleware - modify request before fetch
fetcher.use('request', function(request, next) {
  const token = this.application.user?.token;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return next();
});

// Response middleware - handle response after fetch
fetcher.use('response', async function(response, next) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return next();
});

const router = Router({
  target: '#app',
  context: { user: null },
  fetcher
});

// In pages
@page({ tag: 'user-page', routes: ['/users/:id'] })
class UserPage extends HTMLElement {
  private ctx: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @ready()
  async load() {
    const user = await this.ctx.fetch('/api/users/123').then(r => r.json());
  }
}
```

## Conditional Rendering
```typescript
html`
  <if ${isLoggedIn}>
    <span>Welcome, ${user.name}</span>
  </if>
  <if ${!isLoggedIn}>
    <a href="/login">Login</a>
  </if>

  <case ${status}>
    <when value="loading"><spinner></spinner></when>
    <when value="error"><error-msg></error-msg></when>
    <default><content></content></default>
  </case>
`
```

## Lists + Keys
```typescript
html`
  <ul>
    ${items.map(item => html`
      <li key=${item.id}>
        ${item.name}
        <button @click=${() => this.remove(item.id)}>×</button>
      </li>
    `)}
  </ul>
`
```

## Form Binding
```typescript
@element('my-form')
class MyForm extends HTMLElement {
  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @render()
  renderContent() {
    return html`
      <input
        .value=${this.value}
        ?disabled=${this.disabled}
        @input=${(e: Event) => {
          this.value = (e.target as HTMLInputElement).value;
          this.dispatchValueChange();
        }}
      />
    `;
  }

  @dispatch('value-changed')
  dispatchValueChange() {
    return { value: this.value };
  }
}
```

## Keyboard Shortcuts
```typescript
@element('editor')
class Editor extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <textarea
        @keydown:ctrl+s=${this.save}
        @keydown:ctrl+z=${this.undo}
        @keydown:escape=${this.close}
      ></textarea>
    `;
  }

  @on('keydown:ctrl+shift+s')
  saveAs() {}
}
```

## Imperative Rendering

Render template once, update DOM manually via `@watch` + `@query`.

```typescript
@element('user-card')
class UserCard extends HTMLElement {
  @property() name = '';
  @property() role = '';

  @query('.name') $name!: HTMLElement;
  @query('.role') $role!: HTMLElement;

  @render({ once: true })
  template() {
    return html`
      <div class="card">
        <h3 class="name">${this.name}</h3>
        <span class="role">${this.role}</span>
      </div>
    `;
  }

  @watch('name', 'role')
  update() {
    if (!this.$name) return;
    this.$name.textContent = this.name;
    this.$role.textContent = this.role;
  }
}
```

**Key behaviors:**
- `once: true` → template renders on first connect, all subsequent re-renders blocked
- `@watch` fires synchronously in property setter, before `requestRender` (which is blocked)
- `@query` re-queries shadow DOM on each access — never stale
- Initial render uses interpolated values, so DOM starts correct
- Guard against missing refs: `if (!this.$name) return` (watcher may fire before first render)

**Use when:**
- Template structure is fixed — only content changes
- Updates are expensive (syntax highlighting, canvas, etc.)
- You need precise control over what changes and when
- Coordinating async operations without re-render interference

## Watchers
```typescript
@element('data-viewer')
class DataViewer extends HTMLElement {
  @property() userId = '';
  @property() data = null;

  @watch('userId')
  async onUserIdChange(oldId, newId) {
    if (newId) {
      this.data = await fetch(`/api/users/${newId}`).then(r => r.json());
    }
  }
}
```

## Observers
```typescript
@element('resize-detector')
class ResizeDetector extends HTMLElement {
  // Watch for DOM mutations
  @observe('mutation:childList', '.content')
  handleMutation(mutations: MutationRecord[]) {
    console.log('Content changed', mutations);
  }

  // Watch for element resize
  @observe('resize', '.chart')
  handleResize(entries: ResizeObserverEntry[]) {
    console.log('Size changed', entries[0].contentRect);
  }

  // Watch for viewport visibility
  @observe('intersection', '.lazy', { threshold: 0.1 })
  handleVisible(entries: IntersectionObserverEntry[]) {
    if (entries[0].isIntersecting) this.loadContent();
  }

  // Watch for media query changes
  @observe('media:(min-width: 768px)')
  handleMediaChange(matches: boolean) {
    this.isDesktop = matches;
  }
}
```

## Debounce/Throttle
```typescript
@element('search-box')
class SearchBox extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <input @input=${this.search} />
    `;
  }

  @on('input', 'input', { debounce: 300 })
  search(e: Event) {
    const query = (e.target as HTMLInputElement).value;
    // Debounced search
  }
}
```
