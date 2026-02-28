# snice-combobox

Editable input with dropdown list, autocomplete filtering, and optional custom values.

## Properties

```typescript
value: string = '';
options: ComboboxOption[] = [];   // { value, label, icon?, disabled? }
placeholder: string = '';
allowCustom: boolean = false;     // attr: allow-custom — allow values not in options
filterable: boolean = true;       // filter options as user types
disabled: boolean = false;
readonly: boolean = false;
required: boolean = false;
variant: 'default'|'outlined' = 'default';
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
label: string = '';
```

## Events

- `value-change` -> `{ value, option?, combobox }`
- `input-change` -> `{ inputValue, combobox }`
- `option-select` -> `{ value, option, combobox }`

## Methods

- `open()` - Open dropdown and focus input
- `close()` - Close dropdown
- `focus()` - Focus input
- `blur()` - Blur and close

## Usage

```html
<snice-combobox
  label="Choose fruit"
  placeholder="Type or select..."
  allow-custom>
</snice-combobox>
```

```typescript
const cb = document.querySelector('snice-combobox');
cb.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', icon: '/icons/banana.svg' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];
cb.addEventListener('value-change', (e) => console.log(e.detail.value));
```

## Notes

- Options set via JS property (array), not child elements
- Filterable by default (type to filter)
- `allow-custom` lets user enter arbitrary values
- Without `allow-custom`, input reverts to last valid selection on blur
- Form-associated element (works with `<form>`)
