# API Reference

## Class Decorators

```typescript
@element('tag-name') // Define custom element
@page({ tag, routes, guards?, placard? }) // Define routable page
@controller('name') // Define behavior module
@layout('name') // Define page wrapper
```

## Rendering

```typescript
@render(options?: { debounce?, throttle?, once?, sync?, differential? })
// Returns: TemplateResult from html`...` (or string if differential: false)
// Auto re-renders on property changes
// Supports differential updates by default
// differential: false - disables differential rendering, expects string return
//   Clears shadow root and re-renders from scratch each time
//   Still honors <if> and <switch>/<case> meta elements

@styles()
// Returns: CSSResult from css`...`
// Scoped to shadow DOM
```

## Properties

```typescript
@property(options?: { type?, attribute?, reflect? })
// Syncs with attributes, triggers re-render
// Types: String (default), Number, Boolean, Object, Array

@watch(...propertyNames: string[])
// Called on property change: (oldVal, newVal) => void
```

## Lifecycle

```typescript
@ready() // After initial render
@dispose() // On disconnectedCallback
@moved() // On adoptedCallback
@adopted() // On adoptedCallback
```

## DOM Queries

```typescript
@query(selector: string) // Single element
@queryAll(selector: string) // NodeListOf<Element>
```

## Events

**Template syntax:**
```typescript
html`
  <button @click=${handler}>...</button>
  <input @keydown:Enter=${handler} />
  <input @keydown.ctrl+s=${handler} />
  <input .value=${val} ?disabled=${bool} />
`
```

**Decorator:**
```typescript
@on(event: string | string[], selector?: string, options?: OnOptions)
// Works in elements + controllers
// Options: { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive? }
// Keyboard: 'keydown:Enter', 'keydown.escape', 'keydown:ctrl+s', 'keydown:~Space'
// Supports both ':' and '.' notation

@dispatch(eventName: string)
// Fires CustomEvent after method, detail = return value
```

## Communication

```typescript
@request(channel: string)
// Send: this.methodName(data) → Promise<response>

@respond(channel: string)
// Receive: methodName(request, respond) → respond(data)
```

## Observers

```typescript
@observe(target: () => Node, options?: MutationObserverInit)
// Auto-cleanup on disconnect
// Method called with: (mutations: MutationRecord[])
```

## Context & Router

```typescript
@context(options?: { debounce?, throttle?, once? })
// Method decorator: receives Context object on router navigation
// Method signature: (ctx: Context) => void
// Context: { application, navigation: { placards, route, params }, update() }
// Call ctx.update() after modifying ctx.application to notify all subscribers
// Options:
//   debounce (ms) - wait for quiet period before calling
//   throttle (ms) - limit to at most once per period
//   once - call only once then unregister
// Example:
//   @context() handleContext(ctx) {
//     this.ctx = ctx;
//     ctx.application.user = user;
//     ctx.update(); // notify all subscribers
//   }

Router({ target, context?, layout? })
// Returns: { page, navigate, initialize }
// page() - decorator factory
// navigate(path) - programmatic navigation
// initialize() - start router
```

## Templates

```typescript
html`...` // TemplateResult
css`...` // CSSResult

// Conditionals
<if ${condition}>...</if>
<case ${value}>
  <when value="x">...</when>
  <default>...</default>
</case>

// Lists
${items.map(i => html`<li>${i}</li>`)}

// Bindings
attr="${val}" // Attribute
.prop="${val}" // Property
?attr="${bool}" // Boolean attribute
@event="${handler}" // Event listener
@event:modifier="${handler}" // With keyboard modifier
```

## Types

```typescript
interface TemplateResult { readonly _$litType$: number; }
interface CSSResult { cssText: string; }
interface OnOptions { debounce?, throttle?, preventDefault?, stopPropagation?, once?, capture?, passive? }
interface RenderOptions { debounce?, throttle?, once?, sync? }
interface Layout { update(context, placards, route, params) }
interface Placard { name, title, icon?, description?, order?, show?, visibleOn?, parent?, group?, searchTerms?, hotkeys?, breadcrumbs?, tooltip? }
type Guard<T> = (context: T) => boolean | Promise<boolean>
```

## Exports

```typescript
import {
  element, page, controller, layout,
  property, watch, context,
  render, styles, html, css,
  query, queryAll,
  on, dispatch,
  request, respond,
  observe,
  ready, dispose, moved, adopted,
  Router,
  debounce, throttle, once, memoize
} from 'snice';
```
