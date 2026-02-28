# snice-split-button

Primary action button with dropdown menu of alternative actions.

## Properties

```typescript
label: string = '';
actions: SplitButtonAction[] = [];  // { label, value, icon?, disabled? }
variant: 'default'|'primary'|'success'|'danger' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
```

## Events

- `primary-click` -> `{ button }`
- `action-click` -> `{ value, action, button }`

## Usage

```html
<snice-split-button label="Save" variant="primary"></snice-split-button>
```

```typescript
const btn = document.querySelector('snice-split-button');
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
