# snice-gantt

Project timeline visualization.

## Properties

```typescript
tasks: GanttTask[] = [];
viewMode: 'day'|'week'|'month'|'year' = 'day';
showToday: boolean = true;
showProgress: boolean = true;
showDependencies: boolean = false;
minDate: Date | string = '';
maxDate: Date | string = '';
```

## GanttTask

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

```typescript
getTask(id: string | number): GanttTask | undefined
scrollToToday(): void
scrollToTask(id: string | number): void
```

## Events

- `@snice/gantt-task-click` - Task clicked (detail: { task, gantt })

## Usage

```javascript
gantt.tasks = [
  {
    id: 1,
    name: 'Planning',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 7),
    progress: 100,
    color: '#4caf50'
  },
  {
    id: 2,
    name: 'Development',
    start: new Date(2024, 0, 8),
    end: new Date(2024, 0, 31),
    progress: 45,
    color: '#ff9800',
    dependencies: [1]
  }
];

// View modes
gantt.viewMode = 'week'; // day|week|month|year

// Events
gantt.addEventListener('@snice/gantt-task-click', (e) => {
  console.log(e.detail.task);
});
```

```html
<snice-gantt
  view-mode="month"
  show-dependencies
  min-date="2024-01-01"
  max-date="2024-12-31">
</snice-gantt>
```

## Features

- Timeline visualization
- Task bars with progress
- Multiple view modes
- Color-coded tasks
- Task dependencies
- Date range control
- Today indicator
- Click handling
- Programmatic navigation
