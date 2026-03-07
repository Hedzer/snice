<!-- AI: For a low-token version of this doc, use docs/ai/components/avatar.md instead -->

# Avatar
`<snice-avatar>`

Displays a user profile image with automatic fallback to name-based initials or a default person icon.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/avatar/snice-avatar';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-avatar.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Image URL |
| `alt` | `string` | `''` | Alt text for the image (falls back to `name`) |
| `name` | `string` | `''` | User's name (used for initials and color generation) |
| `size` | `'xs' \| 'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl'` | `'medium'` | Avatar size |
| `shape` | `'circle' \| 'square' \| 'rounded'` | `'circle'` | Avatar shape |
| `fallbackColor` (attr: `fallback-color`) | `string` | `'#ffffff'` | Text color for initials fallback |
| `fallbackBackground` (attr: `fallback-background`) | `string` | `''` | Background color for initials fallback (overrides auto-color) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getInitials()` | `name: string` | Extract initials from a name string |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--avatar-size` | Avatar dimensions | Varies by `size` attribute |
| `--avatar-bg` | Background color | Auto-generated from name |
| `--avatar-color` | Text/icon color | `hsl(0 0% 100%)` |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer avatar container |
| `image` | `<img>` | The profile image element (when loaded) |
| `fallback` | `<div>` | Initials or default icon container |

```css
snice-avatar::part(base) {
  border: 2px solid #3b82f6;
}

snice-avatar::part(image) {
  filter: grayscale(50%);
}

snice-avatar::part(fallback) {
  font-weight: 700;
}
```

## Basic Usage

```typescript
import 'snice/components/avatar/snice-avatar';
```

```html
<snice-avatar src="/user.jpg" name="John Doe"></snice-avatar>
```

## Examples

### With Image

Use the `src` attribute to display a profile image. The `name` attribute provides alt text and fallback initials.

```html
<snice-avatar src="/photos/sarah.jpg" name="Sarah Johnson"></snice-avatar>
<snice-avatar src="/photos/michael.jpg" name="Michael Chen"></snice-avatar>
<snice-avatar src="/photos/emma.jpg" name="Emma Wilson"></snice-avatar>
```

### Initials Fallback

When no `src` is provided or the image fails to load, the component displays initials extracted from the `name`.

```html
<snice-avatar name="John Doe"></snice-avatar>
<snice-avatar name="Jane Smith"></snice-avatar>
<snice-avatar name="Alice"></snice-avatar>
```

### Default Icon

When neither `src` nor `name` is provided, a generic person icon is displayed.

```html
<snice-avatar></snice-avatar>
```

### Sizes

Use the `size` attribute to change the avatar dimensions.

```html
<snice-avatar name="XS" size="xs"></snice-avatar>
<snice-avatar name="SM" size="small"></snice-avatar>
<snice-avatar name="MD" size="medium"></snice-avatar>
<snice-avatar name="LG" size="large"></snice-avatar>
<snice-avatar name="XL" size="xl"></snice-avatar>
<snice-avatar name="XX" size="xxl"></snice-avatar>
```

### Shapes

Use the `shape` attribute to change the avatar shape.

```html
<snice-avatar name="Circle" shape="circle" size="large"></snice-avatar>
<snice-avatar name="Square" shape="square" size="large"></snice-avatar>
<snice-avatar name="Rounded" shape="rounded" size="large"></snice-avatar>
```

### Auto-generated Colors

Each name produces a consistent background color from a 15-color palette, so the same user always gets the same color.

```html
<snice-avatar name="Alice Johnson"></snice-avatar>
<snice-avatar name="Bob Smith"></snice-avatar>
<snice-avatar name="Carol White"></snice-avatar>
<snice-avatar name="David Brown"></snice-avatar>
```

### Custom Fallback Colors

Use `fallback-color` and `fallback-background` to override the auto-generated colors.

```html
<snice-avatar
  name="Custom"
  fallback-color="#fff"
  fallback-background="#3b82f6">
</snice-avatar>
<snice-avatar
  name="Brand"
  fallback-color="#000"
  fallback-background="#f59e0b">
</snice-avatar>
```

### Broken Image Fallback

When an image fails to load, the component automatically shows initials instead.

```html
<snice-avatar
  src="https://broken-url.com/404.jpg"
  name="Fallback User">
</snice-avatar>
```

### Avatar Group

Stack avatars with negative margins to create an overlapping group.

```html
<style>
  .avatar-group {
    display: flex;
    align-items: center;
  }
  .avatar-group snice-avatar {
    margin-left: -12px;
    border: 3px solid white;
    border-radius: 50%;
  }
  .avatar-group snice-avatar:first-child {
    margin-left: 0;
  }
</style>

<div class="avatar-group">
  <snice-avatar src="/photos/user1.jpg" name="User 1"></snice-avatar>
  <snice-avatar src="/photos/user2.jpg" name="User 2"></snice-avatar>
  <snice-avatar src="/photos/user3.jpg" name="User 3"></snice-avatar>
  <snice-avatar name="+5" fallback-background="#e5e7eb"></snice-avatar>
</div>
```

### Profile Card

Combine with other elements for a profile card layout.

```html
<div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <snice-avatar
    src="/photos/sarah.jpg"
    name="Sarah Johnson"
    size="large">
  </snice-avatar>
  <div>
    <p style="font-weight: 600; margin: 0;">Sarah Johnson</p>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Senior Developer</p>
  </div>
</div>
```

### Comment Thread

Use small avatars alongside user-generated content.

```html
<div style="display: flex; gap: 12px;">
  <snice-avatar name="Emma Wilson" size="medium"></snice-avatar>
  <div>
    <span style="font-weight: 600;">Emma Wilson</span>
    <span style="color: #6b7280; font-size: 12px;"> 2 hours ago</span>
    <p style="margin: 4px 0 0 0;">Great implementation!</p>
  </div>
</div>
```

## Size Reference

| Size | Dimensions | Font Size |
|------|-----------|-----------|
| `xs` | 1.5rem (24px) | 0.625rem (10px) |
| `small` | 2rem (32px) | 0.75rem (12px) |
| `medium` | 2.5rem (40px) | 0.875rem (14px) |
| `large` | 3rem (48px) | 1rem (16px) |
| `xl` | 4rem (64px) | 1.25rem (20px) |
| `xxl` | 6rem (96px) | 2rem (32px) |
