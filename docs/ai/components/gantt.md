# snice-gantt

Interactive Gantt chart with draggable/resizable task bars, zoom levels, task groups, progress indicators, dependencies, and today line.

## Properties

```ts
tasks: GanttTask[] = []              // Task data array (set via JS, attribute: false)
zoom: GanttZoom = 'week'             // 'day' | 'week' | 'month'
showDependencies: boolean = true     // attr: show-dependencies
```

## Types

```ts
interface GanttTask {
  id: string;
  name: string;
  start: string;          // ISO date (YYYY-MM-DD)
  end: string;            // ISO date (YYYY-MM-DD)
  progress?: number;      // 0-100
  dependencies?: string[];// task IDs
  color?: string;         // bar color override
  group?: string;         // group name
}
```

## Methods

- `scrollToDate(date: string): void` — Scroll timeline to center on a date
- `scrollToTask(id: string): void` — Scroll to a task's start date

## Events

- `task-click` → `{ task: GanttTask }` — Task bar or name clicked
- `task-resize` → `{ task: GanttTask, start: string, end: string }` — Task resized via drag handles
- `task-move` → `{ task: GanttTask, start: string, end: string }` — Task moved via drag
- `task-link` → `{ source: string, target: string }` — Dependency link created

## CSS Parts

- `base` - Root gantt container
- `header` - Header bar
- `controls` - Zoom toggle group
- `button` - A zoom button
- `zoom-button` - A zoom button (same element as `button`)
- `zoom-button-day` - The day `zoom-button`
- `zoom-button-week` - The week `zoom-button`
- `zoom-button-month` - The month `zoom-button`
- `body` - Body row holding the task list and timeline
- `task-list` - Task name column
- `task-list-header` - Task column heading
- `group-header` - Group heading row in the task column
- `task-name` - A task name row
- `timeline` - Timeline column
- `timeline-header` - Timeline header row
- `cell` - A timeline header cell
- `timeline-cell` - A timeline header cell (same element as `cell`)
- `timeline-rows` - Timeline body area holding the bars
- `bar` - A task bar
- `bar-progress` - Progress fill inside a bar
- `bar-label` - Task label inside a bar
- `handle` - A bar resize handle
- `handle-start` - The start-edge `handle`
- `handle-end` - The end-edge `handle`
- `dependency-arrow` - SVG holding a dependency arrow
- `dependency-path` - The dependency arrow path
- `today-line` - Today marker line

State tokens:

- `zoom-button-active` - Added to `zoom-button` while that zoom level is selected
- `timeline-cell-today` - Added to `timeline-cell` for the cell containing today

## Basic Usage

```typescript
import 'snice/components/gantt/snice-gantt';
```

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

## Accessibility

- Bars draggable (move) and resizable (left/right handles)
- Today line as red vertical indicator
- Zoom toggle buttons in header (Day/Week/Month)
- role/aria not explicitly set on task bars
