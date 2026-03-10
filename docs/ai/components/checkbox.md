# snice-checkbox

Form checkbox with indeterminate and loading states.

## Properties

```typescript
checked: boolean = false;
indeterminate: boolean = false;
disabled: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';
```

## Methods

- `focus()` - Focus checkbox
- `blur()` - Remove focus
- `click()` - Programmatic click
- `toggle()` - Toggle checked state
- `setIndeterminate()` - Set indeterminate state

## Events

- `checkbox-change` -> `{ checked: boolean, indeterminate: boolean, checkbox: SniceCheckboxElement }`

## CSS Parts

- `input` - Hidden checkbox input
- `checkbox` - Custom checkbox element
- `spinner` - Loading spinner
- `label` - Label text

## Basic Usage

```html
<snice-checkbox label="Accept terms"></snice-checkbox>
```

```typescript
import 'snice/components/checkbox/snice-checkbox';

checkbox.addEventListener('checkbox-change', (e) => {
  console.log('Checked:', e.detail.checked);
});
```

## Keyboard Navigation

- Space: toggle
- Tab: navigate

## Accessibility

- aria-checked (including "mixed" for indeterminate)
- aria-invalid for validation
- Screen reader label association
- Focus indicators
