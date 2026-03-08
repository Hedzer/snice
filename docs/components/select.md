<!-- AI: For a low-token version of this doc, use docs/ai/components/select.md instead -->

# Select
`<snice-select>`

A customizable dropdown selection with single/multiple selection, search filtering, and composable options.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/select/snice-select';
import 'snice/components/select/snice-option';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-select.min.js"></script>
```

## Select Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected value (comma-separated for multiple) |
| `disabled` | `boolean` | `false` | Disables the select |
| `required` | `boolean` | `false` | Required for form validation |
| `invalid` | `boolean` | `false` | Shows invalid state styling |
| `readonly` | `boolean` | `false` | Readonly state |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `searchable` | `boolean` | `false` | Show search input |
| `clearable` | `boolean` | `false` | Show clear button |
| `editable` | `boolean` | `false` | Render editable text input instead of button trigger |
| `allowFreeText` (attr: `allow-free-text`) | `boolean` | `false` | Allow values not in the options list |
| `remote` | `boolean` | `false` | Enable remote async search via `@request('select/search')` |
| `searchDebounce` (attr: `search-debounce`) | `number` | `300` | Debounce delay in ms for remote search |
| `open` | `boolean` | `false` | Whether dropdown is open |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Select size |
| `name` | `string` | `''` | Form field name |
| `label` | `string` | `''` | Label text |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `maxHeight` (attr: `max-height`) | `string` | `'200px'` | Maximum dropdown height |
| `options` | `SelectOption[]` | `[]` | Programmatic options array |

## Option Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Option value (falls back to label) |
| `label` | `string` | `''` | Option label (falls back to text content) |
| `disabled` | `boolean` | `false` | Disables the option |
| `selected` | `boolean` | `false` | Initially selected |
| `icon` | `string` | `''` | Icon image URL |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `selectOption()` | `value: string` | Select an option by value |
| `clear()` | -- | Clear the selection |
| `openDropdown()` | -- | Open the dropdown |
| `closeDropdown()` | -- | Close the dropdown |
| `toggleDropdown()` | -- | Toggle the dropdown |
| `focus()` | -- | Focus the select trigger |
| `blur()` | -- | Remove focus and close dropdown |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `select-change` | `{ value, option, select }` | Selection changed |
| `select-open` | `{ select }` | Dropdown opened |
| `select-close` | `{ select }` | Dropdown closed |

## Basic Usage

```typescript
import 'snice/components/select/snice-select';
import 'snice/components/select/snice-option';
```

```html
<snice-select label="Choose a color" name="color">
  <snice-option value="red">Red</snice-option>
  <snice-option value="blue">Blue</snice-option>
  <snice-option value="green">Green</snice-option>
</snice-select>
```

## Examples

### Sizes

Use the `size` attribute to change the select size.

```html
<snice-select size="small" label="Small">
  <snice-option value="a">Option A</snice-option>
  <snice-option value="b">Option B</snice-option>
</snice-select>

<snice-select size="large" label="Large">
  <snice-option value="a">Option A</snice-option>
  <snice-option value="b">Option B</snice-option>
</snice-select>
```

### Multiple Selection

Set the `multiple` attribute to allow selecting more than one option.

```html
<snice-select label="Select languages" multiple>
  <snice-option value="js">JavaScript</snice-option>
  <snice-option value="ts">TypeScript</snice-option>
  <snice-option value="py">Python</snice-option>
  <snice-option value="rs">Rust</snice-option>
</snice-select>
```

### Searchable

Set the `searchable` attribute to show a search input for filtering options.

```html
<snice-select label="Choose a country" searchable>
  <snice-option value="us">United States</snice-option>
  <snice-option value="uk">United Kingdom</snice-option>
  <snice-option value="ca">Canada</snice-option>
  <snice-option value="au">Australia</snice-option>
  <snice-option value="de">Germany</snice-option>
</snice-select>
```

### Clearable

Set the `clearable` attribute to show a clear button.

```html
<snice-select label="Clearable select" clearable>
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>
```

### Disabled Options

```html
<snice-select label="With disabled option">
  <snice-option value="active">Active</snice-option>
  <snice-option value="unavailable" disabled>Unavailable</snice-option>
  <snice-option value="other">Other</snice-option>
</snice-select>
```

### With Icons

Use the `icon` attribute on options to display an image.

```html
<snice-select label="Select role">
  <snice-option value="user" icon="/icons/user.svg">User</snice-option>
  <snice-option value="admin" icon="/icons/admin.svg">Admin</snice-option>
</snice-select>
```

### Form Integration

```html
<form>
  <snice-select name="role" label="User role" required>
    <snice-option value="user">User</snice-option>
    <snice-option value="admin">Admin</snice-option>
    <snice-option value="moderator">Moderator</snice-option>
  </snice-select>
  <button type="submit">Submit</button>
</form>
```

```typescript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log(Object.fromEntries(new FormData(e.target)));
});
```

### Programmatic Control

```typescript
select.selectOption('apple');
select.clear();
select.openDropdown();
select.closeDropdown();
select.toggleDropdown();
```

### Event Handling

```typescript
select.addEventListener('select-change', (e) => {
  console.log('Selected:', e.detail.value);
});

select.addEventListener('select-open', () => console.log('Opened'));
select.addEventListener('select-close', () => console.log('Closed'));
```

### Validation

```html
<snice-select name="category" label="Category" required>
  <snice-option value="tech">Technology</snice-option>
  <snice-option value="health">Health</snice-option>
</snice-select>
```

```typescript
function validate() {
  select.invalid = !select.value;
  return !!select.value;
}
```

### Editable Mode

Set the `editable` attribute to render a text input instead of a button. Users can type to filter or enter custom values (with `allow-free-text`). This replaces the need for a separate combobox component.

```html
<snice-select editable label="Choose a fruit" placeholder="Type or select..."></snice-select>
```

```typescript
select.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];
```

#### Allow Custom Values

Set `allow-free-text` alongside `editable` to let users enter values not in the options list.

```html
<snice-select editable allow-free-text label="Tag" placeholder="Type a tag..."></snice-select>
```

#### Programmatic Options

Use the `options` property to set options via JavaScript. Works alongside child `<snice-option>` elements (merged at render time, children take precedence).

```typescript
select.options = [
  { value: 'us', label: 'United States', icon: '/flags/us.png' },
  { value: 'uk', label: 'United Kingdom', icon: '/flags/uk.png' },
];
```
