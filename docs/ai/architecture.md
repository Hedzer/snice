# Architecture

## Core Principles

**Separation of concerns:**
- **Cross-cutting:** Router + global context
- **Elements:** Visual behavior and semantic UI contracts — rendering, internal DOM, focus, keyboard behavior, and visual state
- **Controllers:** Application behavior specific to a set of elements — data, APIs, storage, business rules, and app-specific reactions that exist for those elements
- **Pages:** Element orchestration — compose elements, pass properties, handle events, bind controllers, and coordinate the screen
- **Plain modules:** Host-free reusable functions with explicit inputs; use the project's own folder convention
- **Daemons:** Explicitly constructed app-owned state/lifecycle objects — addressable through context, never global singletons

These are ownership rules, not synonyms: visual behavior belongs in the element,
application behavior specific to a set of elements belongs in a controller, and
element orchestration belongs in the page. Routing is a page concern, but it does
not define the page role.

**Generic vs Specific:** Elements say *what* they need, controllers decide *how*.
Swap controllers to change behavior without touching the component.
Mock controller for tests, real API controller in production — same element.

**Data flow:**
- Down: Properties
- Up: Events
- Sideways: Request/Response channels
- App services: daemon-addressed request/response or dispatch/on

## Project Structure

Conventional application layout:

```text
src/
  main.ts
  router.ts
  pages/          # @page classes; element orchestration and routing
  components/     # reusable @element visual components
  controllers/    # @controller data, API, and reusable business behavior
  daemons/        # explicitly constructed @daemon state/lifecycle services
```

Pages orchestrate elements. Do not call `attachController(this, ...)` or assign
`this.controller` on a page; that creates a second owner instead of preserving
the page's orchestration role. Keep visual behavior in the element. Put
application behavior specific to a set of elements in a controller and bind it
where the page composes those elements. A host-free reusable function may stay a
plain module in the project's chosen location.

Declare route and query state in `@page({ routes })` rather than giving a
controller `URLSearchParams`, `location`, or `history` responsibilities.
`snice check` reports these architecture mistakes and conservative page
decomposition suggestions.

## Rendering System

**Template compilation:**
1. `html\`...\`` → TemplateResult
2. Parse template, identify dynamic parts
3. Create Template with Part instances
4. TemplateInstance tracks values

**Part types:**
- NodePart: Text content
- AttributePart: `attr="${val}"`
- PropertyPart: `.prop="${val}"`
- BooleanAttributePart: `?attr="${bool}"`
- EventPart: `@event="${handler}"`
- Class/Style parts: `class:name`, `style:name`
- SpreadPart: `...props`, `...attrs`, `...events`
- Conditional parts: `<if>/<else-if>/<else>`, `<case>/<when>/<default>`
- NodePart also handles nested templates, keyed repeats, Promises, and async iterables

**Differential updates:**
- Only changed Parts re-render
- DOM nodes reused, not recreated
- Event listeners preserved
- Batched via microtask queue

**Auto-rendering:**
- Property setters trigger queueRender()
- Batches multiple changes
- Calls @render() method
- Updates TemplateInstance

## Decorator System

**Metadata storage:**
- Symbols prevent collisions
- Stored on prototype/class
- Retrieved during lifecycle

**Element lifecycle:**
1. Constructor
2. connectedCallback → setupEventHandlers, initial render
3. attributeChangedCallback → property sync
4. @ready() → after first render (fires once)
5. Property changes → auto re-render
6. disconnectedCallback → @dispose, cleanup
7. Reconnect: setupEventHandlers, then @reconnect (NOT @ready)

**Controller lifecycle:**
1. Binding set: `controller=${MyController}` (class, ControllerPart) or controller="name" (attribute)
2. ControllerPart commit / attributeChangedCallback detects change
3. Detach old controller (if any)
4. Attach new controller (class refs skip the registry; reference-deduped)
5. Register `@context` and catch up with the current Router context
6. Set up `@observe`, `@respond`, and `@on` handlers
7. On detach: clean up every managed decorator
- Class bindings own the element; their decorator name is reflected as a diagnostic-only `controller="name"` marker
- Native elements: class bindings attach via ControllerPart; string attrs via MutationObserver

