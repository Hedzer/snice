<!-- AI: For a low-token version of this doc, use docs/ai/components/sortable.md instead -->

# Sortable Component

The sortable component provides a drag-and-drop container that allows users to reorder child elements. It supports vertical and horizontal layouts, drag handles, cross-container sorting via groups, and animated reordering with a ghost placeholder.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Slots](#slots)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [CSS Classes on Items](#css-classes-on-items)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-sortable>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</snice-sortable>
```

```typescript
import 'snice/components/sortable/snice-sortable';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Sort direction (layout axis) |
| `handle` | `string` | `''` | CSS selector for the drag handle within each item. If empty, the entire item is draggable. |
| `disabled` | `boolean` | `false` | Disable drag-and-drop |
| `group` | `string` | `''` | Group name for cross-container sorting. Items can be dragged between sortable containers that share the same group name. |

## Slots

| Slot Name | Description |
|-----------|-------------|
| (default) | The child elements to be sortable. Each direct child becomes a draggable item. |

## Events

#### `sort-start`
Fired when a drag operation begins.

**Event Detail:**
```typescript
{
  index: number;       // Starting index of the dragged item
  item: HTMLElement;   // The dragged element
}
```

#### `sort-end`
Fired when a drag operation ends (regardless of whether the order changed).

**Event Detail:**
```typescript
{
  oldIndex: number;    // Original index of the item
  newIndex: number;    // New index of the item
  item: HTMLElement;   // The dragged element
}
```

#### `sort-change`
Fired when the order of items actually changes (item dropped in a new position).

**Event Detail:**
```typescript
{
  oldIndex: number;    // Original index of the item
  newIndex: number;    // New index of the item
  item: HTMLElement;   // The dragged element
}
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer sortable container |

```css
snice-sortable::part(base) {
  gap: 0.5rem;
  padding: 0.5rem;
}
```

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-spacing-xs` | Gap between items | `0.5rem` |
| `--snice-transition-fast` | Drag transition speed | `150ms` |
| `--snice-color-primary` | Ghost placeholder outline color | `rgb(37 99 235)` |

## CSS Classes on Items

The component automatically adds CSS classes to items during drag operations:

| Class | Description |
|-------|-------------|
| `.sortable-dragging` | Applied to the item being dragged (opacity: 0.4) |
| `.sortable-ghost` | Applied to the placeholder element (dashed outline) |

## Examples

### Vertical Sortable List

```html
<snice-sortable>
  <div>Apples</div>
  <div>Bananas</div>
  <div>Cherries</div>
  <div>Dates</div>
</snice-sortable>
```

### Horizontal Sortable List

Use `direction="horizontal"` to arrange items in a row.

```html
<snice-sortable direction="horizontal">
  <div>Tab 1</div>
  <div>Tab 2</div>
  <div>Tab 3</div>
  <div>Tab 4</div>
</snice-sortable>
```

### Drag Handle

Use the `handle` attribute to restrict dragging to a specific element within each item.

```html
<style>
  .task-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e2e2e2;
    border-radius: 0.25rem;
  }
  .drag-handle {
    cursor: grab;
    color: #999;
    user-select: none;
  }
  .drag-handle:active {
    cursor: grabbing;
  }
</style>

<snice-sortable handle=".drag-handle">
  <div class="task-item">
    <span class="drag-handle">&#9776;</span>
    <span>Review pull request</span>
  </div>
  <div class="task-item">
    <span class="drag-handle">&#9776;</span>
    <span>Update documentation</span>
  </div>
  <div class="task-item">
    <span class="drag-handle">&#9776;</span>
    <span>Fix login bug</span>
  </div>
</snice-sortable>
```

### Cross-Container Sorting

Use the `group` attribute to allow dragging items between multiple sortable containers.

```html
<style>
  .columns {
    display: flex;
    gap: 1rem;
  }
  .column {
    flex: 1;
  }
  .column h3 {
    margin-bottom: 0.5rem;
  }
  .card {
    padding: 0.75rem;
    background: white;
    border: 1px solid #e2e2e2;
    border-radius: 0.25rem;
  }
</style>

<div class="columns">
  <div class="column">
    <h3>To Do</h3>
    <snice-sortable group="tasks">
      <div class="card">Design mockups</div>
      <div class="card">Write tests</div>
    </snice-sortable>
  </div>
  <div class="column">
    <h3>In Progress</h3>
    <snice-sortable group="tasks">
      <div class="card">Implement API</div>
    </snice-sortable>
  </div>
  <div class="column">
    <h3>Done</h3>
    <snice-sortable group="tasks">
      <div class="card">Setup project</div>
    </snice-sortable>
  </div>
</div>
```

### Listening for Order Changes

```html
<snice-sortable id="priority-list">
  <div>High priority</div>
  <div>Medium priority</div>
  <div>Low priority</div>
</snice-sortable>

<script type="module">
  import 'snice/components/sortable/snice-sortable';

  const sortable = document.getElementById('priority-list');

  sortable.addEventListener('sort-change', (e) => {
    console.log(`Moved from index ${e.detail.oldIndex} to ${e.detail.newIndex}`);
  });

  sortable.addEventListener('sort-start', (e) => {
    console.log(`Started dragging item at index ${e.detail.index}`);
  });

  sortable.addEventListener('sort-end', (e) => {
    console.log(`Dropped item at index ${e.detail.newIndex}`);
  });
</script>
```

### Disabled State

Use the `disabled` attribute to prevent reordering.

```html
<snice-sortable disabled>
  <div>Locked item 1</div>
  <div>Locked item 2</div>
  <div>Locked item 3</div>
</snice-sortable>
```

## Accessibility

- **Drag operation**: Items receive `draggable="true"` automatically
- **Ghost placeholder**: A dashed-outline placeholder shows where the item will be dropped
- **Visual feedback**: The dragged item has reduced opacity (0.4) during drag
- **Disabled state**: When `disabled` is set, items are not draggable

## Best Practices

1. **Use drag handles for complex items**: When items contain interactive elements (buttons, links), use a `handle` to avoid accidental drags
2. **Provide visual feedback**: Style `.sortable-dragging` and `.sortable-ghost` classes for clear drag state indication
3. **Keep item count reasonable**: Very long sortable lists can be hard to reorder; consider pagination or virtual scrolling
4. **Use groups for kanban-style layouts**: The `group` property enables cross-container drag-and-drop
5. **Listen to `sort-change` for persistence**: Use the `sort-change` event (not `sort-end`) to persist order changes, since it only fires when the order actually changed
