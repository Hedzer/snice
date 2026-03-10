# snice-sortable

Drag-and-drop sortable container for reordering child elements.

## Properties

```typescript
direction: 'vertical'|'horizontal' = 'vertical';
handle: string = '';         // CSS selector for drag handle
disabled: boolean = false;
group: string = '';          // Group name for cross-container sorting
```

## Events

- `sort-start` → `{ index: number, item: HTMLElement }`
- `sort-end` → `{ oldIndex: number, newIndex: number, item: HTMLElement }`
- `sort-change` → `{ oldIndex: number, newIndex: number, item: HTMLElement }`

## Slots

- `(default)` - Items to be sortable (auto set `draggable`)

## CSS Parts

- `base` - Outer sortable container

## Basic Usage

```html
<snice-sortable>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</snice-sortable>

<!-- Horizontal with drag handle -->
<snice-sortable direction="horizontal" handle=".drag-handle">
  <div><span class="drag-handle">☰</span> Item A</div>
  <div><span class="drag-handle">☰</span> Item B</div>
</snice-sortable>

<!-- Cross-container sorting -->
<snice-sortable group="tasks">...</snice-sortable>
<snice-sortable group="tasks">...</snice-sortable>
```

```typescript
sortable.addEventListener('sort-change', (e) => {
  console.log(`Moved from ${e.detail.oldIndex} to ${e.detail.newIndex}`);
});
```

## Accessibility

- Items auto `draggable="true"`
- Ghost placeholder with dashed outline
- `.sortable-dragging` / `.sortable-ghost` classes during drag
