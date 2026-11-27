# snice-kanban

Drag-and-drop kanban board.

## Properties

```typescript
columns: KanbanColumn[] = [];           // attribute: false
allowDragDrop: boolean = true;          // attr: allow-drag-drop
showCardCount: boolean = true;          // attr: show-card-count
```

## Types

```typescript
interface KanbanLabel {
  text: string;
  color?: string;
  background?: string;
  icon?: string; // registry name ('fire'), URL, or text
  iconPosition?: 'left' | 'right';
}

interface KanbanColumn {
  id: string | number;
  title: string;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
  collapsed?: boolean;
}

interface KanbanCard {
  id: string | number;
  title: string;
  description?: string;
  assignee?: string;
  labels?: (string | KanbanLabel)[];
  color?: string;
  data?: any;
}
```

## Methods

- `addColumn(column: KanbanColumn): void`
- `removeColumn(id: string | number): void`
- `addCard(columnId: string | number, card: KanbanCard): void`
- `removeCard(cardId: string | number): void`
- `moveCard(cardId: string | number, targetColumnId: string | number, targetIndex?: number): void`
- `getColumn(id: string | number): KanbanColumn | undefined`
- `getCard(id: string | number): KanbanCard | undefined`
- `filterByLabels(labels: string[]): void`
- `search(query: string): void`
- `clearFilters(): void`

## Events

- `kanban-card-move` → `{ card, fromColumn, toColumn, kanban }`
- `kanban-card-click` → `{ card, kanban }`

## CSS Parts

- `base` - Outer kanban board container div
- `column-header` - Column header with title and card count
- `column-cards` - Card list area within a column
- `column` - A column container
- `column-title` - Column title text
- `column-count` - Column card-count badge
- `empty` - "No cards" placeholder inside an empty column
- `card` - A card
- `card-title` - Card title
- `card-description` - Card description
- `card-meta` - Card meta row (assignee + labels)
- `card-assignee` - Card assignee row
- `card-labels` - Card label list
- `card-label` - A single card label
- `card-label-icon` - Icon wrapper inside a card label

State tokens:

- `column-collapsed` - Added to `column` while the column is collapsed
- `card-grabbed` - Added to `card` while the card is keyboard-grabbed

## Basic Usage

```typescript
import 'snice/components/kanban/snice-kanban';
```

```javascript
kanban.columns = [
  {
    id: 'todo', title: 'To Do', color: '#f44336',
    cards: [
      { id: 1, title: 'Task', description: 'Details', assignee: 'Alice',
        labels: ['bug', { text: 'urgent', color: '#dc2626', background: '#fee2e2', icon: '🔥' }],
        color: '#f44336' }
    ]
  },
  { id: 'done', title: 'Done', cards: [] }
];

kanban.addCard('todo', { id: 2, title: 'New Task' });
kanban.moveCard(1, 'done');
kanban.filterByLabels(['bug']);
kanban.search('landing page');
kanban.clearFilters();

kanban.addEventListener('kanban-card-move', (e) => {
  console.log(`Moved ${e.detail.card.title}`);
});
```

```html
<snice-kanban allow-drag-drop="false"></snice-kanban>
```
