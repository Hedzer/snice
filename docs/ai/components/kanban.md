# snice-kanban

Drag-and-drop kanban board.

## Properties

```typescript
columns: KanbanColumn[] = [];
allowDragDrop: boolean = true;
showCardCount: boolean = true;
```

## Interfaces

```typescript
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
  labels?: string[];
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
moveCard(cardId: string | number, targetColumnId: string | number): void
getColumn(id: string | number): KanbanColumn | undefined
getCard(id: string | number): KanbanCard | undefined
```

## Events

- `@snice/kanban-card-move` - Card moved (detail: { card, fromColumn, toColumn, kanban })
- `@snice/kanban-card-click` - Card clicked (detail: { card, kanban })

## Usage

```javascript
kanban.columns = [
  {
    id: 'todo',
    title: 'To Do',
    color: '#f44336',
    limit: 5,
    cards: [
      {
        id: 1,
        title: 'Task',
        description: 'Details',
        assignee: 'Alice',
        labels: ['bug', 'high-priority'],
        color: '#f44336'
      }
    ]
  },
  { id: 'done', title: 'Done', cards: [] }
];

// Add/remove
kanban.addCard('todo', { id: 2, title: 'New Task' });
kanban.moveCard(1, 'done');
kanban.removeCard(2);

// Events
kanban.addEventListener('@snice/kanban-card-move', (e) => {
  console.log(`Moved ${e.detail.card.title}`);
});
```

```html
<!-- Disable drag/drop -->
<snice-kanban allow-drag-drop="false"></snice-kanban>
```

## Features

- Drag and drop cards between columns
- WIP limits per column
- Card labels and assignees
- Color-coded cards and columns
- Card counts
- Click handling
- Programmatic card movement
- Column management
- Event dispatching
