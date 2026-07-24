---
name: snice
description: >
  Use when writing or modifying Snice web components, pages, controllers, layouts, or apps using
  the `snice` package. Triggers on: imports from `'snice'`, `@element`/`@page`/`@controller`/`@layout`
  decorators, `snice-*` custom elements, files under `packages/components/src/`, and questions about Snice
  decorators, routing, context, fetch, or component patterns.
---

# Snice

Decorator-driven web components. **NOT Lit.** Don't import `lit`, don't extend `LitElement`,
don't use `experimentalDecorators`. Stage 3 decorators only.

## tsconfig

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": false,
    "useDefineForClassFields": false,
    "lib": ["ES2022","DOM","DOM.Iterable"]
  }
}
```

`package.json`: `"type": "module"`. Bundler required (Vite/esbuild/Rollup).

## Three layers

- **Element** (`@element('tag-name')`) — purely visual. No fetch, no API calls. Receives data via props, emits events.
- **Page** (`@page({ tag, routes })`) — orchestrates. Calls APIs. Coordinates elements.
- **Controller** (`@controller('name')`) — reusable behavior attached to elements. Has `attach(el)`/`detach(el)`.
- **Layout** (`@layout('name')`) — wraps pages. `update(ctx, placards, route, params)` called on nav.
- **Daemon** (existing pattern; rare) — stateful lifecycle objects.

Rule: elements never fetch. Pages fetch and pass down via `.prop=${data}`.

## Decorators

```ts
// Class
@element('my-thing')
@page({ tag: 'home-page', routes: ['/'], guards?, layout?, placard? })
@controller('data-loader')
@layout('app-shell')

// Class fields (state + reactive)
@property() name = 'default';                 // string by default
@property({ type: Number }) count = 0;
@property({ type: Boolean }) open = false;
@property({ type: Array }) items = [];        // see Reactivity footgun
@property({ type: Object }) user = null;
@query('.foo') foo!: HTMLElement;             // shadow DOM single
@queryAll('.row') rows!: NodeListOf<HTMLElement>;
@request('user') getUser!: () => Promise<User>; // request from controller

// Methods
@render() tpl() { return html`...`; }         // re-runs on @property change
@styles() s() { return css`...`; }            // scoped styles
@ready() async init() {}                      // after first render
@reconnect() onReconnect() {}                 // every connect after first
@dispose() cleanup() {}                       // on disconnect
@watch('count') onCount(oldV, newV) {}        // after setter
@watch('a','b') onAny() {}                    // multiple
@on('click', '.btn') handle(e) {}             // delegated event
@on('keydown:Enter', 'input') submit(e) {}    // key filter
@on('input', 'input', { debounce: 300 }) search(e) {}
@dispatch('value-changed') set(v) { return { value: v }; } // returns event detail
@observe(() => this.container, { childList: true }) onMut(records) {}
@context() onCtx(ctx: Context) {}             // method only (NOT field)
@context({ debounce: 300 }) onCtxDeb(ctx) {}
@respond('user') getUserData() { return user; } // controller side of @request
```

**No `@state()`. No `@customElement()`. No `reflect` option on `@property`.**

## Templates

Tagged template literals only. `html\`...\`` and `css\`...\``.

```ts
html`
  <div class="x">${this.value}</div>
  <input .value=${this.text} />               // .prop = property binding
  <button ?disabled=${this.busy}>Go</button>  // ?attr = boolean attribute
  <a href=${this.url}>link</a>                // attr = string attribute
  <button @click=${this.handle}>Click</button> // @event handler (auto-bound)
  <input @keydown:Enter=${this.submit} />
  <input @keydown:ctrl+s=${this.save} />
`
```

Conditionals — both work, ternary is more common:

```ts
html`${this.loading ? html`<p>Loading</p>` : html`<ul>...</ul>`}`

html`
  <if ${this.loading}><p>Loading</p></if>
  <if ${!this.loading && this.items.length > 0}>
    <ul>${this.items.map(i => html`<li>${i.name}</li>`)}</ul>
  </if>
`
```

Compound expressions inside `<if ${...}>` work (e.g. `${this.items.length > 0}`, `${a && b}`,
`${this.user?.role === 'admin'}`).

Switch:

```ts
html`
  <case ${this.status}>
    <when value="loading"><span>...</span></when>
    <when value="ok"><span>done</span></when>
    <default><span>?</span></default>
  </case>
