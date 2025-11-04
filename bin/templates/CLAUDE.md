# Snice Project - AI Assistant Guide

## Documentation Location

AI-optimized docs shipped in: `node_modules/snice/docs/ai/`

**Read these files:**
- `api.md` - Complete API reference
- `patterns.md` - Usage examples
- `architecture.md` - System design
- `components/*.md` - Component docs (read only as needed)

## Project Structure

```
src/
  pages/          # @page decorated route components
  components/     # @element decorated UI components
  controllers/    # @controller decorated behavior modules
  utils/          # Pure functions, helpers (formatDate, debounce)
  services/       # Stateless static functions for business logic/external APIs
  daemons/        # Stateful classes with lifecycle (start/stop/dispose)
  middleware/     # Composable middleware (fetch, logging, etc)
  guards/         # Route guards
  types/          # TypeScript types
  styles/         # Global CSS
```

**Separation of concerns:**
- **Pages** - Orchestrate elements, handle URLs, most logic happens here
- **Components** - Pure presentation, no business logic
- **Controllers** - Attach to elements, add business behavior unsuitable for the page or components
- **Services** - Stateless business logic, API calls
- **Daemons** - Lifecycle-managed (WebSocket, P2P, intervals)
- **Middleware** - Composable functions (auth, retry)
- **Utils** - Pure helper functions

## Decorators

```typescript
// Class decorators
@page({ tag, routes, guards?, placard? })
@element('tag-name')
@controller('name')
@layout('name')

// Property/method decorators
@property() name = 'default'
@render() fn() { return html`...` }
@styles() fn() { return css`...` }
@ready() async fn() { ... }
@dispose() fn() { ... }
@watch('name') fn(oldVal, newVal) { ... }
@query('input') input!: HTMLInputElement
@queryAll('.item') items!: NodeListOf<HTMLElement>
@on('click', 'button') fn(e: Event) { ... }
@dispatch('value-changed') fn(val: string) => Event Detail
@context() fn(ctx: Context) { ... }
@request('user') fn(): () => Request
@respond('user') fn(req) => Response
@observe(() => this.el, options) fn(mutations) { ... }
```

## Quick Examples

**Element:**
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
    return css`:host { display: block; }`;
  }
}
```

**Page:**
```typescript
@page({ tag: 'user-page', routes: ['/users/:id'] })
class UserPage extends HTMLElement {
  @property() id = '';

  @ready()
  async load() {
    const user = await fetch(`/api/users/${this.id}`).then(r => r.json());
  }
}
```

**Controller:**
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

**Lists:**
```typescript
html`
  ${items.map(item => html`
    <li key=${item.id}>${item.name}</li>
  `)}
`
```

**Conditionals:**
```typescript
html`
  <if ${condition}>Content</if>
`
```

## Communication

- **Parent → Child:** Properties (`.prop=${value}`)
- **Child → Parent:** Events (`@dispatch`)
- **Element ↔ Controller:** Request/Response (`@request`, `@respond`)
- **Global State:** Context (`@context()`)

**Event Handling:**
All component events use unprefixed names (e.g., `tab-change`, `menu-open`):
```typescript
// Listening to events:
html`<snice-tabs @tab-change=${handler}></snice-tabs>`

// Dispatching events:
@dispatch('tab-change')
handleChange() { return { index: 0 }; }
```

## Navigation

**Use hash-based URLs, NOT router.navigate():**
```typescript
// Correct:
html`<a href="/#/users/123">View User</a>`
window.location.hash = '#/users/123'

// Wrong:
router.navigate('/users/123')
```
`router.navigate()` does not change the URL.

## Common Mistakes

**Controllers are NOT global services.** They attach to elements via `controller="name"`. Use `utils/` for shared logic like API calls, auth, toasts.

**@request/@respond is NOT a service bus.** It's for element-to-element or element-to-controller communication only. Use utility functions for app-wide features.

**Guards receive Context, not AppContext.** Check `ctx.application.property`, not `ctx.property`. Guards: `(ctx: Context) => boolean`

**Context must be mutated then updated.** After changing `ctx.application`, call `ctx.update()` to notify subscribers. Pages need `@context()` to get context reference.

**@property is for parent-provided attributes.** Internal component state should be regular properties, not decorated. Only use `@property()` when the value comes from a parent element via attributes.

## Build Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run type-check # TypeScript check
```
