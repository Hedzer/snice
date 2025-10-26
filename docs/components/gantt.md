# Gantt Chart Component

Visual project timeline with task bars and progress tracking.

## Basic Usage

```javascript
const gantt = document.querySelector('snice-gantt');

gantt.tasks = [
  {
    id: 1,
    name: 'Planning',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 7),
    progress: 100
  },
  {
    id: 2,
    name: 'Development',
    start: new Date(2024, 0, 8),
    end: new Date(2024, 0, 31),
    progress: 45
  }
];
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tasks` | `GanttTask[]` | `[]` | Project tasks |
| `viewMode` | `'day' \| 'week' \| 'month' \| 'year'` | `'day'` | Timeline granularity |
| `showToday` | `boolean` | `true` | Highlight today |
| `showProgress` | `boolean` | `true` | Show progress bars |
| `showDependencies` | `boolean` | `false` | Show task dependencies |
| `minDate` | `Date \| string` | `''` | Timeline start date |
| `maxDate` | `Date \| string` | `''` | Timeline end date |

## GanttTask Interface

```typescript
interface GanttTask {
  id: string | number;
  name: string;
  start: Date | string;
  end: Date | string;
  progress?: number; // 0-100
  dependencies?: (string | number)[];
  color?: string;
  data?: any;
}
```

## Methods

### `getTask(id: string | number): GanttTask | undefined`
Get task by ID.

```javascript
const task = gantt.getTask(1);
console.log(task.name, task.progress);
```

### `scrollToToday(): void`
Scroll viewport to today's date.

```javascript
gantt.scrollToToday();
```

### `scrollToTask(id: string | number): void`
Scroll to specific task.

```javascript
gantt.scrollToTask(5);
```

## Events

### `@snice/gantt-task-click`
Dispatched when task bar is clicked.

```javascript
gantt.addEventListener('@snice/gantt-task-click', (e) => {
  console.log('Task:', e.detail.task);
  showTaskDetails(e.detail.task);
});
```

**Detail:** `{ task: GanttTask, gantt: SniceGanttElement }`

## Examples

### Basic Timeline

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Task 1',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 10)
  },
  {
    id: 2,
    name: 'Task 2',
    start: new Date(2024, 0, 11),
    end: new Date(2024, 0, 20)
  }
];
```

### With Progress

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Design',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 14),
    progress: 80
  },
  {
    id: 2,
    name: 'Development',
    start: new Date(2024, 0, 8),
    end: new Date(2024, 0, 31),
    progress: 35
  }
];
```

### Color-Coded Tasks

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Planning',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 7),
    color: '#4caf50',
    progress: 100
  },
  {
    id: 2,
    name: 'In Progress',
    start: new Date(2024, 0, 8),
    end: new Date(2024, 0, 21),
    color: '#ff9800',
    progress: 40
  },
  {
    id: 3,
    name: 'Not Started',
    start: new Date(2024, 0, 22),
    end: new Date(2024, 0, 31),
    color: '#f44336',
    progress: 0
  }
];
```

### Different View Modes

```html
<button onclick="gantt.viewMode = 'day'">Day</button>
<button onclick="gantt.viewMode = 'week'">Week</button>
<button onclick="gantt.viewMode = 'month'">Month</button>
<button onclick="gantt.viewMode = 'year'">Year</button>
```

### With Dependencies

```javascript
gantt.showDependencies = true;

gantt.tasks = [
  {
    id: 1,
    name: 'Task A',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 5)
  },
  {
    id: 2,
    name: 'Task B',
    start: new Date(2024, 0, 6),
    end: new Date(2024, 0, 12),
    dependencies: [1] // Depends on Task A
  }
];
```

### Date Range

```html
<snice-gantt
  min-date="2024-01-01"
  max-date="2024-12-31">
</snice-gantt>
```

### Event Handling

```javascript
gantt.addEventListener('@snice/gantt-task-click', (e) => {
  const task = e.detail.task;

  // Show task modal
  showModal({
    title: task.name,
    content: `
      Start: ${task.start.toLocaleDateString()}
      End: ${task.end.toLocaleDateString()}
      Progress: ${task.progress}%
    `
  });
});
```

### Software Project

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Requirements Gathering',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 14),
    progress: 100,
    color: '#4caf50'
  },
  {
    id: 2,
    name: 'Design',
    start: new Date(2024, 0, 15),
    end: new Date(2024, 0, 31),
    progress: 75,
    color: '#2196f3',
    dependencies: [1]
  },
  {
    id: 3,
    name: 'Development',
    start: new Date(2024, 1, 1),
    end: new Date(2024, 2, 31),
    progress: 40,
    color: '#ff9800',
    dependencies: [2]
  },
  {
    id: 4,
    name: 'Testing',
    start: new Date(2024, 3, 1),
    end: new Date(2024, 3, 30),
    progress: 0,
    color: '#9c27b0',
    dependencies: [3]
  }
];
```

### Construction Project

```javascript
gantt.viewMode = 'week';

gantt.tasks = [
  { id: 1, name: 'Site Preparation', start: '2024-01-01', end: '2024-01-14', progress: 100 },
  { id: 2, name: 'Foundation', start: '2024-01-15', end: '2024-02-15', progress: 60 },
  { id: 3, name: 'Framing', start: '2024-02-16', end: '2024-03-30', progress: 20 },
  { id: 4, name: 'Roofing', start: '2024-04-01', end: '2024-04-21', progress: 0 },
  { id: 5, name: 'Interior', start: '2024-04-22', end: '2024-06-30', progress: 0 }
];
```

### Marketing Campaign

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Campaign Planning',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 7),
    progress: 100
  },
  {
    id: 2,
    name: 'Content Creation',
    start: new Date(2024, 0, 8),
    end: new Date(2024, 0, 21),
    progress: 70
  },
  {
    id: 3,
    name: 'Social Media',
    start: new Date(2024, 0, 15),
    end: new Date(2024, 1, 15),
    progress: 30
  },
  {
    id: 4,
    name: 'Email Campaign',
    start: new Date(2024, 0, 22),
    end: new Date(2024, 1, 10),
    progress: 10
  }
];
```

### Dynamic Updates

```javascript
// Update progress
function updateProgress(taskId, progress) {
  gantt.tasks = gantt.tasks.map(task =>
    task.id === taskId ? { ...task, progress } : task
  );
}

// Add task
function addTask(task) {
  gantt.tasks = [...gantt.tasks, task];
}

// Remove task
function removeTask(taskId) {
  gantt.tasks = gantt.tasks.filter(t => t.id !== taskId);
}
```

## Accessibility

- Keyboard navigation
- ARIA labels for tasks
- Screen reader friendly
- High contrast support

## Browser Support

- Modern browsers with Custom Elements v1 support
- Date calculations via Date API
- Responsive timeline scaling
