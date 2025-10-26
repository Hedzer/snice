# List Component

Display a list of items with optional selection, icons, and descriptions.

## Basic Usage

```html
<snice-list id="list"></snice-list>
<script>
  document.getElementById('list').items = [
    { id: '1', label: 'Item 1', icon: '📄' },
    { id: '2', label: 'Item 2', icon: '📄' }
  ];
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `ListItem[]` | `[]` | Array of items |
| `selectionMode` | `'single' \| 'multiple' \| 'none'` | `'none'` | Selection mode |
| `selectedItems` | `string[]` | `[]` | Selected item IDs |
| `hoverable` | `boolean` | `true` | Hover effects |
| `dividers` | `boolean` | `false` | Show dividers |
| `dense` | `boolean` | `false` | Compact spacing |

## ListItem Interface

```typescript
interface ListItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  iconImage?: string;
  disabled?: boolean;
  selected?: boolean;
  data?: any;
}
```

## Methods

- `selectItem(id: string)` - Select item
- `deselectItem(id: string)` - Deselect item
- `toggleSelection(id: string)` - Toggle selection
- `getSelectedItems(): ListItem[]` - Get selected items

## Events

- `@snice/list-item-select` - Item selected (detail: { item, selected, list })

## Examples

```html
<!-- With dividers -->
<snice-list dividers></snice-list>

<!-- Single selection -->
<snice-list selection-mode="single"></snice-list>

<!-- Dense -->
<snice-list dense></snice-list>
```
