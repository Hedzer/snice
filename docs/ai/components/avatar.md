# snice-avatar

User profile image with automatic fallback to name-based initials or default person icon.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

```typescript
src: string = '';                    // Image URL
alt: string = '';                    // Alt text (falls back to `name`)
name: string = '';                   // User's name (initials + color generation)
size: 'xs'|'small'|'medium'|'large'|'xl'|'xxl' = 'medium';
shape: 'circle'|'square'|'rounded' = 'circle';
fallbackColor: string = '#ffffff';   // attr: fallback-color — text color for initials
fallbackBackground: string = '';     // attr: fallback-background — overrides auto-color
```

## Methods

- `getInitials(name: string): string` - Extract initials from a name string

## CSS Custom Properties

- `--avatar-size` - Avatar dimensions (varies by `size`)
- `--avatar-bg` - Background color (auto-generated from name)
- `--avatar-color` - Text/icon color (default: `rgb(255 255 255)`)

## CSS Parts

- `base` - Outer avatar container
- `image` - The `<img>` element (when loaded)
- `fallback` - Initials or default icon container

## Basic Usage

```html
<snice-avatar src="/user.jpg" name="John Doe"></snice-avatar>
```

## Examples

```html
<!-- Initials fallback (no image) -->
<snice-avatar name="John Doe"></snice-avatar>

<!-- Default icon (no name or image) -->
<snice-avatar></snice-avatar>

<!-- Sizes -->
<snice-avatar name="JD" size="xs"></snice-avatar>
<snice-avatar name="JD" size="large"></snice-avatar>
<snice-avatar name="JD" size="xxl"></snice-avatar>

<!-- Shapes -->
<snice-avatar name="JD" shape="circle"></snice-avatar>
<snice-avatar name="JD" shape="square"></snice-avatar>
<snice-avatar name="JD" shape="rounded"></snice-avatar>

<!-- Custom fallback colors -->
<snice-avatar name="Custom" fallback-color="#fff" fallback-background="#3b82f6"></snice-avatar>

<!-- Broken image falls back to initials -->
<snice-avatar src="https://broken-url.com/404.jpg" name="Fallback User"></snice-avatar>
```

### Size Reference

| Size | Dimensions | Font Size |
|------|-----------|-----------|
| `xs` | 1.5rem (24px) | 0.625rem |
| `small` | 2rem (32px) | 0.75rem |
| `medium` | 2.5rem (40px) | 0.875rem |
| `large` | 3rem (48px) | 1rem |
| `xl` | 4rem (64px) | 1.25rem |
| `xxl` | 6rem (96px) | 2rem |
