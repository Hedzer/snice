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

## CSS Parts

- `base` - Image container div (same node as `container`)
- `container` - Image container div
- `image` - The img element
- `placeholder` - Placeholder element (shown when loading or no src)
- `placeholder-empty` - The no-src placeholder box
- `icon` - Wrapper around the default placeholder glyph
- `placeholder-icon` - The default placeholder glyph wrapper

State tokens:

- `image-loaded` - Added to `image` once the image has loaded
- `placeholder-hidden` - Added to `placeholder` once the image has loaded

## Basic Usage

```typescript
import 'snice/components/image/snice-image';
```

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

<!-- Eager loading -->
<snice-image src="image.jpg" lazy="false"></snice-image>

<!-- Placeholder (no src) -->
<snice-image size="medium" variant="circle"></snice-image>
```
