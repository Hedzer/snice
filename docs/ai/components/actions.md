# snice-actions

Action button group with overflow menu.

## Properties

```typescript
actions: ActionButton[] = [];
size: 'small'|'medium'|'large' = 'medium';
variant: 'text'|'outlined'|'filled' = 'text';
showLabels: boolean = true;
maxVisible: number = 3;
moreLabel: string = 'More';
moreIcon: string = '⋯';
```

## ActionButton Interface

```typescript
interface ActionButton {
  id: string;
  label?: string;
  icon?: string;
  iconImage?: string;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
  action?: () => void | Promise<void>;
  href?: string;
  target?: string;
  data?: any;
}
```

## Methods

```typescript
triggerAction(id: string): void
getAction(id: string): ActionButton | undefined
```

## Events

- `@snice/action-trigger` - Dispatched when action triggered (detail: { action, actionsElement })

## Usage

```javascript
actions.actions = [
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑️', danger: true }
];
```

```html
<!-- Icon only -->
<snice-actions show-labels="false"></snice-actions>

<!-- With overflow (max 3 visible) -->
<snice-actions max-visible="3"></snice-actions>

<!-- Outlined variant -->
<snice-actions variant="outlined"></snice-actions>

<!-- Small size -->
<snice-actions size="small"></snice-actions>
```

## Features

- Multiple button variants (text/outlined/filled)
- Icon-only mode
- Overflow menu for many actions
- Danger styling for destructive actions
- Link support (href/target)
- Async action callbacks
- Per-action variant override
- Disabled state
- Custom tooltips
- Programmatic triggering
