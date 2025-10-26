# Kanban Component

Drag-and-drop kanban board with columns and cards.

## Basic Usage

```javascript
const kanban = document.querySelector('snice-kanban');

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
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `KanbanColumn[]` | `[]` | Board columns |
| `allowDragDrop` | `boolean` | `true` | Enable drag and drop |
| `showCardCount` | `boolean` | `true` | Show card count per column |

## KanbanColumn Interface

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

## KanbanCard Interface

```typescript
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

### `addColumn(column: KanbanColumn): void`
Add new column to board.

```javascript
kanban.addColumn({
  id: 'review',
  title: 'In Review',
  cards: []
});
```

### `removeColumn(id: string | number): void`
Remove column from board.

```javascript
kanban.removeColumn('review');
```

### `addCard(columnId: string | number, card: KanbanCard): void`
Add card to specific column.

```javascript
kanban.addCard('todo', {
  id: 10,
  title: 'New Task',
  assignee: 'John'
});
```

### `removeCard(cardId: string | number): void`
Remove card from board.

```javascript
kanban.removeCard(10);
```

### `moveCard(cardId: string | number, targetColumnId: string | number): void`
Move card to different column.

```javascript
kanban.moveCard(1, 'done');
```

### `getColumn(id: string | number): KanbanColumn | undefined`
Get column by ID.

```javascript
const column = kanban.getColumn('todo');
console.log(`${column.title} has ${column.cards.length} cards`);
```

### `getCard(id: string | number): KanbanCard | undefined`
Get card by ID.

```javascript
const card = kanban.getCard(1);
console.log(card.title);
```

## Events

### `@snice/kanban-card-move`
Dispatched when card is moved between columns.

```javascript
kanban.addEventListener('@snice/kanban-card-move', (e) => {
  console.log('Card:', e.detail.card);
  console.log('From:', e.detail.fromColumn);
  console.log('To:', e.detail.toColumn);
});
```

**Detail:** `{ card: KanbanCard, fromColumn: string | number, toColumn: string | number, kanban: SniceKanbanElement }`

### `@snice/kanban-card-click`
Dispatched when card is clicked.

```javascript
kanban.addEventListener('@snice/kanban-card-click', (e) => {
  showCardDetails(e.detail.card);
});
```

**Detail:** `{ card: KanbanCard, kanban: SniceKanbanElement }`

## Examples

### Basic Board

```javascript
kanban.columns = [
  { id: 'todo', title: 'To Do', cards: [] },
  { id: 'doing', title: 'Doing', cards: [] },
  { id: 'done', title: 'Done', cards: [] }
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

### With WIP Limits

```javascript
kanban.columns = [
  { id: 'todo', title: 'To Do', cards: [] },
  { id: 'doing', title: 'Doing', limit: 3, cards: [] },
  { id: 'done', title: 'Done', cards: [] }
];
```

### Rich Cards

```javascript
kanban.columns = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: 1,
        title: 'Design Landing Page',
        description: 'Create mockups and wireframes',
        assignee: 'Alice',
        labels: ['design', 'high-priority'],
        color: '#f44336'
      }
    ]
  }
];
```

### Event Handling

```javascript
kanban.addEventListener('@snice/kanban-card-move', (e) => {
  // Update backend
  updateCardStatus(e.detail.card.id, e.detail.toColumn);

  // Show notification
  showNotification(`Moved "${e.detail.card.title}" to ${e.detail.toColumn}`);
});

kanban.addEventListener('@snice/kanban-card-click', (e) => {
  // Show modal with card details
  showCardModal(e.detail.card);
});
```

### Dynamic Updates

```javascript
// Add new card
function addTask(title, columnId) {
  const newCard = {
    id: Date.now(),
    title,
    assignee: currentUser.name
  };

  kanban.addCard(columnId, newCard);
}

// Move card
function completeTask(cardId) {
  kanban.moveCard(cardId, 'done');
}

// Remove card
function deleteTask(cardId) {
  kanban.removeCard(cardId);
}
```

### Project Management

```javascript
kanban.columns = [
  {
    id: 'backlog',
    title: 'Backlog',
    cards: [
      { id: 1, title: 'Feature A', labels: ['feature'], assignee: 'John' },
      { id: 2, title: 'Bug Fix B', labels: ['bug'], color: '#f44336' }
    ]
  },
  {
    id: 'sprint',
    title: 'Current Sprint',
    limit: 5,
    color: '#ff9800',
    cards: [
      {
        id: 3,
        title: 'Implement Auth',
        description: 'JWT-based authentication',
        assignee: 'Sarah',
        labels: ['backend', 'security']
      }
    ]
  },
  {
    id: 'review',
    title: 'Code Review',
    color: '#9c27b0',
    cards: []
  },
  {
    id: 'deployed',
    title: 'Deployed',
    color: '#4caf50',
    cards: []
  }
];
```

### Personal Task Board

```javascript
kanban.columns = [
  {
    id: 'today',
    title: 'Today',
    limit: 3,
    cards: [
      { id: 1, title: 'Morning workout', labels: ['health'] },
      { id: 2, title: 'Team meeting', labels: ['work'] }
    ]
  },
  {
    id: 'this-week',
    title: 'This Week',
    cards: []
  },
  {
    id: 'completed',
    title: 'Completed',
    cards: []
  }
];
```

### Bug Tracking

```javascript
kanban.columns = [
  {
    id: 'reported',
    title: 'Reported',
    cards: bugs.map(bug => ({
      id: bug.id,
      title: bug.title,
      description: bug.description,
      assignee: bug.reporter,
      labels: [bug.severity, bug.priority],
      color: bug.severity === 'critical' ? '#f44336' : '#ff9800'
    }))
  },
  {
    id: 'investigating',
    title: 'Investigating',
    limit: 5,
    cards: []
  },
  {
    id: 'fixing',
    title: 'Fixing',
    limit: 3,
    cards: []
  },
  {
    id: 'fixed',
    title: 'Fixed',
    cards: []
  }
];
```

### Sales Pipeline

```javascript
kanban.columns = [
  { id: 'lead', title: 'New Leads', cards: [] },
  { id: 'contacted', title: 'Contacted', cards: [] },
  { id: 'qualified', title: 'Qualified', cards: [] },
  { id: 'proposal', title: 'Proposal Sent', cards: [] },
  { id: 'closed', title: 'Closed Won', color: '#4caf50', cards: [] }
];

// Add deal
kanban.addCard('lead', {
  id: deal.id,
  title: deal.company,
  description: `$${deal.value}`,
  assignee: deal.owner
});
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
kanban.addEventListener('@snice/kanban-card-move', async (e) => {
  try {
    await fetch('/api/cards/' + e.detail.card.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnId: e.detail.toColumn
      })
    });
  } catch (error) {
    // Revert on error
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

## Browser Support

- Modern browsers with Custom Elements v1 support
- HTML5 Drag and Drop API
- Touch events for mobile (future enhancement)
