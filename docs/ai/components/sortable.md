# snice-sortable

Drag-and-drop sortable container for reordering child elements.

## Properties

```ts
direction: 'vertical' | 'horizontal' = 'vertical'
handle: string = ''           // CSS selector for drag handle within items
disabled: boolean = false
group: string = ''            // group name for cross-container sorting
```

## Slots

- `default` - Items to be sortable (automatically set to `draggable`)

## Events

- `sort-start` -> `{ index: number; item: HTMLElement }`
- `sort-end` -> `{ oldIndex: number; newIndex: number; item: HTMLElement }`
- `sort-change` -> `{ oldIndex: number; newIndex: number; item: HTMLElement }`

## CSS Parts

- `base` - The outer sortable container

## CSS Custom Properties

- `--snice-spacing-xs` - Gap between items (default: `0.5rem`)
- `--snice-transition-fast` - Drag transition speed (default: `150ms`)
- `--snice-color-primary` - Ghost outline color (default: `rgb(37 99 235)`)

## CSS Classes on Items

- `.sortable-dragging` - Added to item being dragged (opacity: 0.4)
- `.sortable-ghost` - Dashed outline placeholder

## Usage

```html
<!-- Vertical sortable list -->
<snice-sortable>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</snice-sortable>

<!-- Horizontal with drag handle -->
<snice-sortable direction="horizontal" handle=".drag-handle">
  <div><span class="drag-handle">&#9776;</span> Item A</div>
  <div><span class="drag-handle">&#9776;</span> Item B</div>
</snice-sortable>
```

```typescript
sortable.addEventListener('sort-change', (e) => {
  console.log(`Moved from ${e.detail.oldIndex} to ${e.detail.newIndex}`);
});
```
