# snice-image

Flexible image component with variants and lazy loading.

## Properties

```typescript
src: string = '';
alt: string = '';
fallback: string = '';
placeholder: string = '';  // Low-res placeholder shown while loading
srcset: string = '';       // Responsive srcset attribute
sizes: string = '';        // Responsive sizes attribute
variant: 'rounded'|'square'|'circle' = 'rounded';
size: 'small'|'medium'|'large' = 'medium';
lazy: boolean = true;
fit: 'cover'|'contain'|'fill'|'none'|'scale-down' = 'cover';
width: string = '';
height: string = '';
```

## Usage

```html
<!-- Basic -->
<snice-image src="image.jpg" alt="Description"></snice-image>

<!-- Sizes -->
<snice-image src="image.jpg" size="small"></snice-image>
<snice-image src="image.jpg" size="medium"></snice-image>
<snice-image src="image.jpg" size="large"></snice-image>

<!-- Variants -->
<snice-image src="image.jpg" variant="rounded"></snice-image>
<snice-image src="image.jpg" variant="square"></snice-image>
<snice-image src="image.jpg" variant="circle"></snice-image>

<!-- Fit -->
<snice-image src="image.jpg" fit="cover" width="200px" height="200px"></snice-image>
<snice-image src="image.jpg" fit="contain" width="200px" height="200px"></snice-image>

<!-- Fallback -->
<snice-image src="image.jpg" fallback="placeholder.jpg"></snice-image>

<!-- Custom dimensions -->
<snice-image src="image.jpg" width="300px" height="200px"></snice-image>

<!-- Lazy loading -->
<snice-image src="image.jpg" lazy="false"></snice-image>

<!-- Placeholder -->
<snice-image size="medium" variant="circle"></snice-image>
```

## Features

- 3 size presets (small: 48px, medium: 96px, large: 192px)
- 3 shape variants (rounded, square, circle)
- 5 object-fit options
- Lazy loading (default on)
- Fallback image support
- Placeholder for missing images
- Custom width/height
