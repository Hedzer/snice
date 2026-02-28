# snice-leaderboard

Ranked list with position indicators, avatars, scores, and change tracking.

## Properties

```typescript
entries: LeaderboardEntry[] = [];
variant: 'list'|'podium' = 'list';
metricLabel: string = 'Score';  // attr: metric-label
```

## Types

```typescript
interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  score: number | string;
  change?: number;
  highlighted?: boolean;
}
```

## Events

- `entry-click` -> `{ entry: LeaderboardEntry, index: number }`

## CSS Parts

- `base` - Root container
- `entry` - Individual entry row/card
- `list` - List container
- `podium` - Podium container (podium variant only)

## Usage

```html
<snice-leaderboard metric-label="Points"></snice-leaderboard>

<script>
  const el = document.querySelector('snice-leaderboard');
  el.entries = [
    { rank: 1, name: 'Alice Johnson', score: 2850, change: 2 },
    { rank: 2, name: 'Bob Smith', score: 2720, change: -1 },
    { rank: 3, name: 'Carol Williams', score: 2680, change: 1 },
    { rank: 4, name: 'David Brown', score: 2510, change: 0, highlighted: true },
    { rank: 5, name: 'Eve Davis', score: 2340, change: -2 }
  ];
</script>

<!-- Podium variant (medal styling for top 3) -->
<snice-leaderboard variant="podium"></snice-leaderboard>

<!-- With avatars -->
<script>
  el.entries = [
    { rank: 1, name: 'Alice', avatar: '/alice.jpg', score: 2850, change: 2 }
  ];
</script>
```

## Features

- Gold/silver/bronze medal badges for top 3
- Podium variant reorders top 3 as 2nd-1st-3rd
- Change indicator arrows (+N/-N)
- Highlighted row for current user
- Auto-generated initials when no avatar provided
- Remaining entries shown as list below podium
- Keyboard accessible
