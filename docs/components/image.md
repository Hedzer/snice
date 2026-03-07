<!-- AI: For a low-token version of this doc, use docs/ai/components/image.md instead -->

# Image Component

The `<snice-image>` component provides a flexible image display with variants, sizes, lazy loading, and fallback support.

## Table of Contents
- [Properties](#properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [CSS Parts](#css-parts)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Image source URL |
| `alt` | `string` | `''` | Alternative text |
| `fallback` | `string` | `''` | Fallback image URL on error |
| `placeholder` | `string` | `''` | Low-res placeholder image shown while loading |
| `srcset` | `string` | `''` | Responsive srcset attribute |
| `sizes` | `string` | `''` | Responsive sizes attribute |
| `variant` | `'rounded' \| 'square' \| 'circle'` | `'rounded'` | Shape variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Predefined size |
| `lazy` | `boolean` | `true` | Enable lazy loading |
| `fit` | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | Object-fit behavior |
| `width` | `string` | `''` | Custom width (CSS value) |
| `height` | `string` | `''` | Custom height (CSS value) |

## Basic Usage

```html
<snice-image
  src="https://example.com/image.jpg"
  alt="Description"
></snice-image>
```

## Examples

### Sizes

```html
<snice-image src="image.jpg" size="small"></snice-image>
<snice-image src="image.jpg" size="medium"></snice-image>
<snice-image src="image.jpg" size="large"></snice-image>
```

### Shape Variants

```html
<snice-image src="image.jpg" variant="rounded"></snice-image>
<snice-image src="image.jpg" variant="square"></snice-image>
<snice-image src="image.jpg" variant="circle"></snice-image>
```

### Object Fit

```html
<snice-image src="image.jpg" fit="cover" width="200px" height="200px"></snice-image>
<snice-image src="image.jpg" fit="contain" width="200px" height="200px"></snice-image>
<snice-image src="image.jpg" fit="fill" width="200px" height="200px"></snice-image>
```

### Custom Dimensions

```html
<snice-image src="image.jpg" width="300px" height="200px"></snice-image>
<snice-image src="image.jpg" width="100%" height="auto"></snice-image>
```

### Fallback Image

```html
<snice-image
  src="image.jpg"
  fallback="placeholder.jpg"
  alt="Profile picture"
></snice-image>
```

### Lazy Loading

```html
<!-- Lazy loaded (default) -->
<snice-image src="image.jpg"></snice-image>

<!-- Eager loaded -->
<snice-image src="image.jpg" lazy="false"></snice-image>
```

### Placeholder

```html
<!-- Shows placeholder when no src -->
<snice-image variant="circle" size="medium"></snice-image>
```

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Image container div |
| `image` | The img element |
| `placeholder` | Placeholder element (shown when loading or no src) |

```css
snice-image::part(container) {
  /* Image container */
}

snice-image::part(image) {
  /* The img element */
}

snice-image::part(placeholder) {
  /* Placeholder element */
}
```

## Notes

- Images are lazy-loaded by default for better performance
- Placeholder is shown when `src` is empty
- Fallback image is used when main image fails to load
- Size presets provide consistent image dimensions
- Custom width/height override size presets
