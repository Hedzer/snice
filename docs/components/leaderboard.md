<!-- AI: For a low-token version of this doc, use docs/ai/components/leaderboard.md instead -->

# Leaderboard Component

The leaderboard component displays a ranked list of entries with optional avatars, change indicators, and podium highlighting. It supports a **dual API**: declarative child elements (`<snice-leaderboard-entry>`) and an imperative `setEntries()` method.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Declarative API (Child Elements)](#declarative-api-child-elements)
- [Imperative API (setEntries)](#imperative-api-setentries)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Variants](#variants)
- [CSS Custom Properties](#css-custom-properties)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-leaderboard title="Top Players">
  <snice-leaderboard-entry rank="1" name="Alice" score="2500"></snice-leaderboard-entry>
  <snice-leaderboard-entry rank="2" name="Bob" score="2100"></snice-leaderboard-entry>
</snice-leaderboard>
```

```typescript
import 'snice/components/leaderboard/snice-leaderboard';
```

## Declarative API (Child Elements)

Use `<snice-leaderboard-entry>` elements as children of `<snice-leaderboard>`. Each entry is a data container that the parent reads and renders.

```html
<snice-leaderboard variant="podium" title="Season Rankings">
  <snice-leaderboard-entry
    rank="1"
    name="Alice"
    score="2,500"
    avatar="alice.jpg"
    change="3"
    highlighted>
  </snice-leaderboard-entry>
  <snice-leaderboard-entry
    rank="2"
    name="Bob"
    score="2,100"
    change="-1">
  </snice-leaderboard-entry>
  <snice-leaderboard-entry
    rank="3"
    name="Charlie"
    score="1,800"
    change="2">
  </snice-leaderboard-entry>
</snice-leaderboard>
```

### Entry Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `rank` | `number` | `0` | Position/rank number |
| `name` | `string` | `''` | Display name |
| `score` | `string` | `''` | Score to display |
| `avatar` | `string` | `''` | URL to avatar image (optional) |
| `change` | `number` | `0` | Rank change indicator (positive = up, negative = down) |
| `highlighted` | `boolean` | `false` | Highlight this entry |

## Imperative API (setEntries)

For dynamic data (e.g., fetched from an API), use the `setEntries()` method.

```javascript
const leaderboard = document.querySelector('snice-leaderboard');

leaderboard.setEntries([
  { rank: 1, name: 'Alice', score: 2500, avatar: 'alice.jpg', change: 3, highlighted: true },
  { rank: 2, name: 'Bob', score: 2100, change: -1 },
  { rank: 3, name: 'Charlie', score: 1800, change: 2 },
  { rank: 4, name: 'Diana', score: 1500 },
]);
```

### Dual API Precedence

When **both** child elements and `setEntries()` are used:
- Child elements (`<snice-leaderboard-entry>`) take precedence
- `setEntries()` calls are ignored while child elements are present
- When all children are removed, `setEntries()` becomes active again

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'podium' \| 'compact'` | `'default'` | Display variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Entry size |
| `title` | `string` | `''` | Optional title displayed above the list |

## Methods

### `setEntries(entries: LeaderboardEntry[]): void`

Set leaderboard entries imperatively. Each entry is an object with these fields:

```typescript
interface LeaderboardEntry {
  rank: number;         // Position number
  name: string;         // Display name
  score: number | string; // Score value
  avatar?: string;      // Avatar image URL
  change?: number;      // Rank change (positive = up, negative = down)
  highlighted?: boolean; // Highlight this entry
}
```

## Events

### `entry-click`

Fired when a leaderboard entry is clicked.

**Event Detail:**
```typescript
{
  entry: LeaderboardEntry; // The clicked entry data
  index: number;           // Index of the entry
}
```

**Example:**
```javascript
leaderboard.addEventListener('entry-click', (e) => {
  console.log('Clicked:', e.detail.entry.name);
});
```

## Variants

### Default
A flat list of ranked entries.

```html
<snice-leaderboard>...</snice-leaderboard>
```

### Podium
The top 3 entries are displayed in a podium layout (2nd, 1st, 3rd). Remaining entries appear as a regular list below.

```html
<snice-leaderboard variant="podium">...</snice-leaderboard>
```

### Compact
Tighter spacing with smaller avatars, suitable for sidebars or smaller containers.

```html
<snice-leaderboard variant="compact">...</snice-leaderboard>
```

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--leaderboard-bg` | Background color | `var(--snice-color-background)` |
| `--leaderboard-text` | Primary text color | `var(--snice-color-text)` |
| `--leaderboard-text-secondary` | Secondary text color | `var(--snice-color-text-secondary)` |
| `--leaderboard-border` | Border color | `var(--snice-color-border)` |
| `--leaderboard-primary` | Highlight/accent color | `var(--snice-color-primary)` |
| `--leaderboard-success` | Positive change color | `var(--snice-color-success)` |
| `--leaderboard-danger` | Negative change color | `var(--snice-color-danger)` |
| `--leaderboard-bg-element` | Element background | `var(--snice-color-background-element)` |
| `--leaderboard-radius` | Border radius | `var(--snice-border-radius-lg)` |

### CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer leaderboard container |
| `title` | The title heading |
| `list` | The entries list |
| `empty` | The empty state message |

## Accessibility

- Entries are rendered as `<li>` inside an `<ol>` list
- Rank numbers are visible and styled for top-3 positions (gold, silver, bronze)
- Change indicators use up/down arrows for visual clarity
- Avatar placeholders show the first initial when no image is provided
- Entries are clickable and emit `entry-click` events
