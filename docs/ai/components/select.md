# snice-select

Customizable dropdown selection with single/multiple, search, editable input, and icons.

## Components

- `snice-select` - Container with trigger, dropdown, form integration
- `snice-option` - Declarative option elements

## Properties

### snice-select

```typescript
value: string = '';                 // Comma-separated for multiple
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
loading: boolean = false;
multiple: boolean = false;
searchable: boolean = false;
clearable: boolean = false;
editable: boolean = false;          // Text input trigger instead of button
allowFreeText: boolean = false;     // attr: allow-free-text
remote: boolean = false;            // Remote search via @request('select/search')
searchDebounce: number = 300;       // attr: search-debounce
open: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
label: string = '';
placeholder: string = 'Select an option';
maxHeight: string = '200px';        // attr: max-height
options: SelectOption[] = [];       // JS only, works alongside <snice-option> children
```

### snice-option

```typescript
value: string = '';       // Falls back to label
label: string = '';       // Falls back to textContent
disabled: boolean = false;
selected: boolean = false;
icon: string = '';        // Icon URL
```

## Methods

- `focus()` / `blur()` - Focus/blur trigger
- `clear()` - Clear selection
- `openDropdown()` / `closeDropdown()` / `toggleDropdown()` - Dropdown control
- `selectOption(value)` - Select by value

## Events

- `select-change` → `{ value: string | string[], option?, select }`
- `select-open` → `{ select }`
- `select-close` → `{ select }`

## CSS Parts

- `label`, `trigger`, `value`, `input`, `arrow`, `spinner`
- `dropdown`, `search`, `search-input`, `options`, `option`

## Basic Usage

```html
<!-- Declarative options -->
<snice-select label="Choose" name="choice">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>

<!-- Editable input mode -->
<snice-select editable label="Fruit" placeholder="Type or select..."></snice-select>
```

```typescript
select.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', icon: '/icons/banana.svg' }
];
select.addEventListener('select-change', (e) => console.log(e.detail.value));
```

## Editable Mode

- `editable` renders text input instead of button
- Typing filters options; blur commits value
- `allow-free-text` accepts values not in options list
- `remote` + `editable` enables async search via @request/@respond

## Accessibility

- Hidden native `<select>` for form submission
- Arrow keys, Enter, Escape for keyboard navigation
- Dropdown closes on outside click
- Children take precedence over `options` array
