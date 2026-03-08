<!-- AI: For a low-token version of this doc, use docs/ai/components/app-tiles.md instead -->

# App Tiles Component

## Table of Contents
- [Importing](#importing)
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [App Tiles Component](#app-tiles-component)
- [Icon Resolution Order](#icon-resolution-order)

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/app-tiles/snice-app-tiles';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-app-tiles.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tiles` | `AppTile[]` | `[]` | Array of tile data objects (programmatic mode) |
| `columns` | `number` | `4` | Number of grid columns |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Tile size |
| `variant` | `'grid' \| 'list' \| 'compact'` | `'grid'` | Layout variant |

### AppTile Interface

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Tile label |
| `icon` | `string` | URL, emoji, or Material Symbols ligature name |
| `color` | `string?` | Background color for letter/ligature fallback |
| `href` | `string?` | Navigation URL on click |
| `badge` | `string?` | Badge content |

### snice-app-tile Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Tile label |
| `icon` | URL, emoji, or Material Symbols ligature |
| `color` | Background color |
| `href` | Navigation URL |
| `badge` | Badge content |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tile-click` | `{ tile: AppTile, index: number }` | Fired when a tile is clicked |

## CSS Custom Properties

| Variable | Description |
|----------|-------------|
| `--snice-app-tile-icon-size` | Override icon container width/height. Takes precedence over the `size` attribute. |

## Basic Usage

```html
<snice-app-tiles columns="3">
  <snice-app-tile name="Mail" icon="mail" color="rgb(220 38 38)"></snice-app-tile>
  <snice-app-tile name="Calendar" icon="calendar_today" color="rgb(37 99 235)"></snice-app-tile>
  <snice-app-tile name="Drive" icon="folder" color="rgb(234 88 12)"></snice-app-tile>
</snice-app-tiles>
```

```typescript
import 'snice/components/app-tiles/snice-app-tiles';
```

## Examples

### Material Icons

Use the `icon` attribute with a Material Symbols ligature name.

```html
<snice-app-tiles columns="3">
  <snice-app-tile name="Mail" icon="mail" color="rgb(220 38 38)"></snice-app-tile>
  <snice-app-tile name="Calendar" icon="calendar_today" color="rgb(37 99 235)"></snice-app-tile>
  <snice-app-tile name="Videos" icon="play_circle" color="rgb(220 38 38)" badge="5"></snice-app-tile>
</snice-app-tiles>
```

### Letter Fallback

When no `icon` is provided, the first letter of the name is used with the specified `color`.

```html
<snice-app-tiles columns="3">
  <snice-app-tile name="Slack" color="rgb(97 31 105)"></snice-app-tile>
  <snice-app-tile name="Figma" color="rgb(162 89 255)"></snice-app-tile>
  <snice-app-tile name="GitHub" color="rgb(82 82 82)"></snice-app-tile>
</snice-app-tiles>
```

### Image Icons (Programmatic)

Set the `tiles` property with an array of tile objects to use image URLs.

```typescript
tiles.columns = 3;
tiles.tiles = [
  { id: '1', name: 'Chrome', icon: 'https://cdn.example.com/chrome.svg' },
  { id: '2', name: 'Slack', icon: 'https://cdn.example.com/slack.svg' },
];
```

### List Variant

Use `variant="list"` with `columns="1"` for a vertical list layout.

```html
<snice-app-tiles columns="1" variant="list">
  <snice-app-tile name="Dashboard" icon="dashboard" color="rgb(37 99 235)"></snice-app-tile>
  <snice-app-tile name="Analytics" icon="bar_chart" color="rgb(22 163 74)"></snice-app-tile>
  <snice-app-tile name="Messages" icon="chat" color="rgb(147 51 234)" badge="8"></snice-app-tile>
</snice-app-tiles>
```

### Sizes

Use the `size` attribute to change tile size. Available sizes: `sm`, `md` (default), `lg`, `xl`, `2xl`.

```html
<snice-app-tiles columns="2" size="xl">
  <snice-app-tile name="Photos" icon="photo_library" color="rgb(22 163 74)"></snice-app-tile>
  <snice-app-tile name="Maps" icon="map" color="rgb(14 165 233)"></snice-app-tile>
</snice-app-tiles>

<snice-app-tiles columns="2" size="2xl">
  <snice-app-tile name="Camera" icon="photo_camera" color="rgb(147 51 234)"></snice-app-tile>
  <snice-app-tile name="Weather" icon="wb_sunny" color="rgb(234 88 12)"></snice-app-tile>
</snice-app-tiles>
```

### Custom Icon Size

Use the `--snice-app-tile-icon-size` CSS variable to set a fully custom icon size.

```html
<snice-app-tiles columns="3" style="--snice-app-tile-icon-size: 7rem">
  <snice-app-tile name="Gallery" icon="collections" color="rgb(37 99 235)"></snice-app-tile>
</snice-app-tiles>
```

### Badges

Use the `badge` attribute to display a notification badge on a tile.

```html
<snice-app-tile name="Messages" icon="chat" badge="12"></snice-app-tile>
<snice-app-tile name="AWS" color="rgb(255 153 0)" badge="!"></snice-app-tile>
```

## App Tiles Component

An app launcher grid like Google's app drawer or a phone home screen. Supports material icons, image URLs, emoji, and letter fallbacks with optional badges.

## Icon Resolution Order

1. No icon provided: displays first letter of name on a colored circle
2. `img://` prefix or URL/path: renders as `<img>` element
3. Emoji characters (no ASCII letters): renders as emoji
4. ASCII text: renders as Material Symbols ligature
