# AI-Optimized Documentation

Token-efficient reference docs for AI assistants. Same content as human docs, minimal verbosity.

**Format:**
- Type signatures over prose
- Bullet points over paragraphs
- Code over explanations
- No tutorials, pure reference

**Files:**
- `api.md` - Complete API reference
- `rendering.md` - Declarative syntax, reactivity, roots, directives, SSR/hydration
- `decorators.md` - Quick decorator reference
- `patterns.md` - Common usage patterns
- `react-integration.md` - React router, hooks, guards, context
- `architecture.md` - System design
- `components/*.md` - Component reference (DO NOT read all upfront - read only as needed)

Read these instead of `/docs/*.md` for faster context loading.

**WIP Components:** Some component folders exist but are not available in builds or MCP output. The source of truth is `components/.wip` (one directory name per line).

## CLI

```bash
# Create project
npx snice create-app my-app
npx snice create-app my-app --template=react

# Run MCP server
npx snice mcp
```

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

## CDN / Standalone Usage

Runtime first, then one bundle per component (any order after runtime):
```html
<script src="snice-runtime.min.js"></script>   <!-- required, first -->
<script src="snice-button.min.js"></script>
<snice-button variant="primary">Click me</snice-button>
```
- Omit the runtime → elements never register → blank page.
- Full details (load order, bundle families, `theme.css` + dark mode, `.min.js` vs `.esm`): [cdn.md](cdn.md).

## Pitfalls

**Decorators:**
- No `@customElement()` - Use `@element('tag-name')`
- `@property()` is the public attribute/property channel; `@state()` is reactive internal state
- Components re-render on any property change (decorated or not)

**Architecture:**
- **Elements are purely visual** - no fetch(), no API calls, no backend logic
- Elements receive data via properties, emit events for actions
- **Pages orchestrate** - handle routing, call APIs, coordinate elements
- **Controllers add behavior** - attach to elements for reusable non-visual logic
- Put API calls in pages/controllers/services, not in elements

**Properties:**
- Boolean attrs: `"false"` string → `false` (not standard HTML)
- Type is inferred from the initializer: `@property() count = 0` parses attributes as Number. Explicit `@property({ type: Number })` is only needed when there is NO initializer (`@property() amount?: number` stays a string without it)
- Union types use String: `@property() variant: 'a' | 'b' = 'a'` (type hint optional)
- `reflect` defaults to true; use `reflect: false` for attribute input without property output
- `attribute: false` disables the attribute channel; direct JS assignments preserve type and identity
- `deep: true` tracks nested plain object/array/Map/Set mutations with native Proxy/Reflect
- Plain `HTMLElement` uses legacy lowercase implicit attributes; `SniceElement` uses kebab-case

**Templates:**
- `.prop=${val}` for objects/arrays, `attr="${val}"` for strings
- `?attr=${bool}` toggles attribute presence
- `@event=${fn}` handlers are auto-bound to `this`
- `class:name`, `style:name`, `...props`, `...attrs`, `...events`, `bind`, `ref`, and `use` are supported
- Event `|` modifiers: prevent, stop, immediate, once, capture, passive, self
- Use `repeat()` for explicit keyed identity; `<if>` supports else-if/else; `<case>` supports typed `<when ${value}>`

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
- `await el.rendered` after reactive writes
- Use `@query()` when the component may have a closed or light render root

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
- Use `@property()` for public reactive inputs, `@state()` for internal reactive state, and plain fields for non-reactive values
- `@context()` receives Context on navigation

**Guards:**
- Signature: `(context: AppContext, params: RouteParams) => boolean | Promise<boolean>`
- TWO params: context (raw AppContext) and route params
- Return `true` to allow, `false` renders 403 page
- Sync or async — async guards are awaited; React router shows `loading` component during async resolution
- NO string redirects (boolean/Promise<boolean> only)
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

**Implemented Components** (top-level directories under `components/`, alphabetical):

accordion, action-bar, activity-feed, alert, approval-flow, app-tiles, audio-recorder, availability, avatar, avatar-group, badge, banner, binpack, book, booking, breadcrumbs, button, calendar, camera, camera-annotate, candlestick, card, carousel, cart, chart, chat, checkbox, chip, code-block, color-display, color-picker, command-palette, comments, countdown, cropper, data-card, date-picker, date-range-picker, date-time-picker, diff, divider, doc, draw, drawer, empty-state, estimate, file-gallery, file-upload, flip-card, flow, form-layout, funnel, gantt, gauge, grid, heatmap, image, input, invoice, kanban, key-value, kpi, layout, leaderboard, link, link-preview, list, location, login, map, markdown, masonry, menu, message-strip, metric-table, modal, music-player, nav, network-graph, notification-center, order-tracker, org-chart, pagination, paint, pdf-viewer, permission-matrix, podcast-player, pricing-table, product-card, progress, progress-ring, qr-code, qr-reader, radio, range-slider, rating, receipt, recipe, sankey, segmented-control, select, skeleton, slider, sortable, sparkline, spinner, split-button, split-pane, spotlight, stat-group, step-input, stepper, switch, table, tabs, tag, tag-input, terminal, testimonial, textarea, timeline, time-picker, timer, time-range-picker, toast, tooltip, tree, treemap, user-card, video-player, virtual-scroller, waterfall, weather, work-order

**Nested sub-components** are documented under their parent — don't import them directly:
- `accordion-item` lives inside `accordion/`
- `tab` and `tab-panel` live inside `tabs/`
- `option` lives inside `select/`
- `menu-item` and `menu-divider` live inside `menu/`
- `tree-item` lives inside `tree/`
- `column` and `row` live inside `table/`
- `cell-*` (text, number, date, etc.) live inside `table/`
- `layout-*` (sidebar, dashboard, blog, etc.) live inside `layout/`
- `leaderboard-entry` lives inside `leaderboard/`
- `stepper-panel` lives inside `stepper/`
- `crumb` lives inside `breadcrumbs/`
- `kv-pair` lives inside `key-value/`
- `list-item` lives inside `list/`
- `drawer-target` lives inside `drawer/`
- `toast-container` lives inside `toast/`

**Excluded from builds:** components listed in `components/.wip` (currently: `spreadsheet`).

**To use a component:** Read `docs/ai/components/{component-name}.md` only when needed.

## Development

For framework development (build system, testing, component requirements), see:
- `DEVELOPMENT.md` (detailed)
- `docs/ai/DEVELOPMENT.md` (token-efficient)

Includes: CDN builds, React adapters, test generation, component requirements.
