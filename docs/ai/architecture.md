# Architecture

## Core Principles

**Separation of concerns:**
- **Cross-cutting:** Router + global context
- **Pages:** Orchestrate elements, handle URLs
- **Elements:** Generic visual building blocks — no fetch(), no API calls, no business logic
- **Controllers:** Specific behavior (data, APIs, business rules) — swappable per element
- **Daemons:** Explicitly constructed app-owned state/lifecycle objects — addressable through context, never global singletons

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
  pages/          # @page classes; route orchestration and presentation
  components/     # reusable @element visual components
  controllers/    # @controller data, API, and reusable business behavior
  daemons/        # explicitly constructed @daemon state/lifecycle services
```

Pages may coordinate a route and perform a small one-off load. Move behavior to
a controller when a page owns several storage/server/timer operations or when
substantial non-visual logic is copied across pages. `snice check` reports these
as architecture suggestions, not errors.

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
5. setupEventHandlers for controller
6. On detach: cleanupEventHandlers
- Class bindings own the element: attribute writes ignored while a class is bound
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
@respond('fetch-data')
async handleFetch(payload: { id: string }) {
  return await fetch(`/api/${payload.id}`).then(r => r.json());
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
