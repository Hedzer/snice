# snice-spinner

Animated loading spinner.

## Properties

```typescript
size: 'small'|'medium'|'large'|'xl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info' = 'primary';
label: string = '';
thickness: number = 4;
```

## CSS Parts

- `base` - Outer spinner container
- `circle` - SVG spinner circle
- `label` - Label text element

## Basic Usage

```html
<snice-spinner></snice-spinner>
<snice-spinner size="small"></snice-spinner>
<snice-spinner size="large"></snice-spinner>
<snice-spinner size="xl"></snice-spinner>
<snice-spinner color="success"></snice-spinner>
<snice-spinner color="error"></snice-spinner>
<snice-spinner label="Loading..."></snice-spinner>
<snice-spinner thickness="6"></snice-spinner>
```

## Accessibility

- `role="status"` with `aria-label`
- `label` property provides visible descriptive text
