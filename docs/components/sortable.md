<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/sortable.md -->

# Sortable

A drag-and-drop container that allows users to reorder child elements. Supports vertical and horizontal layouts, drag handles, and cross-container sorting via groups.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Sort direction (layout axis) |
| `handle` | `string` | `''` | CSS selector for drag handle within each item. If empty, the entire item is draggable. |
| `disabled` | `boolean` | `false` | Disable drag-and-drop |
| `group` | `string` | `''` | Group name for cross-container sorting |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `sort-start` | `{ index: number, item: HTMLElement }` | Drag operation began |
| `sort-end` | `{ oldIndex: number, newIndex: number, item: HTMLElement }` | Drag operation ended (regardless of change) |
| `sort-change` | `{ oldIndex: number, newIndex: number, item: HTMLElement }` | Item dropped in a new position |

## Slots

| Name | Description |
|------|-------------|
| (default) | Child elements to be sortable. Each direct child becomes a draggable item. |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer sortable container |

## Basic Usage

```typescript
import 'snice/components/sortable/snice-sortable';
```

```html
<snice-sortable>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</snice-sortable>
```

## Examples

### Horizontal

Use `direction="horizontal"` for row layout.

```html
<snice-sortable direction="horizontal">
  <div>Tab 1</div>
  <div>Tab 2</div>
  <div>Tab 3</div>
</snice-sortable>
```

### Drag Handle

Use the `handle` attribute to restrict dragging to a specific element.

```html
<snice-sortable handle=".drag-handle">
  <div class="task-item">
    <span class="drag-handle">&#9776;</span>
    <span>Review pull request</span>
  </div>
  <div class="task-item">
    <span class="drag-handle">&#9776;</span>
    <span>Update documentation</span>
  </div>
</snice-sortable>
```

### Cross-Container Sorting

Use the `group` attribute to drag items between containers.

```html
<snice-sortable group="tasks">
  <div>Design mockups</div>
  <div>Write tests</div>
</snice-sortable>

<snice-sortable group="tasks">
  <div>Implement API</div>
</snice-sortable>
```

### Event Handling

Listen for `sort-change` to track reorder operations.

```typescript
sortable.addEventListener('sort-change', (e) => {
  console.log(`Moved from index ${e.detail.oldIndex} to ${e.detail.newIndex}`);
});
```

### Disabled

Set `disabled` to prevent reordering.

```html
<snice-sortable disabled>
  <div>Locked item 1</div>
  <div>Locked item 2</div>
</snice-sortable>
```

## Accessibility

- Items receive `draggable="true"` automatically
- Ghost placeholder with dashed outline shows drop position
- Dragged item has reduced opacity (0.4)
- `.sortable-dragging` class on dragged item, `.sortable-ghost` on placeholder
