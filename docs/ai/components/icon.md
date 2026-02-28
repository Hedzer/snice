# snice-icon

SVG icon element with built-in icon set and custom icon registry.

## Properties

```typescript
name: string = '';           // Icon name from registry
src: string = '';            // URL to SVG file (alternative to name)
size: 'small'|'medium'|'large'|number = 'medium'; // 16/24/32px or custom px
color: string = '';          // Icon color (default: currentColor)
label: string = '';          // Accessibility label (sets role="img")
```

## Slots

- `(none)` - No slots

## Events

- `(none)` - No events

## Methods

- `static registerIcon(name, svg)` - Register a custom SVG icon
- `static registerIcons(icons)` - Register multiple icons `{ name: svgString }`
- `static getIcon(name)` - Get SVG string by name
- `static getRegisteredNames()` - List all available icon names

## Built-in Icons

arrow-left, arrow-right, arrow-up, arrow-down, check, close, search, menu, plus, minus, info, warning, error, success, home, settings, user, edit, delete, star, heart, mail, notification, chevron-left, chevron-right, chevron-up, chevron-down, copy, download, upload, link, eye, eye-off, filter, sort, refresh, more-vertical, more-horizontal, calendar, clock, lock, unlock, external-link

## Usage

```html
<!-- Built-in icon -->
<snice-icon name="check"></snice-icon>

<!-- Sizes -->
<snice-icon name="star" size="small"></snice-icon>
<snice-icon name="star" size="large"></snice-icon>
<snice-icon name="star" size="48"></snice-icon>

<!-- Color -->
<snice-icon name="heart" color="rgb(220 38 38)"></snice-icon>

<!-- External SVG -->
<snice-icon src="/icons/custom.svg"></snice-icon>

<!-- With label for accessibility -->
<snice-icon name="close" label="Close dialog"></snice-icon>
```

```typescript
// Register custom icons
import { SniceIcon } from 'snice/components/icon/snice-icon';
SniceIcon.registerIcon('custom', '<svg viewBox="0 0 24 24">...</svg>');
SniceIcon.registerIcons({ icon1: '...', icon2: '...' });
```

**CSS Parts:**
- `base` - The icon container div
