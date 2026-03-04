# snice-app-tiles

App launcher grid like Google's app drawer or a phone home screen.

## Properties

```typescript
// snice-app-tiles
tiles: AppTile[] = [];           // Programmatic tile data
columns: number = 4;             // Grid columns
size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md'; // Tile size
variant: 'grid' | 'list' | 'compact' = 'grid'; // Layout variant

// AppTile interface
interface AppTile {
  id: string;
  name: string;
  icon: string;       // URL, emoji, or Material Symbols ligature name
  color?: string;     // Background color for letter/ligature fallback
  href?: string;      // Navigate on click
  badge?: string;     // Badge content (uses snice-badge)
}
```

## Child Element

`<snice-app-tile>` — declarative child for defining tiles in HTML.

- `name` - Tile label
- `icon` - URL, emoji, or Material Symbols ligature
- `color` - Background color
- `href` - Navigation URL
- `badge` - Badge content

## Events

- `tile-click` -> `{ tile: AppTile, index: number }`

## Icon Resolution

1. No icon -> letter fallback (first char of name, colored circle)
2. `img://` prefix or URL/path -> `<img>` element
3. Emoji (no ASCII letters) -> emoji display
4. ASCII text -> Material Symbols ligature

## CSS Custom Properties

| Variable | Description |
|----------|-------------|
| `--snice-app-tile-icon-size` | Override icon container size (e.g. `7rem`) |

## Usage

```html
<!-- Declarative -->
<snice-app-tiles columns="3">
  <snice-app-tile name="Mail" icon="mail" color="rgb(220 38 38)"></snice-app-tile>
  <snice-app-tile name="Calendar" icon="calendar_today" color="rgb(37 99 235)"></snice-app-tile>
  <snice-app-tile name="Drive" icon="folder" color="rgb(234 88 12)" badge="3"></snice-app-tile>
</snice-app-tiles>

<!-- Programmatic with image icons -->
<snice-app-tiles id="tiles" columns="3"></snice-app-tiles>
<script>
  const tiles = document.querySelector('#tiles');
  tiles.tiles = [
    { id: '1', name: 'Chrome', icon: 'https://example.com/chrome.svg' },
    { id: '2', name: 'Slack', icon: 'https://example.com/slack.svg' },
  ];
</script>

<!-- Letter fallback (no icon) -->
<snice-app-tiles columns="3">
  <snice-app-tile name="Slack" color="rgb(97 31 105)"></snice-app-tile>
  <snice-app-tile name="GitHub" color="rgb(82 82 82)"></snice-app-tile>
</snice-app-tiles>

<!-- Custom icon size via CSS variable -->
<snice-app-tiles columns="3" style="--snice-app-tile-icon-size: 7rem">
  <snice-app-tile name="Gallery" icon="collections" color="rgb(37 99 235)"></snice-app-tile>
</snice-app-tiles>

<!-- List variant -->
<snice-app-tiles columns="1" variant="list">
  <snice-app-tile name="Dashboard" icon="dashboard"></snice-app-tile>
  <snice-app-tile name="Settings" icon="settings"></snice-app-tile>
</snice-app-tiles>
```
