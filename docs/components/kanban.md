<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/kanban.md -->

# Kanban Component

Drag-and-drop kanban board with columns and cards. Supports labels with custom colors and icons, filtering, search, and programmatic card management.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `KanbanColumn[]` | `[]` | Board columns (set via JavaScript) |
| `allowDragDrop` (attr: `allow-drag-drop`) | `boolean` | `true` | Enable drag and drop |
| `showCardCount` (attr: `show-card-count`) | `boolean` | `true` | Show card count per column |

### KanbanColumn Interface

```typescript
interface KanbanColumn {
  id: string | number;
  title: string;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
  collapsed?: boolean;
}
```

### KanbanCard Interface

```typescript
interface KanbanCard {
  id: string | number;
  title: string;
  description?: string;
  assignee?: string;
  labels?: (string | KanbanLabel)[];  // String or full label object
  color?: string;
  data?: any;
}
```

### KanbanLabel Interface

```typescript
interface KanbanLabel {
  text: string;
  color?: string;            // Text color
  background?: string;       // Background color
  icon?: string;            // Emoji or text icon
  iconPosition?: 'left' | 'right';  // Icon placement
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addColumn()` | `column: KanbanColumn` | Add new column to board |
| `removeColumn()` | `id: string \| number` | Remove column from board |
| `addCard()` | `columnId: string \| number, card: KanbanCard` | Add card to specific column |
| `removeCard()` | `cardId: string \| number` | Remove card from board |
| `moveCard()` | `cardId: string \| number, targetColumnId: string \| number, targetIndex?: number` | Move card to different column and optional position |
| `getColumn()` | `id: string \| number` | Get column by ID |
| `getCard()` | `id: string \| number` | Get card by ID |
| `filterByLabels()` | `labels: string[]` | Filter cards by labels (shows cards with ANY match) |
| `search()` | `query: string` | Search cards by title or description |
| `clearFilters()` | — | Clear all active filters |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `kanban-card-move` | `{ card: KanbanCard, fromColumn: string \| number, toColumn: string \| number, kanban: SniceKanbanElement }` | Fired when card is moved between columns |
| `kanban-card-click` | `{ card: KanbanCard, kanban: SniceKanbanElement }` | Fired when card is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer kanban board container |
| `column-header` | `<div>` | Column header with title and card count |
| `column-cards` | `<div>` | Card list area within a column |

```css
snice-kanban::part(column-header) {
  font-weight: 600;
  padding: 0.75rem;
}

snice-kanban::part(column-cards) {
  min-height: 100px;
}
```

## Basic Usage

```typescript
import 'snice/components/kanban/snice-kanban';
```

```html
<snice-kanban id="board"></snice-kanban>

<script>
  const kanban = document.getElementById('board');
  kanban.columns = [
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        { id: 1, title: 'Task 1', description: 'Do something' }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      cards: []
    }
  ];
</script>
```

## Examples

### Custom Labels with Icons

Labels can be simple strings or rich objects with custom colors and icons:

```javascript
kanban.columns = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: 1,
        title: 'Redesign dashboard',
        labels: [
          'feature',
          {
            text: 'High Priority',
            color: '#dc2626',
            background: '#fee2e2',
            icon: '🔥',
            iconPosition: 'left'
          }
        ]
      }
    ]
  }
];
```

### With Column Colors

```javascript
kanban.columns = [
  { id: 'todo', title: 'To Do', color: '#f44336', cards: [] },
  { id: 'doing', title: 'Doing', color: '#ff9800', cards: [] },
  { id: 'done', title: 'Done', color: '#4caf50', cards: [] }
];
```

### Filtering and Search

```javascript
// Filter by labels (shows cards with ANY of these labels)
kanban.filterByLabels(['bug', 'high-priority']);

// Search by title or description
kanban.search('landing page');

// Clear all filters
kanban.clearFilters();
```

### Event Handling

```javascript
kanban.addEventListener('kanban-card-move', (e) => {
  updateCardStatus(e.detail.card.id, e.detail.toColumn);
});

kanban.addEventListener('kanban-card-click', (e) => {
  showCardModal(e.detail.card);
});
```

### Dynamic Updates

```javascript
// Add new card
kanban.addCard('todo', { id: Date.now(), title: 'New Task' });

// Move card
kanban.moveCard(1, 'done');

// Move to specific position
kanban.moveCard(1, 'done', 0); // Move to top

// Remove card
kanban.removeCard(2);
```

### Disable Drag and Drop

```html
<snice-kanban allow-drag-drop="false"></snice-kanban>
```

### Hide Card Counts

```html
<snice-kanban show-card-count="false"></snice-kanban>
```

### Persist to Backend

```javascript
kanban.addEventListener('kanban-card-move', async (e) => {
  try {
    await fetch('/api/cards/' + e.detail.card.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: e.detail.toColumn })
    });
  } catch (error) {
    kanban.moveCard(e.detail.card.id, e.detail.fromColumn);
    alert('Failed to move card');
  }
});
```

## Accessibility

- Keyboard navigation for cards
- ARIA labels for drag and drop
- Focus management
- Screen reader announcements
- View Transitions API animations (when available)