**Daemon lifecycle:**
1. Application constructs an `@daemon` class with `new`
2. `provideContext(root, { daemons })` activates its private communication target
3. Elements/controllers resolve the nearest context by string address
4. Provider release removes daemon handlers and deactivates that target
- Router provides its `context` through the same mechanism
- Multiple instances of the same class remain independent
- No implicit construction, registry scan, singleton, start, or stop hook

## Router System

**Registration:**
- @page() stores { tag, routes, guards, placard }
- Router.initialize() registers pages
- Path-to-RegExp for route matching

**Navigation:**
1. navigate(path) or URL change
2. Match route → page config
3. Run guards (abort if fail)
4. Update layout (if present)
5. Create/reuse page element
6. Extract params → page properties
7. Slot into layout or target

**Layouts:**
- Persistent wrapper around pages
- Receives placard metadata
- update() called on navigation
- `<slot name="page">` for content

## Event System

**Template events:**
- EventPart handles `@event="${handler}"`
- Supports keyboard modifiers via parseKeyboardFilter()
- Both `:` and `.` notation
- Listeners on actual elements

**@on decorator:**
- Stores handler metadata
- setupEventHandlers creates listeners
- Supports delegation with selectors
- Uses same parseKeyboardFilter() as templates
- Auto cleanup on disconnect

**Keyboard syntax:**
```
@keydown:Enter → { key: "Enter" }
@keydown:ctrl+s → { key: "s", ctrl: true }
@keydown:~Space → { key: " ", anyModifiers: true }
@keydown.escape → { key: "Escape" }
```

## Communication Patterns

**Parent → Child:** Properties
```typescript
html`<child-el .data=${this.data}></child-el>`
```

**Child → Parent:** Events
```typescript
@dispatch('changed')
onChange() { return { value: this.value }; }
```

**Element ↔ Controller:** Request/Response
```typescript
// Element requests (async generator: yield sends, await receives)
@request('fetch-data')
async *fetchData(): Response<Data> {
  return await (yield { id: this.dataId });  // single yield per call
}

// Controller responds (receives payload, returns result directly)
private ctx!: Context;
@context() receiveContext(ctx: Context) { this.ctx = ctx; }

@respond('fetch-data')
async handleFetch(payload: { id: string }) {
  return await this.ctx.fetch(`/api/${payload.id}`).then(r => r.json());
}
// Wiring: html`<my-element controller=${MyController}></my-element>` (or controller="my-controller" in raw HTML)
```

**Element/Controller ↔ Daemon:** Addressed communication
```typescript
@daemon
class SessionDaemon {
  @respond('session/get') get() { return this.session; }
  @dispatch('session/changed') changed() { return this.session; }
}

const session = new SessionDaemon();
const release = provideContext(appRoot, { daemons: { session } });

// Consumer imports no daemon implementation class.
@request('session/get', { daemon: 'session' })
async *getSession(): Response<Session | null> { return yield {}; }

@on('session/changed', { daemon: 'session' })
sessionChanged(event: CustomEvent<Session | null>) {}
```

**Global State:** Context
```typescript
@context() handleContext(ctx: Context) {
  this.app = ctx.application;
  this.route = ctx.navigation.route;
}
```

## Shadow DOM

- Open shadow DOM is the default; closed shadow and light DOM are configurable
- `delegatesFocus` and custom `createRenderRoot()` are supported
- Styles and lifecycle work across every managed render root
- Events cross boundary with composed: true
- Framework queries work with open, closed, and light render roots

## Performance

**Optimizations:**
- Template caching (Map<TemplateStringsArray, Template>)
- Part reuse (no DOM recreation)
- Microtask batching (queueMicrotask)
- Debounce/throttle built-in
- Conditional rendering (IfPart, CasePart)

**Trade-offs:**
- Initial template parsing overhead
- Memory for TemplateInstance per element
- Benefit: Much faster updates
