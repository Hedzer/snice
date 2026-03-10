<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/badge.md -->

# Badge Component
`<snice-badge>`

The badge component displays notification indicators, status markers, and counts. It can be positioned on other elements or used inline, with support for custom colors, sizes, and animations.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Text content to display |
| `count` | `number` | `0` | Numeric count to display |
| `max` | `number` | `99` | Maximum count before showing "99+" |
| `dot` | `boolean` | `false` | Show as a dot indicator |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color variant |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Position when overlaying an element |
| `inline` | `boolean` | `false` | Display inline with text |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |
| `pulse` | `boolean` | `false` | Enable pulse animation |
| `offset` | `number` | `0` | Offset in pixels from default position |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setBadgeContent()` | `content: string` | Set the badge to display text content |
| `setBadgeCount()` | `count: number` | Set the badge to display a numeric count |
| `showDot()` | -- | Change the badge to dot mode |
| `hide()` | -- | Hide the badge by clearing all content |

## Slots

| Name | Description |
|------|-------------|
| (default) | Content the badge overlays |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer wrapper element |
| `badge` | `<span>` | The badge indicator element |

```css
snice-badge::part(badge) {
  font-weight: 700;
  text-transform: uppercase;
}

snice-badge::part(base) {
  display: inline-flex;
}
```

## Basic Usage

```typescript
import 'snice/components/badge/snice-badge';
```

```html
<!-- Simple text badge -->
<snice-badge content="New"></snice-badge>

<!-- Count badge -->
<snice-badge count="5"></snice-badge>

<!-- Dot indicator -->
<snice-badge dot></snice-badge>
```

## Examples

### Color Variants

Use the `variant` attribute to set the badge color.

```html
<snice-badge content="Default" variant="default"></snice-badge>
<snice-badge content="Primary" variant="primary"></snice-badge>
<snice-badge content="Success" variant="success"></snice-badge>
<snice-badge content="Warning" variant="warning"></snice-badge>
<snice-badge content="Error" variant="error"></snice-badge>
<snice-badge content="Info" variant="info"></snice-badge>
```

### Badge on Elements

Wrap an element with the badge to overlay it.

```html
<snice-badge count="3" variant="error">
  <button>Messages</button>
</snice-badge>

<snice-badge dot pulse variant="success">
  <img src="avatar.jpg" alt="User" style="width: 48px; height: 48px; border-radius: 50%;">
</snice-badge>
```

### Different Positions

Use the `position` attribute to place the badge at different corners.

```html
<snice-badge count="5" position="top-right">...</snice-badge>
<snice-badge count="5" position="top-left">...</snice-badge>
<snice-badge count="5" position="bottom-right">...</snice-badge>
<snice-badge count="5" position="bottom-left">...</snice-badge>
```

### Inline Badges

Use the `inline` attribute to display badges inline with text.

```html
<p>Status: <snice-badge inline content="Active" variant="success"></snice-badge></p>
<h3>Documentation <snice-badge inline content="Beta" variant="warning" size="small"></snice-badge></h3>
```

### Different Sizes

```html
<snice-badge content="Small" size="small"></snice-badge>
<snice-badge content="Medium" size="medium"></snice-badge>
<snice-badge content="Large" size="large"></snice-badge>
```

### Pulse Animation

Use the `pulse` attribute for attention-drawing animation.

```html
<snice-badge dot pulse variant="success"></snice-badge>
<snice-badge dot pulse variant="error"></snice-badge>
<snice-badge content="Live" pulse variant="error"></snice-badge>
```

### Max Count Handling

When `count` exceeds `max`, the badge displays "99+" (or whatever `max` is set to).

```html
<snice-badge count="150" max="99"></snice-badge>
<!-- Displays as "99+" -->
```

### Custom Offset

Use the `offset` attribute to adjust the badge position.

```html
<snice-badge count="5" variant="error" offset="5">
  <div style="width: 32px; height: 32px; background: #e5e7eb; border-radius: 50%;"></div>
</snice-badge>
```

### Dynamic Badge Updates

```typescript
const badge = document.querySelector('snice-badge');

badge.setBadgeCount(5);     // Show count
badge.setBadgeContent('New'); // Show text
badge.showDot();             // Show dot
badge.hide();                // Hide badge
```

## Accessibility

- **ARIA role**: Badge has `role="status"` for screen reader announcements
- **ARIA label**: Descriptive labels for badge content
- **Color contrast**: All variants meet WCAG AA standards
- **Screen reader friendly**: Content is properly announced
