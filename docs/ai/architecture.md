# Architecture

## Core Principles

**Separation of concerns:**
- **Cross-cutting:** Router + global context
- **Pages:** Orchestrate elements, handle URLs
- **Elements:** Pure presentation, no business logic
- **Controllers:** Behavior, data fetching, swappable

**Data flow:**
- Down: Properties
- Up: Events
- Sideways: Request/Response channels

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
- IfPart: `<if>` conditional
- CasePart: `<case>/<when>` branching

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
4. @ready() → after first render
5. Property changes → auto re-render
6. disconnectedCallback → cleanup

**Controller lifecycle:**
1. Element sets controller="name"
2. attributeChangedCallback detects change
3. Detach old controller (if any)
4. Attach new controller
5. setupEventHandlers for controller
6. On detach: cleanupEventHandlers

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
// Element requests, controller responds
@request('channel') method!: (data) => Promise<result>
@respond('channel') handler(req, respond) { respond(data); }
```

**Global State:** Context
```typescript
@context() ctx: AppContext;
```

## Shadow DOM

- All elements use shadow DOM (mode: 'open')
- Styles scoped automatically
- Events cross boundary with composed: true
- Query selectors work within shadowRoot

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
