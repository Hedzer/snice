# snice-avatar

User profile images with fallback initials.

## Properties

```typescript
src: string = '';
alt: string = '';
name: string = '';
size: 'xs'|'small'|'medium'|'large'|'xl'|'xxl' = 'medium';
shape: 'circle'|'square'|'rounded' = 'circle';
fallbackColor: string = '#ffffff';
fallbackBackground: string = '';
```

## Methods

- `getInitials(name)` - Extract initials from name

## Usage

```html
<!-- With image -->
<snice-avatar
  src="/user.jpg"
  alt="John Doe"
  name="John Doe">
</snice-avatar>

<!-- Fallback to initials -->
<snice-avatar name="John Doe"></snice-avatar>

<!-- Sizes -->
<snice-avatar name="JD" size="xs"></snice-avatar>
<snice-avatar name="JD" size="small"></snice-avatar>
<snice-avatar name="JD" size="medium"></snice-avatar>
<snice-avatar name="JD" size="large"></snice-avatar>
<snice-avatar name="JD" size="xl"></snice-avatar>
<snice-avatar name="JD" size="xxl"></snice-avatar>

<!-- Shapes -->
<snice-avatar name="JD" shape="circle"></snice-avatar>
<snice-avatar name="JD" shape="square"></snice-avatar>
<snice-avatar name="JD" shape="rounded"></snice-avatar>

<!-- Custom colors -->
<snice-avatar
  name="JD"
  fallback-color="#fff"
  fallback-background="#3b82f6">
</snice-avatar>
```

**CSS Parts:**
- `base` - Outer avatar container
- `image` - The `<img>` element (when image is loaded)
- `fallback` - Initials or default icon container

## Features

- 6 size options (xs to xxl)
- 3 shape options
- Image with fallback to initials
- Custom fallback colors
- Auto-extracts initials from name
