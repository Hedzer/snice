# Actions Component

Display a collection of action buttons with overflow menu support.

## Basic Usage

```javascript
const actions = document.querySelector('snice-actions');
actions.actions = [
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
];
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `actions` | `ActionButton[]` | `[]` | Array of action buttons |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `variant` | `'text' \| 'outlined' \| 'filled'` | `'text'` | Button variant |
| `showLabels` | `boolean` | `true` | Show button labels |
| `maxVisible` | `number` | `3` | Max visible buttons (0 = all) |
| `moreLabel` | `string` | `'More'` | Label for overflow menu |
| `moreIcon` | `string` | `'⋯'` | Icon for overflow menu |

## Action Button Interface

```typescript
interface ActionButton {
  id: string;                    // Unique identifier
  label?: string;                // Button label
  icon?: string;                 // Text/emoji icon
  iconImage?: string;            // Icon image URL
  variant?: ActionButtonVariant; // Override variant
  disabled?: boolean;            // Disable button
  danger?: boolean;              // Danger styling
  tooltip?: string;              // Tooltip text
  action?: () => void | Promise<void>; // Click handler
  href?: string;                 // Link URL
  target?: string;               // Link target
  data?: any;                    // Custom data
}
```

## Methods

### `triggerAction(id: string): void`
Programmatically trigger an action by ID.

```javascript
actions.triggerAction('edit');
```

### `getAction(id: string): ActionButton | undefined`
Get action configuration by ID.

```javascript
const action = actions.getAction('edit');
console.log(action.label); // "Edit"
```

## Events

### `@snice/action-trigger`
Dispatched when an action is triggered.

```javascript
actions.addEventListener('@snice/action-trigger', (e) => {
  console.log('Action:', e.detail.action);
});
```

**Detail:** `{ action: ActionButton, actionsElement: SniceActionsElement }`

## Examples

### Basic Actions

```javascript
actions.actions = [
  { id: 'view', label: 'View', icon: '👁️' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
];
```

### Icon Only

```html
<snice-actions show-labels="false"></snice-actions>
```

```javascript
actions.actions = [
  { id: 'like', icon: '👍', tooltip: 'Like' },
  { id: 'share', icon: '📤', tooltip: 'Share' },
  { id: 'bookmark', icon: '🔖', tooltip: 'Bookmark' }
];
```

### Different Variants

```html
<!-- Outlined -->
<snice-actions variant="outlined"></snice-actions>

<!-- Filled -->
<snice-actions variant="filled"></snice-actions>
```

### Different Sizes

```html
<snice-actions size="small"></snice-actions>
<snice-actions size="medium"></snice-actions>
<snice-actions size="large"></snice-actions>
```

### With Overflow Menu

```html
<snice-actions max-visible="3"></snice-actions>
```

```javascript
// 6 actions, only 3 visible, rest in overflow menu
actions.actions = [
  { id: 'view', label: 'View', icon: '👁️' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'download', label: 'Download', icon: '⬇️' },
  { id: 'share', label: 'Share', icon: '📤' },
  { id: 'archive', label: 'Archive', icon: '📦' },
  { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
];
```

### With Action Callbacks

```javascript
actions.actions = [
  {
    id: 'save',
    label: 'Save',
    icon: '💾',
    action: async () => {
      await saveData();
      console.log('Saved!');
    }
  },
  {
    id: 'cancel',
    label: 'Cancel',
    action: () => {
      window.history.back();
    }
  }
];
```

### With Links

```javascript
actions.actions = [
  {
    id: 'view',
    label: 'View',
    icon: '👁️',
    href: '/details/123'
  },
  {
    id: 'external',
    label: 'Open',
    icon: '🔗',
    href: 'https://example.com',
    target: '_blank'
  }
];
```

### Disabled Actions

```javascript
actions.actions = [
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑️', disabled: true }
];
```

### Danger Actions

```javascript
actions.actions = [
  { id: 'approve', label: 'Approve', icon: '✓' },
  { id: 'reject', label: 'Reject', icon: '✗', danger: true }
];
```

### Custom Icons

```javascript
actions.actions = [
  {
    id: 'settings',
    label: 'Settings',
    iconImage: '/icons/settings.svg'
  }
];
```

### In Table Cells

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
      <td>
        <snice-actions id="row1" show-labels="false" size="small"></snice-actions>
      </td>
    </tr>
  </tbody>
</table>
```

```javascript
document.getElementById('row1').actions = [
  { id: 'view', icon: '👁️', tooltip: 'View' },
  { id: 'edit', icon: '✏️', tooltip: 'Edit' },
  { id: 'delete', icon: '🗑️', tooltip: 'Delete', danger: true }
];
```

### Per-Action Variant Override

```javascript
actions.actions = [
  { id: 'save', label: 'Save', icon: '💾', variant: 'filled' },
  { id: 'cancel', label: 'Cancel', variant: 'outlined' },
  { id: 'reset', label: 'Reset', variant: 'text' }
];
```

### With Tooltips

```javascript
actions.actions = [
  { id: 'edit', icon: '✏️', tooltip: 'Edit item' },
  { id: 'delete', icon: '🗑️', tooltip: 'Permanently delete this item', danger: true }
];
```

### Custom More Button

```html
<snice-actions more-label="Options" more-icon="▼"></snice-actions>
```

### Programmatic Triggering

```javascript
const actions = document.querySelector('snice-actions');

actions.actions = [
  {
    id: 'refresh',
    label: 'Refresh',
    action: () => location.reload()
  }
];

// Trigger programmatically
setTimeout(() => {
  actions.triggerAction('refresh');
}, 5000);
```

### Event Handling

```javascript
const actions = document.querySelector('snice-actions');

actions.addEventListener('@snice/action-trigger', (e) => {
  const { action } = e.detail;

  console.log('Action triggered:', action.id);

  // Custom handling
  if (action.id === 'delete') {
    if (confirm('Are you sure?')) {
      deleteItem();
    }
  }
});
```

## Accessibility

- Buttons include `title` attributes for tooltips
- Disabled buttons are properly marked with `disabled` attribute
- Keyboard accessible (Tab, Enter, Space)
- Screen readers announce button labels and states
- Danger actions use semantic color coding

## Browser Support

- Modern browsers with Custom Elements v1 support
- Dropdown menu uses absolute positioning
- Click-outside handling for dropdown
