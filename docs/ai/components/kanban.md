# snice-kanban

Drag-and-drop kanban board.

## Properties

```typescript
columns: KanbanColumn[] = [];
allowDragDrop: boolean = true;   // attribute: allow-drag-drop
showCardCount: boolean = true;   // attribute: show-card-count
```

## Interfaces

```typescript
interface KanbanLabel {
  text: string;
  color?: string;
  background?: string;
  icon?: string; // emoji or text
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

```typescript
addColumn(column: KanbanColumn): void
removeColumn(id: string | number): void
addCard(columnId: string | number, card: KanbanCard): void
removeCard(cardId: string | number): void
moveCard(cardId: string | number, targetColumnId: string | number, targetIndex?: number): void
getColumn(id: string | number): KanbanColumn | undefined
getCard(id: string | number): KanbanCard | undefined
filterByLabels(labels: string[]): void
search(query: string): void
clearFilters(): void
```

## Events

- `kanban-card-move` - Card moved (detail: { card, fromColumn, toColumn, kanban })
- `kanban-card-click` - Card clicked (detail: { card, kanban })

## Usage

```javascript
kanban.columns = [
  {
    id: 'todo',
    title: 'To Do',
    color: '#f44336',
    cards: [
      {
        id: 1,
        title: 'Task',
        description: 'Details',
        assignee: 'Alice',
        labels: [
          'bug',
          { text: 'urgent', color: '#dc2626', background: '#fee2e2', icon: '🔥', iconPosition: 'left' }
        ],
        color: '#f44336'
      }
    ]
  },
  { id: 'done', title: 'Done', cards: [] }
];

// Add/remove/move
kanban.addCard('todo', { id: 2, title: 'New Task' });
kanban.moveCard(1, 'done');
kanban.removeCard(2);

// Filter/search
kanban.filterByLabels(['bug', 'high-priority']);
kanban.search('landing page');
kanban.clearFilters();

// Events
kanban.addEventListener('kanban-card-move', (e) => {
  console.log(`Moved ${e.detail.card.title}`);
});
```

```html
<!-- Disable drag/drop -->
<snice-kanban allow-drag-drop="false"></snice-kanban>
```

**CSS Parts:**
- `base` - Outer kanban board container div
- `column-header` - Column header with title and card count
- `column-cards` - Card list area within a column

## Features

- Drag and drop cards between columns and within same column
- Custom labels with colors, backgrounds, and icons
- Label icon positioning (left/right)
- Filter by labels
- Search by title/description
- Card assignees
- Color-coded cards and columns
- Card counts
- Click handling
- Programmatic card movement with positioning
- Column management
- Event dispatching
- View Transitions API animations