`
```

Lists: just `.map`. Auto-keyed by position.

```ts
html`<ul>${this.items.map(it => html`<li @click=${() => this.pick(it.id)}>${it.name}</li>`)}</ul>`
```

## Reactivity (CRITICAL FOOTGUN)

Properties trigger renders **only on reference change**. The setter short-circuits when `oldValue === newValue`.

```ts
this.items = [...this.items, x];   // ✅ new ref → renders
this.items = this.items.concat(x); // ✅ new ref → renders
this.items = next;                 // ✅ if next !== current → renders

this.items.push(x);                // ❌ mutation, no setter call
this.items.splice(0, 1);           // ❌ mutation
this.items.sort();                 // ❌ mutation
this.items.length = 0;             // ❌ mutation
this.items[0] = x;                 // ❌ mutation
this.items = this.items;           // ❌ same ref, ref-equality skip

this.user.name = 'X';              // ❌ nested mutation never renders
this.user = { ...this.user, name: 'X' }; // ✅
```

Rule: treat `@property` arrays/objects as immutable. Always reassign with a new reference.

`@watch(prop)` fires on setter only — same rule. Mutations don't fire watchers.

## File layout

```
packages/components/src/<name>/
  snice-<name>.ts           # @element class
  snice-<name>.types.ts     # interfaces, event maps (no logic)
  snice-<name>.css          # scoped styles
  snice-<name>.stories.ts   # Storybook scenarios

website/showcases/<name>/
  card.html                 # compact components-page example
  full.html                 # demo every feature
```

Component:

```ts
import { element, property, render, styles, html, css } from 'snice';
import componentStyles from './snice-my.css?inline';
import type { SniceMyElement } from './snice-my.types';

@element('snice-my')
export class SniceMy extends HTMLElement implements SniceMyElement {
  @property() variant: 'default'|'primary' = 'default';
  @property({ type: Boolean }) disabled = false;

  @render()
  renderContent() {
    return html`<div class="comp" part="base"><slot></slot></div>`;
  }

  @styles()
  componentStyles() {
    return css`${componentStyles}`;
  }
}
```

Types file (separate so controllers can import types without importing the component):

```ts
// snice-my.types.ts
export interface SniceMyElement extends HTMLElement {
  variant: 'default'|'primary';
  disabled: boolean;
}
export interface SniceMyEventMap {
  'my-event': CustomEvent<{ value: string }>;
}
```

Use exported `enum` for closed-set values, not bare string literals at call sites.

## Custom events

Snice events:
- kebab-case: `value-changed`, `dismiss`, `tab-select`
- always carry detail: type as `CustomEvent`, not `Event`
- access via `e.detail.value` not `e.target.value`

```ts
@dispatch('value-changed', { bubbles: true, composed: true })
private emit() { return { value: this.value, component: this }; }

// Consumer
html`<snice-input @value-changed=${(e: CustomEvent) => this.handle(e.detail.value)} />`
```

## Routing

### Context shape (READ THIS — agents get it wrong)

`Context` is NOT generic. Cast inside the handler.

```ts
class Context {
  id: number;
  application: AppContext;            // your app context object
  navigation: {
    placards: Placard[];
    route: string;                    // current route as string, NOT an object
    params: Record<string, string>;   // route params live HERE, not on ctx itself
  };
  fetch: typeof globalThis.fetch;     // bound; uses fetcher middleware if configured
  update(): void;                     // notify subscribers when you mutate application
}
```

So:
- Route params: `ctx.navigation.params.id` (NOT `ctx.params.id`)
- Current route: `ctx.navigation.route` (string)
- App data: `(ctx.application as MyAppContext).user`

### Router

```ts
// router.ts
import { Router, ContextAwareFetcher } from 'snice';

const fetcher = new ContextAwareFetcher();
fetcher.use('request', async (req, next) => {
  // add auth header etc
  return next();
});

export const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',                         // REQUIRED: 'hash' | 'pushstate'
  context: { user: null, theme: 'dark' },
  fetcher,                              // optional
  layout: 'app-shell',                  // optional
});
```

