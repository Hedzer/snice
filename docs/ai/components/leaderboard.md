# snice-leaderboard

Ranked list with podium variant, avatars, change indicators. Dual API: declarative children or imperative setter.

## Properties

```ts
variant: 'default' | 'podium' | 'compact'  // Display variant (default: 'default')
size: 'small' | 'medium' | 'large'         // Size (default: 'medium')
title: string                               // Optional header title (default: '')
```

## Methods

```ts
setEntries(entries: LeaderboardEntry[]): void  // Set entries imperatively
```

### LeaderboardEntry

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

## Slots

- `(default)` - `<snice-leaderboard-entry>` child elements for declarative API

## Child Elements

### `<snice-leaderboard-entry>`

Data container element. Attributes: `rank` (Number), `name` (String), `score` (String), `avatar` (String, optional), `change` (Number, optional), `highlighted` (Boolean).

**Slot children take precedence over `setEntries()`.** When all children removed, falls back to imperative mode.

## Events

- `entry-click` -> `{ entry: LeaderboardEntry, index: number }` -- Entry clicked

## Variants

- `default` -- Flat list
- `podium` -- Top 3 shown as podium, rest as list
- `compact` -- Tighter spacing, smaller avatars

## CSS Custom Properties

```css
--leaderboard-bg              /* Background (default: --snice-color-background) */
--leaderboard-text            /* Text color (default: --snice-color-text) */
--leaderboard-text-secondary  /* Secondary text (default: --snice-color-text-secondary) */
--leaderboard-border          /* Border color (default: --snice-color-border) */
--leaderboard-primary         /* Primary accent (default: --snice-color-primary) */
--leaderboard-success         /* Up change color (default: --snice-color-success) */
--leaderboard-danger          /* Down change color (default: --snice-color-danger) */
--leaderboard-bg-element      /* Element background (default: --snice-color-background-element) */
--leaderboard-radius          /* Border radius (default: --snice-border-radius-lg) */
```

**CSS Parts:** `base`, `title`, `list`, `empty`

## Usage

```html
<!-- Declarative -->
<snice-leaderboard variant="podium" title="Top Players">
  <snice-leaderboard-entry rank="1" name="Alice" score="2500" change="3" highlighted></snice-leaderboard-entry>
  <snice-leaderboard-entry rank="2" name="Bob" score="2100" change="-1"></snice-leaderboard-entry>
</snice-leaderboard>
```

```js
// Imperative
const lb = document.querySelector('snice-leaderboard');
lb.setEntries([
  { rank: 1, name: 'Alice', score: 2500, avatar: 'alice.jpg', change: 3, highlighted: true },
  { rank: 2, name: 'Bob', score: 2100, change: -1 },
]);
```
