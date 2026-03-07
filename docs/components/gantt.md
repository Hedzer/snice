<!-- AI: For a low-token version of this doc, use docs/ai/components/gantt.md instead -->

# Gantt Component

The Gantt component displays an interactive Gantt chart for project timeline visualization. It features draggable and resizable task bars, multiple zoom levels, task grouping, progress indicators, dependency arrows, and a today line.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-gantt></snice-gantt>
```

```typescript
import 'snice/components/gantt/snice-gantt';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tasks` | `GanttTask[]` | `[]` | Array of task objects (set via JavaScript) |
| `zoom` | `'day' \| 'week' \| 'month'` | `'week'` | Timeline zoom level |
| `showDependencies` (attr: `show-dependencies`) | `boolean` | `true` | Render dependency arrows between tasks |

### GanttTask Type

```typescript
interface GanttTask {
  id: string;
  name: string;
  start: string;          // ISO date (YYYY-MM-DD)
  end: string;            // ISO date (YYYY-MM-DD)
  progress?: number;      // 0-100 completion percentage
  dependencies?: string[];// IDs of prerequisite tasks
  color?: string;         // Bar color override
  group?: string;         // Group name for visual grouping
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `scrollToDate()` | `date: string` | Scroll the timeline to center on a specific date (ISO format) |
| `scrollToTask()` | `id: string` | Scroll the timeline to a specific task's start date |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `task-click` | `{ task: GanttTask }` | Fired when a task bar or task name is clicked |
| `task-resize` | `{ task: GanttTask, start: string, end: string }` | Fired when a task is resized by dragging its left or right handles |
| `task-move` | `{ task: GanttTask, start: string, end: string }` | Fired when a task bar is dragged to a new position |
| `task-link` | `{ source: string, target: string }` | Fired when a dependency link is created between tasks |

## Examples

### Basic Project Timeline

Display a simple list of tasks on a weekly timeline.

```html
<snice-gantt id="project-gantt" zoom="week"></snice-gantt>

<script type="module">
  import 'snice/components/gantt/snice-gantt';

  const gantt = document.getElementById('project-gantt');
  gantt.tasks = [
    { id: '1', name: 'Research', start: '2026-03-01', end: '2026-03-05', progress: 100 },
    { id: '2', name: 'Design', start: '2026-03-03', end: '2026-03-10', progress: 75 },
    { id: '3', name: 'Development', start: '2026-03-08', end: '2026-03-21', progress: 30 },
    { id: '4', name: 'Testing', start: '2026-03-18', end: '2026-03-25', progress: 0 },
    { id: '5', name: 'Launch', start: '2026-03-25', end: '2026-03-27', progress: 0 }
  ];
</script>
```

### Grouped Tasks with Dependencies

Use the `group` field to visually group related tasks and `dependencies` to draw arrows between them.

```html
<snice-gantt id="grouped-gantt" zoom="week" show-dependencies></snice-gantt>

<script type="module">
  const gantt = document.getElementById('grouped-gantt');
  gantt.tasks = [
    { id: '1', name: 'Requirements', start: '2026-04-01', end: '2026-04-05', progress: 100, group: 'Planning' },
    { id: '2', name: 'Architecture', start: '2026-04-03', end: '2026-04-08', progress: 80, group: 'Planning', dependencies: ['1'] },
    { id: '3', name: 'Frontend', start: '2026-04-08', end: '2026-04-18', progress: 40, group: 'Development', dependencies: ['2'] },
    { id: '4', name: 'Backend', start: '2026-04-08', end: '2026-04-20', progress: 35, group: 'Development', dependencies: ['2'] },
    { id: '5', name: 'Integration', start: '2026-04-18', end: '2026-04-25', progress: 0, group: 'QA', dependencies: ['3', '4'] },
    { id: '6', name: 'Release', start: '2026-04-25', end: '2026-04-28', progress: 0, group: 'QA', dependencies: ['5'] }
  ];
</script>
```

### Custom Task Colors

Use the `color` field on individual tasks to override the default bar color.

```html
<snice-gantt id="colored-gantt" zoom="week"></snice-gantt>

<script type="module">
  const gantt = document.getElementById('colored-gantt');
  gantt.tasks = [
    { id: '1', name: 'Critical Path', start: '2026-05-01', end: '2026-05-10', color: 'rgb(220 38 38)', progress: 50 },
    { id: '2', name: 'Normal Task', start: '2026-05-03', end: '2026-05-12', progress: 25 },
    { id: '3', name: 'Milestone', start: '2026-05-08', end: '2026-05-09', color: 'rgb(234 88 12)', progress: 0 },
    { id: '4', name: 'Low Priority', start: '2026-05-10', end: '2026-05-20', color: 'rgb(22 163 74)', progress: 10 }
  ];
</script>
```

### Zoom Levels

Toggle between day, week, and month views using the `zoom` property or the built-in header toggle buttons.

```html
<snice-gantt id="zoom-gantt" zoom="month"></snice-gantt>

<div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
  <button onclick="document.getElementById('zoom-gantt').zoom = 'day'">Day</button>
  <button onclick="document.getElementById('zoom-gantt').zoom = 'week'">Week</button>
  <button onclick="document.getElementById('zoom-gantt').zoom = 'month'">Month</button>
</div>

<script type="module">
  const gantt = document.getElementById('zoom-gantt');
  gantt.tasks = [
    { id: '1', name: 'Phase 1', start: '2026-01-01', end: '2026-03-31', progress: 100, group: 'H1' },
    { id: '2', name: 'Phase 2', start: '2026-04-01', end: '2026-06-30', progress: 60, group: 'H1' },
    { id: '3', name: 'Phase 3', start: '2026-07-01', end: '2026-09-30', progress: 10, group: 'H2' },
    { id: '4', name: 'Phase 4', start: '2026-10-01', end: '2026-12-31', progress: 0, group: 'H2' }
  ];
</script>
```

### Event Handling

Listen for task interactions to update your application state or sync with a backend.

```html
<snice-gantt id="event-gantt" zoom="week" show-dependencies></snice-gantt>

<script type="module">
  const gantt = document.getElementById('event-gantt');
  gantt.tasks = [
    { id: '1', name: 'Design', start: '2026-03-01', end: '2026-03-07', progress: 80 },
    { id: '2', name: 'Develop', start: '2026-03-05', end: '2026-03-15', dependencies: ['1'] }
  ];

  gantt.addEventListener('task-click', (e) => {
    console.log('Clicked task:', e.detail.task.name);
  });

  gantt.addEventListener('task-move', (e) => {
    console.log('Moved task:', e.detail.task.name, 'to', e.detail.start, '-', e.detail.end);
  });

  gantt.addEventListener('task-resize', (e) => {
    console.log('Resized task:', e.detail.task.name, 'new dates:', e.detail.start, '-', e.detail.end);
  });

  // Scroll to a specific date on load
  gantt.scrollToDate('2026-03-01');
</script>
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer Gantt container |
| `header` | `<div>` | Top header bar with zoom controls |
| `controls` | `<div>` | Zoom toggle button group (Day/Week/Month) |
| `body` | `<div>` | Main content area containing task list and timeline |
| `task-list` | `<div>` | Left sidebar with task names and groups |
| `timeline` | `<div>` | Right scrollable timeline with task bars |

```css
snice-gantt::part(header) {
  background: #f8fafc;
}

snice-gantt::part(task-list) {
  min-width: 200px;
}
```

## Accessibility

- **Draggable tasks**: Task bars can be dragged to move their dates and resized via left/right edge handles
- **Today indicator**: A red vertical line marks the current date on the timeline
- **Zoom controls**: The header provides Day/Week/Month toggle buttons for quick zoom changes
- **Task grouping**: Tasks with the same `group` value are visually grouped in the sidebar for organization
- **Progress indicators**: Each task bar displays a filled portion representing its completion percentage
- **Dependency arrows**: When `show-dependencies` is enabled, arrows connect tasks to their prerequisites
