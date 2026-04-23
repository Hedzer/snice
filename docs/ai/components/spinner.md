# snice-spinner

Animated loading spinner.

## Properties

```typescript
size: 'small'|'medium'|'large'|'xl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info' = 'primary';
variant: 'arc'|'dots'|'pulse'|'orbit'|'bars' = 'arc';  // loader shape
label: string = '';
thickness: number = 4;   // only applies to arc variant
```

## CSS Parts

- `base` - Outer spinner container
- `circle` - Arc variant's SVG circle
- `dots` / `pulse` / `orbit` / `bars` - Variant wrapper parts
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
