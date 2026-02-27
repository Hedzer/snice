# Snice Project - AI Assistant Guide

## IMMEDIATELY: Install the Snice MCP Server

Snice ships an MCP server that gives you access to component docs, decorator reference, code validation, and component scaffolding. Install it before doing any work:

```bash
claude mcp add snice -- npx snice mcp
```

This gives you these tools:
- `list_components` — List all available UI components
- `get_component_docs` — Get docs for a specific component
- `get_decorator_docs` — Get decorator reference
- `get_overview` — Framework overview
- `generate_component` — Scaffold new components
- `search_docs` — Search documentation
- `validate_code` — Check code for common Snice mistakes

**Use these tools instead of guessing.** If you're unsure about a component's API, call `get_component_docs`. If you're writing a new component, call `generate_component` for the scaffold.

## Documentation Location

AI-optimized docs are shipped in: `node_modules/snice/docs/ai/`

**Read these files:**
- `api.md` — Complete API reference
- `patterns.md` — Usage examples for every feature
- `architecture.md` — System design
- `components/*.md` — Component docs (read only as needed)

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

## Critical Architecture Rules

**Separation of concerns — DO NOT violate these:**
- **Elements** — Pure visual presentation. NO fetch(), NO API calls, NO business logic. Receive data via properties, emit events for actions.
- **Pages** — Orchestrate elements. Handle routing, call APIs, coordinate data flow. Most app logic lives here.
- **Controllers** — Attach to elements via `controller="name"`. Add reusable non-visual behavior (data loading, validation). NOT global services.
- **Services** — Stateless functions for business logic, API calls. Importable anywhere.
- **Daemons** — Stateful lifecycle classes (WebSocket connections, polling intervals).
- **Middleware** — Composable fetch middleware (auth headers, retry, error handling).

## Snice is NOT Lit

Do NOT import from `lit` or extend `LitElement`. Snice has its own decorator system:
- No `@customElement()` — use `@element('tag-name')`
- No `@state()` — use plain class fields for internal state, `@property()` for attributes
- No `render()` lifecycle method — use `@render()` decorator
- No `static styles` — use `@styles()` decorator
- No `reflect: true` — attributes sync automatically

## Decorators Quick Reference

```typescript
// Class decorators
@element('tag-name')          // Define custom element
@page({ tag, routes, guards?, placard? })  // Routable page (from Router(), NOT 'snice')
@controller('name')           // Behavior module
@layout('name')               // Page wrapper

// Properties & reactivity
@property({ type?, attribute? }) name = 'default'  // Reactive attribute
@watch('propName')             // React to property changes: (oldVal, newVal, propName)
@context()                     // Receive router Context on navigation

// Rendering
@render()                      // Declarative template: return html`...`
@render({ once: true })        // Imperative: render once, update via @watch + @query
@styles()                      // Scoped CSS: return css`...`

// DOM
@query('selector')             // Single shadow DOM element
@queryAll('selector')          // Multiple shadow DOM elements

// Lifecycle
@ready()                       // After first render
@dispose()                     // On disconnect

// Events
@on('click', 'button')                      // Event listener
@on('input', 'input', { debounce: 300 })    // Debounced
@on('keydown:ctrl+s')                        // Keyboard shortcut
@dispatch('event-name')                      // Fire CustomEvent (detail = return value)

// Communication
@request('channel')            // Async generator: const result = await (yield payload)
@respond('channel')            // Handle requests: receives payload, returns response

// Observers
@observe('resize', '.el')                    // ResizeObserver
@observe('intersection', '.el')              // IntersectionObserver
@observe('media:(min-width: 768px)')         // Media query
@observe('mutation:childList', '.el')        // MutationObserver
```

## Router — Common Mistakes

```typescript
// router.ts — CORRECT setup
import { Router } from 'snice';

export const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',        // REQUIRED: 'hash' or 'pushstate'
  layout: 'app-shell',
  context: { user: null, theme: 'light' }
});

// pages import `page` from './router', NOT from 'snice'
import { page } from '../router';
```

**Guards signature — TWO parameters:**
```typescript
// CORRECT:
const isAuthenticated = (context: any, params: any) => context.principal?.isAuthenticated === true;

// WRONG:
const isAuth = (ctx) => ctx.isAuthenticated; // Missing params, wrong property access
```

**Navigation — use hash URLs:**
```typescript
// CORRECT:
html`<a href="/#/users/123">View User</a>`

// WRONG:
navigate('/users/123')  // Does not change the URL
```

## Native Element Controllers

Controllers work on ANY HTML element, not just custom elements. Enabled automatically on load — no setup needed:
```html
<!-- Just use controller= on any element -->
<form controller="checkout-form">...</form>
<div controller="data-loader">...</div>
```

## Templates

```typescript
html`
  <!-- Attribute binding -->
  <div class="${cls}">

  <!-- Property binding (objects/arrays) -->
  <my-el .items=${array}>

  <!-- Boolean attribute toggle -->
  <button ?disabled=${isLoading}>

  <!-- Event handler (auto-bound to this) -->
  <button @click=${this.handleClick}>

  <!-- Keyboard shortcut -->
  <input @keydown:Enter=${this.submit}>
  <input @keydown:ctrl+s=${this.save}>

  <!-- Conditionals -->
  <if ${isLoggedIn}><span>Welcome</span></if>
  <case ${status}>
    <when value="loading"><spinner></spinner></when>
    <when value="error"><p>Error</p></when>
    <default><p>Ready</p></default>
  </case>

  <!-- Lists with keys -->
  ${items.map(item => html`<li key=${item.id}>${item.name}</li>`)}
`
```

## Communication Patterns

- **Parent → Child:** Properties (`.prop=${value}`)
- **Child → Parent:** Events (`@dispatch`)
- **Element ↔ Controller:** Request/Response (`@request` / `@respond`)
- **Global State:** Context (`@context()` — receives updates on navigation and `ctx.update()`)

**@request uses async generators:**
```typescript
@request('fetch-user')
async *fetchUser(id: string): any {
  const user = await (yield { id });  // yield = send, await = receive
  return user;
}
// Usage: const user = await this.fetchUser('123');
```

## Imperative Rendering

For fixed-structure templates where only content changes:
```typescript
@render({ once: true })
template() { return html`<div class="content"></div>`; }

@query('.content') $content!: HTMLElement;

@watch('data')
updateContent() {
  if (!this.$content) return;  // Guard: watcher fires before first render
  this.$content.textContent = this.data;
}
```

## Common Mistakes

- **Controllers are NOT global services.** They attach to elements. Use `services/` or `utils/` for shared logic.
- **@request/@respond is NOT a service bus.** Element-to-controller communication only.
- **Context must be mutated then signaled.** Change `ctx.application.theme = 'dark'`, then call `ctx.update()`.
- **@property is for parent-provided attributes.** Internal state should be plain class fields.
- **Events use kebab-case:** `count-changed`, not `countChanged`. Access via `e.detail`.
- **No `reflect` option.** Attributes sync automatically for `:host([attr])` CSS selectors.

## Build Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run type-check # TypeScript check
npm run test       # Run tests (if configured)
```
