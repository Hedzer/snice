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
  styles/         # Global CSS
```

**Separation of concerns:**
- **Pages** - Orchestrate elements, handle URLs
- **Elements** - Pure presentation, no business logic
- **Controllers** - Behavior, data fetching, swappable

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

## Build Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run type-check # TypeScript check
```