```ts
// pages/dashboard-page.ts
import { page } from '../router';

@page({ tag: 'dashboard-page', routes: ['/dashboard'], guards: [isAuth] })
export class DashboardPage extends HTMLElement {
  @property({ type: Array }) items = [];
  private ctx?: Context;

  @context()
  onCtx(ctx: Context) { this.ctx = ctx; }

  @ready()
  async load() {
    while (!this.ctx) await new Promise(r => setTimeout(r, 5));
    await this.fetchItems();
  }

  // Re-fetch when route params change (e.g. /tasks/:id navigates between ids).
  @context()
  async onCtxNav(ctx: Context) {
    const id = ctx.navigation.params.id;
    if (id !== this.lastId) {
      this.lastId = id;
      await this.fetchItems();
    }
  }

  @render()
  tpl() {
    return html`<ul>${this.items.map(i => html`<li>${i.name}</li>`)}</ul>`;
  }
}
```

`@context()` handlers fire on every navigation. Method only — NOT a field. First fire is async (after navigate completes).
To read route params (`/tasks/:id`): `ctx.navigation.params.id` — NEVER `ctx.params.id`.

Guards:

```ts
import type { Guard } from 'snice';
const isAuth: Guard<AppContext> = (ctx, params) => ctx.user !== null;
// boolean | Promise<boolean>. Multiple guards = AND. No string redirects.
```

Custom AppContext:

```ts
import type { AppContext as SniceAppContext } from 'snice';
export interface AppContext extends SniceAppContext { user: User | null; }
```

In layouts: `update(app: SniceAppContext, ...)` — cast inside.

## Placards (page metadata for layouts)

```ts
@page({
  tag: 'home-page', routes: ['/'],
  placard: { name: 'home', title: 'Home', icon: '🏠', order: 1 }
})
class Home extends HTMLElement {}
```

Layouts receive placards in `update()` and render nav from them.

## CSS

Every `var()` MUST have a fallback. Fallback = exact default from `theme.css`.

```css
:host {
  display: block;
  color: var(--snice-color-text, rgb(23 23 23));
  background: var(--snice-color-surface, rgb(255 255 255));
  padding: var(--snice-spacing-md, 1rem);
  border: 1px solid var(--snice-color-border, rgb(226 226 226));
  border-radius: var(--snice-border-radius-md, 0.25rem);
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
  contain: layout style paint;
}
```

Spacing/typography in **rem**. Borders/shadows in **px**. No hard-coded colors. No raw `#fff`.

Two-tier pattern for complex components:

```css
:host {
  --component-bg: var(--snice-color-surface, rgb(255 255 255));
}
.inner { background: var(--component-bg); }
```

`contain: layout style paint` on `:host` can break flex `align-items: stretch`. Fix: add `width: 100%` to `:host`.

## Imports

Side-effect import for CDN/usage:

```ts
import 'snice/components/button/snice-button';
// then:
html`<snice-button variant="primary">OK</snice-button>`
```

NOT `import { Button } from 'snice/components/button'`.

Import in app entry (main.ts), not per-page.

## Request/Response (element ↔ controller)

```ts
// Controller
@controller('user-controller')
class UserController {
  @respond('user') getUser() { return this.currentUser; }
  async attach(el) {} async detach(el) {}
}

// Element
@element('user-badge')
class UserBadge extends HTMLElement {
  @request('user') getUser!: () => User;

  @render() tpl() {
    const u = this.getUser();
    return html`<div>${u.name}</div>`;
  }
}
```

```html
<user-controller><user-badge></user-badge></user-controller>
```

## Testing

```ts
import { describe, it, expect } from 'vitest';
import { element, property, render, html } from 'snice';

it('renders', async () => {
  @element('my-test')
  class T extends HTMLElement {
    @property({ type: Number }) n = 0;
    @render() tpl() { return html`<span>${this.n}</span>`; }
  }
  const el = document.createElement('my-test') as any;
  document.body.appendChild(el);
  await el.ready;
  expect(el.shadowRoot.querySelector('span').textContent).toBe('0');
  el.n = 5;
  await new Promise(r => queueMicrotask(r));   // wait for batched render
  expect(el.shadowRoot.querySelector('span').textContent).toBe('5');
});
```

Wait for renders: `await el.ready` (initial) then `await new Promise(r => queueMicrotask(r))` after each property write.

## Container components (groups, lists, feeds, grids)

Must support BOTH:
- Imperative: `group.items = [{...}, {...}]`
- Declarative: `<snice-x><snice-x-item></snice-x-item></snice-x>`

Use `<slot>` + `@observe` to react to slotted children. Children win when both supplied.

