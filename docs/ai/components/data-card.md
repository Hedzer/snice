# snice-data-card

Key-value detail panel with grouped sections, multiple value types, and edit-in-place.

## Properties

```typescript
fields: DataCardField[] = [];                          // JS only (attribute: false)
editable: boolean = false;                             // Global edit mode toggle
variant: 'default'|'horizontal'|'compact' = 'default';

interface DataCardField {
  label: string;
  value: string | number;
  type?: 'text'|'link'|'badge'|'date'|'currency';     // default: 'text'
  editable?: boolean;                                   // per-field edit override
  group?: string;                                       // section grouping
  icon?: string;                                        // icon prefix
  href?: string;                                        // for type='link'
  badgeVariant?: 'default'|'primary'|'success'|'warning'|'danger';
}
```

## Methods

- `getValues()` → `Record<string, string|number>` - Get all field values as label:value map
- `setValues(data)` - Update field values by label

## Events

- `field-change` → `{ field, value, previousValue }` - Field value changed
- `field-save` → `{ field, value }` - Field value saved

## Slots

- `header` - Custom header content
- `title` - Title text within default header

## CSS Parts

- `container`, `header`, `title`, `edit-toggle`
- `group`, `group-title`
- `field`, `field-icon`, `field-label`, `field-value`, `field-input`, `field-save`, `field-edit`

## Basic Usage

```html
<snice-data-card variant="default"></snice-data-card>
```

```typescript
card.fields = [
  { label: 'Name', value: 'John Doe', group: 'Personal' },
  { label: 'Email', value: 'john@example.com', type: 'link', href: 'mailto:john@example.com', group: 'Personal' },
  { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success', group: 'Account' },
  { label: 'Balance', value: '$1,250.00', type: 'currency', group: 'Account' }
];
```

## Accessibility

- Enter to save, Escape to cancel in edit mode
- Edit toggle hidden when no fields are editable
- Links use `rel="noopener"` and `target="_blank"`
