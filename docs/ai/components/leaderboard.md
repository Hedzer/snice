# snice-leaderboard

Ranked list with podium variant, avatars, change indicators. Dual API: declarative children or imperative setter.

## Components

- `<snice-leaderboard>` - Container
- `<snice-leaderboard-entry>` - Data container child (attrs: `rank`, `name`, `score`, `avatar`, `change`, `highlighted`)

## Properties

```ts
variant: 'default'|'podium'|'compact' = 'default';
size: 'small'|'medium'|'large' = 'medium';
title: string = '';
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
--leaderboard-bg              /* var(--snice-color-background) */
--leaderboard-text            /* var(--snice-color-text) */
--leaderboard-text-secondary  /* var(--snice-color-text-secondary) */
--leaderboard-border          /* var(--snice-color-border) */
--leaderboard-primary         /* var(--snice-color-primary) */
--leaderboard-success         /* var(--snice-color-success) */
--leaderboard-danger          /* var(--snice-color-danger) */
--leaderboard-bg-element      /* var(--snice-color-background-element) */
--leaderboard-radius          /* var(--snice-border-radius-lg) */
```

## CSS Parts

- `base` - Outer container
- `title` - Title heading
- `list` - Entries list
- `empty` - Empty state

## Basic Usage

```html
<snice-leaderboard variant="podium" title="Top Players">
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
