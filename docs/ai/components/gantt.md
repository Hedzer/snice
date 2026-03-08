# snice-gantt

Interactive Gantt chart with draggable/resizable task bars, zoom levels, task groups, progress indicators, dependencies, and today line.

## Properties

```ts
tasks: GanttTask[] = []              // Task data array (set via JS)
zoom: GanttZoom = 'week'             // attr: zoom — 'day' | 'week' | 'month'
showDependencies: boolean = true     // attr: show-dependencies — Render dependency arrows
```

## Types

```ts
interface GanttTask {
  id: string;
  name: string;
  start: string;          // ISO date (YYYY-MM-DD)
  end: string;            // ISO date (YYYY-MM-DD)
  progress?: number;      // 0-100 completion percentage
  dependencies?: string[];// IDs of prerequisite tasks
  color?: string;         // Bar color override
  group?: string;         // Group name for task grouping
}
```

## Events

- `task-click` -> `{ task: GanttTask }` — Task bar or name clicked
- `task-resize` -> `{ task: GanttTask, start: string, end: string }` — Task resized via drag handles
- `task-move` -> `{ task: GanttTask, start: string, end: string }` — Task moved via drag
- `task-link` -> `{ source: string, target: string }` — Dependency link created

## Methods

- `scrollToDate(date: string): void` — Scroll timeline to center on a date
- `scrollToTask(id: string): void` — Scroll to a task's start date

**CSS Parts:**
- `base` - Outer Gantt container div
- `header` - Top header bar with zoom controls
- `controls` - Zoom toggle button group
- `body` - Main content area (task list + timeline)
- `task-list` - Left sidebar with task names
- `timeline` - Right scrollable timeline area

## Behavior

- Left sidebar shows task names (grouped if `group` set)
- Timeline auto-calculates range from task dates with padding
- Bars are draggable (move) and resizable (left/right handles)
- Today line shown as red vertical indicator
- Zoom toggle buttons in header (Day/Week/Month)

## Usage

```html
<snice-gantt zoom="week" show-dependencies></snice-gantt>
```

```typescript
gantt.tasks = [
  { id: '1', name: 'Design', start: '2026-03-01', end: '2026-03-07', progress: 80, group: 'Phase 1' },
  { id: '2', name: 'Develop', start: '2026-03-05', end: '2026-03-15', dependencies: ['1'], group: 'Phase 1' },
  { id: '3', name: 'Test', start: '2026-03-12', end: '2026-03-20', color: 'rgb(234 88 12)' }
];
gantt.addEventListener('task-move', e => console.log(e.detail));
gantt.scrollToDate('2026-03-01');
```
