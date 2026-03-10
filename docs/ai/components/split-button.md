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
icon: string = '';                  // URL, image file, or emoji
iconPlacement: 'start'|'end' = 'start';  // attr: icon-placement
```

## Events

- `primary-click` → `{ button }`
- `action-click` → `{ value, action, button }`

## CSS Parts

- `base` - Root container
- `primary` - Primary action button
- `divider` - Divider between buttons
- `toggle` - Dropdown toggle button
- `menu` - Dropdown menu container
- `menu-items` - Menu items wrapper
- `action` - Individual action button

## Basic Usage

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

## Accessibility

- Menu closes on action click, outside click, or Escape key
- Actions set via JS property (array), not child elements
