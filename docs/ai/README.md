# AI-Optimized Documentation

Token-efficient reference docs for AI assistants. Same content as human docs, minimal verbosity.

**Format:**
- Type signatures over prose
- Bullet points over paragraphs
- Code over explanations
- No tutorials, pure reference

**Files:**
- `api.md` - Complete API reference
- `decorators.md` - Quick decorator reference
- `patterns.md` - Common usage patterns
- `react-integration.md` - React router, hooks, guards, context
- `architecture.md` - System design
- `components/*.md` - Component reference (DO NOT read all upfront - read only as needed)

Read these instead of `/docs/*.md` for faster context loading.

**WIP Components:** Some component folders exist but are not available in builds or MCP output. The source of truth is `components/.wip` (one directory name per line).

## CLI

```bash
# Create project from template
npx snice create-app my-app --template=base
npx snice create-app my-app --template=pwa

# Run MCP server
npx snice mcp
```

**Note:** Use `--template=base` (equals), not `--template base` (space).

## MCP Server

Snice includes an MCP server for AI-assisted development.

**Connect in Claude Code:**
```bash
claude mcp add snice -- npx snice mcp
```

**Tools provided:**
- `list_components` - List all UI components
- `get_component_docs` - Get component documentation
- `get_decorator_docs` - Get decorator reference
- `get_overview` - Framework overview
- `generate_component` - Scaffold new components
- `search_docs` - Search documentation
- `validate_code` - Check code for common mistakes

## Pitfalls

**Decorators:**
- No `@state()` decorator exists
- No `@customElement()` - Use `@element('tag-name')`
- `@property()` is for attributes from parent AND reactive state in pages
- Components re-render on any property change (decorated or not)

**Architecture:**
- **Elements are purely visual** - no fetch(), no API calls, no backend logic
- Elements receive data via properties, emit events for actions
- **Pages orchestrate** - handle routing, call APIs, coordinate elements
- **Controllers add behavior** - attach to elements for reusable non-visual logic
- Put API calls in pages/controllers/services, not in elements

**Properties:**
- Boolean attrs: `"false"` string → `false` (not standard HTML)
- Non-strings need type: `@property({ type: Number })` not just `@property()`
- Union types use String: `@property() variant: 'a' | 'b' = 'a'` (type hint optional)
- **No `reflect` option** - `@property({ reflect: true })` does NOT exist (Lit concept, not snice)
- Attributes sync automatically for styling with `:host([attr])`

**Templates:**
- `.prop=${val}` for objects/arrays, `attr="${val}"` for strings
- `?attr=${bool}` toggles attribute presence
- `@event=${fn}` handlers are auto-bound to `this`

**Events:**
- kebab-case names: `count-changed` not `countChanged`
- Single words OK: `dismiss`, `select`, `change`
- Access data via `e.detail.value` not `e.target.value`

**Components:**
- Side-effect import: `import 'snice/components/button/snice-button'`
- NOT: `import { Button } from 'snice/components/button'`
- Import in app entry point (main.ts), not individual pages
- `?open` toggles attribute; `show()`/`hide()` for imperative control

**Event Types:**
- Use `CustomEvent` type: `(e: CustomEvent) => void`
- NOT `Event` - snice events always carry detail payload

**Testing:**
- `await el.ready` before assertions
- Use `el.shadowRoot.querySelector()` for shadow DOM

**Manual setup (no template):**
- Requires bundler: Vite, esbuild, or Rollup (not tsc alone)
- **Snice is NOT Lit** - Don't import from `lit` or extend `LitElement`
- tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": false,
    "useDefineForClassFields": false
  }
}
```
- package.json: `"type": "module"`
- Minimal component:
```typescript
import { element, property, render, styles, html, css } from 'snice';

@element('my-counter')
class MyCounter extends HTMLElement {
  @property({ type: Number }) count = 0;

  @styles()
  componentStyles() {
    return css`:host { display: block; }`;
  }

  @render()
  template() {
    return html`<button @click=${() => this.count++}>${this.count}</button>`;
  }
}
```

**Pages (router):**
- `page` decorator comes from `Router()`, NOT from 'snice' exports
- Create router.ts: `export const { page, navigate, initialize } = Router({...})`
- Pages import: `import { page } from './router'`
- Use `@property()` for reactive state, plain fields for non-reactive
- `@context()` receives Context on navigation

**Guards:**
- Signature: `(context: AppContext, params: RouteParams) => boolean`
- TWO params: context (raw AppContext) and route params
- Return `true` to allow, `false` renders 403 page
- NO async guards, NO string redirects (boolean only)
- Multiple guards use AND logic, short-circuit on first false
- Example: `(ctx, params) => ctx.user !== null`
- Factory: `const hasRole = (role) => (ctx, params) => ctx.user?.role === role`

**Custom AppContext Types:**
- Snice's `AppContext` interface has: `theme?`, `locale?`, `principal?`, `config?`
- For custom fields (like `user`), extend snice's AppContext:
  ```typescript
  import type { AppContext as SniceAppContext } from 'snice';
  export interface MyAppContext extends SniceAppContext { user: User | null; }
  ```
- Define your context type in router.ts and export it for use in pages/guards
- Guards receive raw context - cast or use `any`: `(ctx: any) => ctx.user !== null`

**Layouts:**
- Layout `update()` receives `AppContext` - cast to your type inside:
  ```typescript
  update(app: AppContext, placards, route, params) {
    const myApp = app as MyAppContext;
    this.user = myApp.user;
  }
  ```
- `@context()` in layouts receives full `Context` (use `ctx.application as MyAppContext`)

**Router:**
- `type: 'hash' | 'pushstate'` is REQUIRED
- `Router({ target: '#app', type: 'hash', context: {...}, layout: 'app-shell' })`
- Router returns `{ page, navigate, initialize }` - NOT Context
- Context is received via `@context()` decorator, not Router export

## Available Components

**IMPORTANT:** Do NOT read all component docs. Only read a component's doc when you need to use or reference it.

**Implemented Components:**
- accordion, accordion-item, alert, avatar, badge, banner, breadcrumbs, button, card, checkbox, chip, color-display, color-picker, date-picker, divider, drawer, empty-state, file-gallery, file-upload, image, input, login, modal, nav, progress, qr-code, qr-reader, radio, select, skeleton, slider, spinner, switch, table, tabs, tab, textarea, timeline, tooltip

**To use a component:** Read `docs/ai/components/{component-name}.md` only when needed.

## Development

For framework development (build system, testing, component requirements), see:
- `DEVELOPMENT.md` (detailed)
- `docs/ai/DEVELOPMENT.md` (token-efficient)

Includes: CDN builds, React adapters, test generation, component requirements.
