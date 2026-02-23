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

## Usage

```html
<!-- Text placeholder -->
<snice-skeleton variant="text"></snice-skeleton>
<snice-skeleton variant="text" width="200px"></snice-skeleton>

<!-- Circular (avatar) -->
<snice-skeleton variant="circular" width="40px" height="40px"></snice-skeleton>

<!-- Rectangular -->
<snice-skeleton variant="rectangular" width="100%" height="200px"></snice-skeleton>

<!-- Rounded (card) -->
<snice-skeleton variant="rounded" width="300px" height="150px"></snice-skeleton>

<!-- Multiple lines -->
<snice-skeleton variant="text" count="3"></snice-skeleton>
<snice-skeleton variant="text" count="5" spacing="12px"></snice-skeleton>

<!-- Animation types -->
<snice-skeleton animation="pulse"></snice-skeleton>
<snice-skeleton animation="wave"></snice-skeleton>
<snice-skeleton animation="none"></snice-skeleton>

<!-- Complex layout -->
<div style="display: flex; gap: 16px;">
  <snice-skeleton variant="circular" width="48px" height="48px"></snice-skeleton>
  <div style="flex: 1;">
    <snice-skeleton variant="text" width="40%"></snice-skeleton>
    <snice-skeleton variant="text" width="60%"></snice-skeleton>
  </div>
</div>
```
