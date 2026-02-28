[//]: # (AI: For a low-token version of this doc, use docs/ai/components/icon.md instead)

# Icon Component
`<snice-icon>`

Renders SVG icons from a built-in registry, custom registry, or external URL. Includes 40+ common icons out of the box.

## Basic Usage

```typescript
import 'snice/components/icon/snice-icon';
```

```html
<snice-icon name="check"></snice-icon>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/icon/snice-icon';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-icon.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | Icon name from registry |
| `src` | `string` | `''` | URL to external SVG file |
| `size` | `'small' \| 'medium' \| 'large' \| number` | `'medium'` | Icon size (16/24/32px or custom) |
| `color` | `string` | `''` | Icon color (defaults to currentColor) |
| `label` | `string` | `''` | Accessibility label |

## Methods

#### `static registerIcon(name: string, svg: string): void`
Register a single custom icon.

```typescript
import { SniceIcon } from 'snice/components/icon/snice-icon';
SniceIcon.registerIcon('custom', '<svg viewBox="0 0 24 24"><path d="..."/></svg>');
```

#### `static registerIcons(icons: Record<string, string>): void`
Register multiple custom icons at once.

```typescript
SniceIcon.registerIcons({
  'icon-a': '<svg viewBox="0 0 24 24">...</svg>',
  'icon-b': '<svg viewBox="0 0 24 24">...</svg>'
});
```

#### `static getIcon(name: string): string | undefined`
Get the SVG string for a registered icon.

#### `static getRegisteredNames(): string[]`
Get an array of all available icon names.

## Examples

### Built-in Icons

Use the `name` attribute to display any built-in icon.

```html
<snice-icon name="check"></snice-icon>
<snice-icon name="close"></snice-icon>
<snice-icon name="search"></snice-icon>
<snice-icon name="menu"></snice-icon>
<snice-icon name="home"></snice-icon>
<snice-icon name="settings"></snice-icon>
```

### Sizes

Use the `size` attribute to change the icon size. Accepts preset names or pixel values.

```html
<snice-icon name="star" size="small"></snice-icon>
<snice-icon name="star" size="medium"></snice-icon>
<snice-icon name="star" size="large"></snice-icon>
<snice-icon name="star" size="48"></snice-icon>
```

### Colors

Use the `color` attribute to set the icon color.

```html
<snice-icon name="heart" color="rgb(220 38 38)"></snice-icon>
<snice-icon name="check" color="rgb(22 163 74)"></snice-icon>
<snice-icon name="star" color="rgb(234 179 8)"></snice-icon>
```

### External SVG

Use the `src` attribute to load an SVG from a URL.

```html
<snice-icon src="/icons/custom.svg"></snice-icon>
<snice-icon src="https://example.com/icon.svg"></snice-icon>
```

### Accessibility

Set the `label` attribute for meaningful icons. Decorative icons are automatically hidden from screen readers.

```html
<!-- Meaningful icon with label -->
<snice-icon name="close" label="Close dialog"></snice-icon>

<!-- Decorative icon (aria-hidden by default) -->
<snice-icon name="star"></snice-icon>
```

### Custom Icon Registration

```typescript
import { SniceIcon } from 'snice/components/icon/snice-icon';

// Register single icon
SniceIcon.registerIcon('thumbs-up', '<svg viewBox="0 0 24 24"><path d="..."/></svg>');

// Register multiple icons
SniceIcon.registerIcons({
  'brand-logo': '<svg viewBox="0 0 24 24">...</svg>',
  'custom-arrow': '<svg viewBox="0 0 24 24">...</svg>'
});

// Use in HTML
// <snice-icon name="thumbs-up"></snice-icon>
```

## Built-in Icon Reference

| Name | Description |
|------|-------------|
| `arrow-left`, `arrow-right`, `arrow-up`, `arrow-down` | Directional arrows |
| `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down` | Chevron arrows |
| `check` | Checkmark |
| `close` | X / close |
| `search` | Magnifying glass |
| `menu` | Hamburger menu |
| `plus`, `minus` | Add / remove |
| `info`, `warning`, `error`, `success` | Status indicators |
| `home` | Home |
| `settings` | Gear / settings |
| `user` | User profile |
| `edit` | Pencil / edit |
| `delete` | Trash / delete |
| `star`, `heart` | Favorites |
| `mail`, `notification` | Communication |
| `copy`, `download`, `upload` | Actions |
| `link`, `external-link` | Links |
| `eye`, `eye-off` | Visibility |
| `filter`, `sort` | Data operations |
| `refresh` | Refresh / reload |
| `more-vertical`, `more-horizontal` | More options |
| `calendar`, `clock` | Date / time |
| `lock`, `unlock` | Security |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The icon container div |

```css
snice-icon::part(base) {
  padding: 4px;
}
```

## Accessibility

- Decorative icons (no `label`) have `aria-hidden="true"` and `role="presentation"`
- Meaningful icons (with `label`) have `role="img"` and the label as `aria-label`
- Use `label` for icons that convey meaning not available from surrounding text
