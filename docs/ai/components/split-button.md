# snice-split-button

Primary action button with dropdown menu of alternative actions.

## Properties

```typescript
label: string = '';
actions: SplitButtonAction[] = [];  // { label, value, icon?, disabled? }
variant: 'default'|'primary'|'success'|'warning'|'danger' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
loading: boolean = false;
outline: boolean = false;
pill: boolean = false;
icon: string = '';                  // Icon (URL, image file, emoji)
iconPlacement: 'start'|'end' = 'start';
```

## CSS Parts

- `base` - Root container
- `primary` - Primary action button
- `divider` - Divider between buttons
- `toggle` - Dropdown toggle button
- `menu` - Dropdown menu container
- `menu-items` - Menu items wrapper
- `action` - Individual action button

## Events

- `primary-click` → `{ button }`
- `action-click` → `{ value, action, button }`

## Usage

```html
<snice-split-button label="Save" variant="primary"></snice-split-button>
```

```typescript
btn.actions = [
  { value: 'save-draft', label: 'Save as Draft' },
  { value: 'save-template', label: 'Save as Template' },
  { value: 'discard', label: 'Discard', disabled: true },
];

btn.addEventListener('primary-click', () => console.log('Save clicked'));
btn.addEventListener('action-click', (e) => console.log(e.detail.value));
```

## Notes

- Main button triggers `primary-click`
- Chevron dropdown triggers menu of alternative actions
- Menu closes after action click or outside click
- Escape key closes menu
- Actions set via JS property (array), not child elements