## Pre-built components

Use existing — don't reinvent. Available: accordion, action-bar, activity-feed, alert, approval-flow, avatar, avatar-group, badge, banner, breadcrumbs, button, calendar, camera, card, carousel, cart, chart, chat, checkbox, chip, code-block, color-picker, command-palette, comments, countdown, cropper, data-card, date-picker, date-range-picker, date-time-picker, diff, divider, doc, draw, drawer, empty-state, file-upload, flip-card, flow, form-layout, gantt, gauge, grid, heatmap, image, input, invoice, kanban, kpi, layout, leaderboard, link, list, login, map, markdown, masonry, menu, message-strip, modal, music-player, nav, network-graph, notification-center, order-tracker, org-chart, pagination, pdf-viewer, permission-matrix, podcast-player, pricing-table, product-card, progress, progress-ring, qr-code, qr-reader, radio, range-slider, rating, receipt, recipe, sankey, segmented-control, select, skeleton, slider, sortable, sparkline, spinner, split-button, split-pane, spotlight, stat-group, step-input, stepper, switch, table, tabs, tag, tag-input, terminal, testimonial, textarea, time-picker, time-range-picker, timeline, timer, toast, tooltip, tree, treemap, user-card, video-player, virtual-scroller, waterfall, weather, work-order.

For component API: read `docs/ai/components/<name>.md` from the snice package. ONE file per component, low-token.

Sub-components live in parent dirs; don't import directly:
- `accordion-item` in `accordion/`
- `tab`, `tab-panel` in `tabs/`
- `option` in `select/`
- `menu-item`, `menu-divider` in `menu/`
- `tree-item` in `tree/`
- `column`, `row`, cell-* in `table/`
- `layout-*` (sidebar, dashboard, blog) in `layout/`
- `crumb` in `breadcrumbs/`
- `kv-pair` in `key-value/`

## Common footguns

1. **Mutation doesn't render.** Always reassign arrays/objects. `items = [...items, x]`, never `items.push(x)`.
2. **Same-ref reassign skips render.** `items = items` does nothing.
3. **`@property({ type: Boolean })` attribute "false" string → `false`** (not standard HTML, but Snice convention).
4. **Boolean attrs need explicit type.** `@property({ type: Boolean }) open = false;` — without type Snice treats as string.
5. **Union types use String type.** `@property() variant: 'a'|'b' = 'a';` — type hint optional.
6. **No `reflect` option.** Attributes auto-sync.
7. **`@context()` is method-only**, NOT a field. First fire async.
8. **`@ready` may run before `@context` fires.** Don't assume `ctx` exists in @ready unless you wait for it.
9. **Don't import from 'lit'.** This is not Lit.
10. **Don't use `connectedCallback`/`disconnectedCallback` directly.** Use `@ready`/`@dispose`.
11. **Don't use `addEventListener` inside components.** Use `@on` or template `@event`.
12. **Don't use `new MutationObserver`.** Use `@observe`.
13. **Don't use `dispatchEvent(new CustomEvent(...))`.** Use `@dispatch`.
14. **Don't use `this.shadowRoot.querySelector`.** Use `@query`.
15. **Compound expressions in `<if>` work** at source level. Stage 3 decorators preserve them.
16. **Singletons banned.** No `globalThis.snice.X`, no module-level "current Y". Resolve scope via DOM ancestry.
17. **Boolean state props use `isOpen`/`isExpanded`.** Bare verbs (`open()`/`close()`) are actions. Native HTML reflective attrs (`<details open>`) keep the attribute name.
18. **`open` is a command, `isOpen` is state.**
19. **Use `enum` exports for closed-set strings**, not `const enum` (TS-only).
20. **Spacing/typography in rem; borders/shadows in px.**

## Quick decision tree

- Need to display something? → use existing `snice-*` component
- Need to add behavior to an existing element? → controller w/ `attach()/detach()`
- Need a new visual primitive? → `@element` w/ types/css/ts triplet
- Need to react to URL? → `@page` w/ routes
- Need to wrap nav UI? → `@layout`
- Need data? → fetch in `@page` (via `ctx.fetch`), pass down to elements via `.prop=`
- Need to update a list? → `this.items = newArray` (NEVER mutate)
- Need shared state? → `Router` `context: {...}` + `@context()` in pages
- Need element-to-controller call? → `@request`/`@respond`
