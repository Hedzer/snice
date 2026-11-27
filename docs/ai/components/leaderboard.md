# snice-leaderboard

Ranked list with podium variant, avatars, change indicators. Dual API: declarative children or imperative setter.

## Components

- `<snice-leaderboard>` - Container
- `<snice-leaderboard-entry>` - Data container child (attrs: `rank`, `name`, `score`, `avatar`, `change`, `highlighted`)

## Properties

```ts
variant: 'default'|'podium'|'compact' = 'default';
size: 'small'|'medium'|'large' = 'medium';
title: string = '';    // JS-only; a title attribute is the native tooltip, not this
```

## Methods

- `setEntries(entries: LeaderboardEntry[]): void` - Set entries imperatively (slot children take precedence)

```ts
interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number | string;
  avatar?: string;
  change?: number;
  highlighted?: boolean;
}
```

## Events

- `entry-click` → `{ entry: LeaderboardEntry, index: number }`

## Slots

- `(default)` - `<snice-leaderboard-entry>` child elements for declarative API

## CSS Custom Properties

```css
--leaderboard-bg              /* var(--snice-color-surface) */
--leaderboard-text            /* var(--snice-color-text) */
--leaderboard-text-secondary  /* var(--snice-color-text-secondary) */
--leaderboard-border          /* var(--snice-color-border) */
--leaderboard-primary         /* var(--snice-color-primary) */
--leaderboard-success         /* var(--snice-color-success) */
--leaderboard-danger          /* var(--snice-color-danger) */
--leaderboard-bg-element      /* var(--snice-color-surface-container-high) */
--leaderboard-radius          /* var(--snice-border-radius-lg) */
```

## CSS Parts

- `base` - Outer container
- `title` - Title heading
- `list` - Entries list
- `empty` - Empty state
- `podium` - Podium row (variant `podium`)
- `podium-entry` - A podium entry
- `podium-avatar` - A podium entry avatar
- `podium-avatar-placeholder` - A podium entry initial placeholder
- `podium-rank` - A podium entry rank badge
- `podium-name` - A podium entry name
- `podium-score` - A podium entry score
- `entry` - A list entry row
- `rank` - A list entry rank
- `avatar` - An entry avatar (image or initial placeholder)
- `avatar-placeholder` - A list entry initial placeholder
- `info` - A list entry name column
- `name` - A list entry name
- `score` - A list entry score
- `change` - A list entry change indicator

State tokens:

- `entry-highlighted` - Added to `entry` while the entry is highlighted
- `rank-1` / `rank-2` / `rank-3` - Added to `rank` for the top three ranks
- `podium-entry-1` / `podium-entry-2` / `podium-entry-3` - Added to `podium-entry` by rank
- `podium-rank-1` / `podium-rank-2` / `podium-rank-3` - Added to `podium-rank` by rank
- `change-up` - Added to `change` when the entry moved up
- `change-down` - Added to `change` when the entry moved down
- `change-none` - Added to `change` when the entry did not move

## Basic Usage

```html
<snice-leaderboard id="board" variant="podium">   <!-- title is JS-only: board.title = 'Top Players' -->
  <snice-leaderboard-entry rank="1" name="Alice" score="2500" change="3" highlighted></snice-leaderboard-entry>
  <snice-leaderboard-entry rank="2" name="Bob" score="2100" change="-1"></snice-leaderboard-entry>
</snice-leaderboard>
```

```typescript
// Imperative
leaderboard.setEntries([
  { rank: 1, name: 'Alice', score: 2500, avatar: 'alice.jpg', change: 3, highlighted: true },
  { rank: 2, name: 'Bob', score: 2100, change: -1 },
]);
```
