# snice-spinner

Animated loading spinner.

## Properties

```typescript
size: 'small'|'medium'|'large'|'xl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info' = 'primary';
variant: 'arc'|'dots'|'pulse'|'orbit'|'bars' = 'arc';  // loader shape
label: string = '';                    // the only caption path; stray slotted text never renders
thickness: number = 4;   // only applies to arc variant
```

## CSS Parts

- `base` - Outer spinner container
- `circle` - Arc variant's SVG element
- `track` - Arc variant's background circle
- `fill` - Arc variant's animated arc circle
- `dots` / `pulse` / `orbit` / `bars` - Variant wrapper parts
- `dot` - Individual dot (dots and orbit variants)
- `orbit-dot` - Added to `dot` for the orbit variant's dots
- `bar` - Individual bar (bars variant)
- `ring` - Orbit variant's rotating ring
- `ring-a` / `ring-b` / `ring-c` - Added to `ring` for the first, second, and third orbit ring
- `label` - Label text element

## Basic Usage

```html
<snice-spinner></snice-spinner>                     <!-- arc (default) -->
<snice-spinner variant="dots"></snice-spinner>      <!-- 3 bouncing dots -->
<snice-spinner variant="pulse"></snice-spinner>     <!-- ring-pulse outward -->
<snice-spinner variant="bars"></snice-spinner>      <!-- 4 vertical bars -->
<snice-spinner variant="orbit"></snice-spinner>     <!-- 3 dots on a rotating ring -->
<snice-spinner size="large" color="success" variant="dots"></snice-spinner>
<snice-spinner label="Loading..."></snice-spinner>
```

## Accessibility

- `role="status"` with `aria-label`
- `label` property provides visible descriptive text
