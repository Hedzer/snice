# snice-skeleton

Loading placeholder with animated shimmer effect.

## Properties

```typescript
variant: 'text'|'circular'|'rectangular'|'rounded' = 'text';
width: string = '';
height: string = '';
animation: 'pulse'|'wave'|'none' = 'wave';
count: number = 1;
spacing: string = '8px';
```

## CSS Custom Properties

- `--skeleton-bg` - Background color
- `--skeleton-highlight` - Wave highlight color
- `--skeleton-duration` - Animation duration (`1.5s`)

## CSS Parts

- `base` - Outer container
- `bone` - Individual placeholder element

## Basic Usage

```html
<snice-skeleton variant="text" count="3"></snice-skeleton>
<snice-skeleton variant="circular" width="48px" height="48px"></snice-skeleton>
<snice-skeleton variant="rectangular" width="100%" height="200px"></snice-skeleton>
<snice-skeleton variant="rounded" width="300px" height="150px"></snice-skeleton>
<snice-skeleton animation="pulse"></snice-skeleton>
```

## Accessibility

- Decorative only; use `aria-busy="true"` on container while loading
