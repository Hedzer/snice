[//]: # (AI: For a low-token version of this doc, use docs/ai/components/leaderboard.md instead)

# Leaderboard

`<snice-leaderboard>`

A ranked list component displaying positions, avatars, scores, and change indicators with optional podium styling for the top 3.

## Basic Usage

```typescript
import 'snice/components/leaderboard/snice-leaderboard';
```

```html
<snice-leaderboard id="board" metric-label="Points"></snice-leaderboard>

<script>
  document.getElementById('board').entries = [
    { rank: 1, name: 'Alice Johnson', score: 2850, change: 2 },
    { rank: 2, name: 'Bob Smith', score: 2720, change: -1 },
    { rank: 3, name: 'Carol Williams', score: 2680, change: 1 }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/leaderboard/snice-leaderboard';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-leaderboard.min.js"></script>
```

## Examples

### List Variant

The default list variant shows a table-like ranked list with headers.

```html
<snice-leaderboard id="list-board" metric-label="Points"></snice-leaderboard>

<script>
  document.getElementById('list-board').entries = [
    { rank: 1, name: 'Alice Johnson', score: 2850, change: 2 },
    { rank: 2, name: 'Bob Smith', score: 2720, change: -1 },
    { rank: 3, name: 'Carol Williams', score: 2680, change: 1 },
    { rank: 4, name: 'David Brown', score: 2510, change: 0 },
    { rank: 5, name: 'Eve Davis', score: 2340, change: -2 }
  ];
</script>
```

### Podium Variant

Use the `variant="podium"` attribute to display the top 3 entries with medal-styled podium cards. Remaining entries appear as a list below.

```html
<snice-leaderboard id="podium-board" variant="podium" metric-label="Points"></snice-leaderboard>
```

### Highlighting Current User

Set `highlighted: true` on an entry to visually distinguish it (e.g., the current user's row).

```html
<script>
  el.entries = [
    { rank: 1, name: 'Alice Johnson', score: 2850, change: 2 },
    { rank: 2, name: 'You', score: 2720, change: 3, highlighted: true },
    { rank: 3, name: 'Carol Williams', score: 2680, change: -1 }
  ];
</script>
```

### With Avatars

Provide an `avatar` URL to display a profile image. Without one, initials are generated from the name.

```html
<script>
  el.entries = [
    { rank: 1, name: 'Alice Johnson', avatar: '/avatars/alice.jpg', score: 2850, change: 2 },
    { rank: 2, name: 'Bob Smith', score: 2720, change: -1 }  // Shows "BS" initials
  ];
</script>
```

### Change Indicators

The `change` property shows position movement with colored arrows. Positive values show green up arrows, negative show red down arrows, and zero shows a dash.

```html
<script>
  el.entries = [
    { rank: 1, name: 'Alice', score: 100, change: 3 },   // +3 (green, up)
    { rank: 2, name: 'Bob', score: 90, change: -1 },      // -1 (red, down)
    { rank: 3, name: 'Carol', score: 80, change: 0 }      // -- (neutral)
  ];
</script>
```

### Handling Clicks

Listen for the `entry-click` event to handle row clicks.

```html
<snice-leaderboard id="clickable-board"></snice-leaderboard>

<script>
  document.getElementById('clickable-board').addEventListener('entry-click', e => {
    console.log('Clicked:', e.detail.entry.name, 'at index', e.detail.index);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `entries` | `LeaderboardEntry[]` | `[]` | Array of ranked entries |
| `variant` | `'list' \| 'podium'` | `'list'` | Visual layout variant |
| `metricLabel` (attr: `metric-label`) | `string` | `'Score'` | Label for the score column header |

### LeaderboardEntry Interface

```typescript
interface LeaderboardEntry {
  rank: number;              // Position number
  name: string;              // Display name
  avatar?: string;           // Avatar image URL
  score: number | string;    // Score value
  change?: number;           // Position change (+2, -1, 0)
  highlighted?: boolean;     // Highlight this row (e.g., current user)
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `entry-click` | `{ entry: LeaderboardEntry, index: number }` | Fired when an entry is clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `entry` | Individual entry row or podium card |
| `list` | List container |
| `podium` | Podium container (podium variant) |

```css
snice-leaderboard::part(entry) {
  border-radius: 0.5rem;
}

snice-leaderboard::part(podium) {
  gap: 2rem;
}
```

## Accessibility

- Each entry has `role="button"` and is keyboard accessible
- Press Enter or Space to activate an entry
- Medal badges use semantic gradient colors for visual distinction
- Change indicators use green/red color coding with directional arrows

## Best Practices

1. Keep entries sorted by rank before passing to the component
2. Use the `highlighted` flag to mark the current user's position
3. Use the `podium` variant for gaming or competition contexts
4. Provide `avatar` URLs for a more personal display
5. Set a descriptive `metric-label` for the score column
