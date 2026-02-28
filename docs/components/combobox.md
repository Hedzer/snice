[//]: # (AI: For a low-token version of this doc, use docs/ai/components/combobox.md instead)

# Combobox
`<snice-combobox>`

An editable input with a dropdown list that supports autocomplete filtering and optional custom values. Unlike `<snice-select>`, the combobox allows users to type to filter or create new values.

## Basic Usage

```typescript
import 'snice/components/combobox/snice-combobox';
```

```html
<snice-combobox label="Choose a fruit" placeholder="Type or select..."></snice-combobox>
```

```typescript
const combobox = document.querySelector('snice-combobox');
combobox.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/combobox/snice-combobox';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-combobox.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to change the combobox size.

```html
<snice-combobox size="small" label="Small"></snice-combobox>
<snice-combobox size="medium" label="Medium"></snice-combobox>
<snice-combobox size="large" label="Large"></snice-combobox>
```

### Allow Custom Values

Set the `allow-custom` attribute to allow users to enter values not present in the options list.

```html
<snice-combobox label="Tag" placeholder="Type a tag..." allow-custom></snice-combobox>
```

### With Icons

Pass an `icon` URL in option objects to display icons alongside labels.

```typescript
combobox.options = [
  { value: 'us', label: 'United States', icon: '/flags/us.png' },
  { value: 'uk', label: 'United Kingdom', icon: '/flags/uk.png' },
];
```

### Disabled Options

Options with `disabled: true` cannot be selected.

```typescript
combobox.options = [
  { value: 'active', label: 'Active' },
  { value: 'locked', label: 'Locked', disabled: true },
];
```

### States

```html
<snice-combobox label="Disabled" disabled></snice-combobox>
<snice-combobox label="Readonly" readonly></snice-combobox>
<snice-combobox label="Required" required></snice-combobox>
```

### Outlined Variant

Use the `variant` attribute for visual style.

```html
<snice-combobox variant="outlined" label="Outlined"></snice-combobox>
```

### Programmatic Control

```typescript
const combobox = document.querySelector('snice-combobox');
combobox.open();
combobox.close();
combobox.focus();
combobox.blur();
combobox.value = 'apple';
```

### Event Handling

```typescript
const combobox = document.querySelector('snice-combobox');

combobox.addEventListener('value-change', (e) => {
  console.log('Value:', e.detail.value, 'Option:', e.detail.option);
});

combobox.addEventListener('input-change', (e) => {
  console.log('Input text:', e.detail.inputValue);
});

combobox.addEventListener('option-select', (e) => {
  console.log('Selected option:', e.detail.option);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected value |
| `options` | `ComboboxOption[]` | `[]` | Array of `{ value, label, icon?, disabled? }` |
| `placeholder` | `string` | `''` | Placeholder text |
| `allowCustom` (attr: `allow-custom`) | `boolean` | `false` | Allow values not in options |
| `filterable` | `boolean` | `true` | Filter options as user types |
| `disabled` | `boolean` | `false` | Disables the combobox |
| `readonly` | `boolean` | `false` | Readonly state |
| `required` | `boolean` | `false` | Required for form validation |
| `variant` | `'default' \| 'outlined'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Combobox size |
| `name` | `string` | `''` | Form field name |
| `label` | `string` | `''` | Label text |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `value-change` | `{ value, option?, combobox }` | Value changed (option selection or custom input) |
| `input-change` | `{ inputValue, combobox }` | Text input changed (fired on every keystroke) |
| `option-select` | `{ value, option, combobox }` | An option from the list was selected |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `open()` | -- | Open dropdown and focus input |
| `close()` | -- | Close dropdown |
| `focus()` | -- | Focus the input |
| `blur()` | -- | Remove focus and close dropdown |
