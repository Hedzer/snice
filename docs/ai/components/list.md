# snice-list

List of items with optional selection, icons, descriptions.

## Properties

```typescript
items: ListItem[] = [];
selectionMode: 'single'|'multiple'|'none' = 'none';
selectedItems: string[] = [];
hoverable: boolean = true;
dividers: boolean = false;
dense: boolean = false;
```

## ListItem

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

- `selectItem(id)`, `deselectItem(id)`, `toggleSelection(id)`
- `getSelectedItems(): ListItem[]`

## Events

- `@snice/list-item-select` (detail: { item, selected, list })

## Usage

```html
<snice-list id="list" selection-mode="single" dividers></snice-list>
<script>
  list.items = [
    { id: '1', label: 'Item 1', description: 'First', icon: '📄' },
    { id: '2', label: 'Item 2', description: 'Second', icon: '📄' }
  ];
</script>
```
