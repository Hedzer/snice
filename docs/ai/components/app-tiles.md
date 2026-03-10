# snice-app-tiles & snice-app-tile

App launcher grid like Google's app drawer or a phone home screen.

## Components

### snice-app-tiles
Container rendering a grid of tiles.

### snice-app-tile
Declarative child element. Attributes: `name`, `icon`, `color`, `href`, `badge`.

## Properties

```typescript
// snice-app-tiles
tiles: AppTile[] = [];           // Programmatic tile data (set via JS)
columns: number = 4;             // Grid columns
size: 'sm'|'md'|'lg'|'xl'|'2xl' = 'md';
variant: 'grid'|'list'|'compact' = 'grid';

interface AppTile {
  id: string;
  name: string;
  icon: string;       // URL, emoji, or Material Symbols ligature name
  color?: string;     // Background color for letter/ligature fallback
  href?: string;      // Navigate on click
  badge?: string;     // Badge content (uses snice-badge)
}
```

## Events

- `tile-click` → `{ tile: AppTile, index: number }`

## Slots

- `(default)` - `<snice-app-tile>` child elements for declarative mode

## CSS Custom Properties

- `--snice-app-tile-icon-size` - Override icon container size (e.g. `7rem`)

## CSS Parts

- `icon` - Material Symbols ligature icon span

## Basic Usage

```html
<!-- Declarative -->
<snice-app-tiles columns="3">
  <snice-app-tile name="Mail" icon="mail" color="rgb(220 38 38)"></snice-app-tile>
  <snice-app-tile name="Calendar" icon="calendar_today" color="rgb(37 99 235)"></snice-app-tile>
  <snice-app-tile name="Drive" icon="folder" color="rgb(234 88 12)" badge="3"></snice-app-tile>
</snice-app-tiles>

<!-- Programmatic with image icons -->
<snice-app-tiles columns="3"></snice-app-tiles>
```

```typescript
tiles.tiles = [
  { id: '1', name: 'Chrome', icon: 'https://example.com/chrome.svg' },
  { id: '2', name: 'Slack', icon: 'https://example.com/slack.svg' },
];

// Letter fallback (no icon)
// <snice-app-tile name="Slack" color="rgb(97 31 105)"></snice-app-tile>

// List variant
// <snice-app-tiles columns="1" variant="list">

// Custom icon size
// <snice-app-tiles style="--snice-app-tile-icon-size: 7rem">
```

## Icon Resolution

1. No icon -> letter fallback (first char of name, colored circle)
2. `img://` prefix or URL/path -> `<img>` element
3. Emoji (no ASCII letters) -> emoji display
4. ASCII text -> Material Symbols ligature
