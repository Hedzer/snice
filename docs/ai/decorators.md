# Decorators

## Class
- `@element('tag-name')` - Custom element
- `@page({ tag, routes, guards?, placard? })` - Routable page
- `@controller('name')` - Swappable behavior
- `@layout('name')` - Page wrapper

## Rendering
- `@render()` - Template method, returns `html\`...\``
- `@styles()` - Scoped CSS, returns `css\`...\``

## Properties
- `@property({ type?, attribute?, reflect? })` - Reactive, syncs attrs
- `@watch('propName')` - React to changes: `(old, new) => void`

## Lifecycle
- `@ready()` - After first render
- `@dispose()` - Cleanup on disconnect

## DOM
- `@query('selector')` - Single element
- `@queryAll('selector')` - NodeList

## Events
- `@on('event', 'selector?')` - Delegation, auto-bound
- `@dispatch('event-name')` - Emit CustomEvent, detail = return value

## Template Bindings
```
attr="${val}"     - String attribute
.prop=${val}      - Property (objects, arrays)
?attr=${bool}     - Boolean attr (adds/removes)
@event=${fn}      - Event listener (auto-bound)
```

## Event Modifiers
```
@keydown:Enter=${fn}    - Key filter
@keydown.ctrl+s=${fn}   - Key combo
@click.once=${fn}       - Fire once
```
