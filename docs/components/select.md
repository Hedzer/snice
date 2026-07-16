<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/select.md -->

# Select

A customizable dropdown selection with single/multiple selection, search filtering, editable input mode, and composable options.

## Table of Contents

- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [External Labels and Accessible Naming](#external-labels-and-accessible-naming)
- [Form Integration](#form-integration)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Components

- `<snice-select>` - The select container with trigger, dropdown, and form integration
- `<snice-option>` - Individual option elements (declarative API)

## Properties

### Select Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected value (comma-separated for multiple) |
| `disabled` | `boolean` | `false` | Disables the select |
| `required` | `boolean` | `false` | Required for form validation |
| `invalid` | `boolean` | `false` | Shows invalid state styling |
| `readonly` | `boolean` | `false` | Readonly state |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `searchable` | `boolean` | `false` | Show search input in dropdown |
| `clearable` | `boolean` | `false` | Show clear button |
| `editable` | `boolean` | `false` | Render editable text input instead of button trigger |
| `allowFreeText` (attr: `allow-free-text`) | `boolean` | `false` | Allow values not in the options list |
| `remote` | `boolean` | `false` | Enable remote async search via `@request('select/search')` |
| `searchDebounce` (attr: `search-debounce`) | `number` | `300` | Debounce delay in ms for remote search |
| `open` | `boolean` | `false` | Whether dropdown is open |
| `isOpen` | `boolean` (read-only) | `false` | Read-only alias for the current open state |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Select size |
| `name` | `string` | `''` | Form field name |
| `label` | `string` | `''` | Visible internal label and accessible-name fallback |
| `helperText` (attr: `helper-text`) | `string` | `''` | Description announced by the focused trigger when no error is present |
| `errorText` (attr: `error-text`) | `string` | `''` | Error description; takes precedence over helper text |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `maxHeight` (attr: `max-height`) | `string` | `'200px'` | Maximum dropdown height |
| `options` | `SelectOption[]` | `[]` | Programmatic options array (JS only) |
| `labels` | `NodeList \| null` (read-only) | — | Current wrapping and explicit external labels associated with the host |

### Option Properties

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
| `focus()` | — | Focus the select trigger |
| `blur()` | — | Remove focus and close dropdown |
| `clear()` | — | Clear the selection |
| `openDropdown()` | — | Open the dropdown |
| `closeDropdown()` | — | Close the dropdown |
| `toggleDropdown()` | — | Toggle the dropdown |
| `selectOption()` | `value: string` | Select an option by value |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `select-change` | `{ value: string \| string[], option?: SelectOption, select }` | Selection changed |
| `select-open` | `{ select }` | Dropdown opened |
| `select-close` | `{ select }` | Dropdown closed |

## CSS Parts

| Part | Description |
|------|-------------|
| `label` | The label text |
| `trigger` | The trigger button or input container |
| `value` | The displayed value text |
| `input` | The editable-mode text input |
| `arrow` | The dropdown arrow icon |
| `spinner` | The loading spinner |
| `dropdown` | The dropdown container |
| `search` | The search wrapper |
| `search-input` | The search text input |
| `options` | The options list container |
| `option` | Individual option items |
| `helper-text` | Helper description below the control |
| `error-text` | Error description below the control |

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

### Multiple Selection

Set `multiple` to allow selecting more than one option.

```html
<snice-select label="Languages" multiple>
  <snice-option value="js">JavaScript</snice-option>
  <snice-option value="ts">TypeScript</snice-option>
  <snice-option value="py">Python</snice-option>
</snice-select>
```

### Searchable

Set `searchable` to show a search input for filtering options.

```html
<snice-select label="Country" searchable>
  <snice-option value="us">United States</snice-option>
  <snice-option value="uk">United Kingdom</snice-option>
  <snice-option value="ca">Canada</snice-option>
</snice-select>
```

### Editable Mode

Set `editable` to render a text input instead of a button. Typing filters options.

```html
<snice-select editable label="Fruit" placeholder="Type or select..."></snice-select>
```

```typescript
select.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' }
];
```

### Allow Free Text

Set `allow-free-text` with `editable` to accept values not in the options list.

```html
<snice-select editable allow-free-text label="Tag" placeholder="Type a tag..."></snice-select>
```

### Remote Search

Set `remote` with `searchable` or `editable` for async search via `@request/@respond`.

```typescript
// Controller
@respond('select/search')
async handleSearch(req, respond) {
  const results = await fetch(`/api/users?q=${req.query}`).then(r => r.json());
  respond(results.map(u => ({ value: u.id, label: u.name })));
}
```

### Clearable

Set `clearable` to show a clear button.

```html
<snice-select label="Clearable" clearable>
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>
```

### With Icons

Use the `icon` attribute on options to display images.

```html
<snice-select label="Role">
  <snice-option value="user" icon="/icons/user.svg">User</snice-option>
  <snice-option value="admin" icon="/icons/admin.svg">Admin</snice-option>
</snice-select>
```

### Event Handling

Listen to `select-change` for selection changes.

```typescript
select.addEventListener('select-change', (e) => {
  console.log('Selected:', e.detail.value);
});
```

## External Labels and Accessible Naming

`snice-select` is a form-associated custom element, so both native label forms are supported. An explicit label uses the host's `id`, while a wrapping label contains the host.

```html
<label for="shipping-country">Shipping country</label>
<snice-select
  id="shipping-country"
  name="country"
  helper-text="Used to calculate delivery options"
>
  <snice-option value="ca">Canada</snice-option>
  <snice-option value="us">United States</snice-option>
</snice-select>

<label>
  Billing country
  <snice-select id="billing-country" name="billing-country" editable>
    <snice-option value="ca">Canada</snice-option>
    <snice-option value="us">United States</snice-option>
  </snice-select>
</label>
```

The accessible-name order is deliberate:

1. All currently associated external labels are combined in document order.
2. If there is no external label, the `label` property names the control.
3. If neither exists, the fallback name is `Select`.

Option text inside a wrapping label is excluded from the name. Hidden and `aria-hidden="true"` label decorations are also excluded. Label text, `aria-label`, `aria-labelledby`, `for`, host `id`, DOM position, and standard/editable mode can change dynamically; the focused shadow control is kept synchronized.

Clicking an external or internal label focuses the actual control. Standard mode focuses its button without opening the list. Editable mode focuses its text input and retains the existing focus-to-open combobox behavior. A disabled target cannot receive label focus.

Multiple external labels produce one combined name, not multiple descriptions. `helper-text` and `error-text` share one description target: an error replaces the helper text and `aria-invalid` reflects `invalid`, preventing duplicate announcements. The read-only `labels` getter exposes the current associated label elements.

## Form Integration

The host participates directly through `ElementInternals`; there is no hidden native `<select>`. With a `name`, its current value is contributed to `FormData`.

```html
<form>
  <label for="user-role">User role</label>
  <snice-select id="user-role" name="role" required>
    <snice-option value="user">User</snice-option>
    <snice-option value="admin">Admin</snice-option>
  </snice-select>
  <button type="submit">Submit</button>
</form>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowDown` | Move to next option / open dropdown |
| `ArrowUp` | Move to previous option |
| `Enter` | Select focused option / open dropdown |
| `Escape` | Close dropdown |
| `Tab` | Close dropdown and move focus |

## Accessibility

- Native explicit and wrapping label association through the form-associated host
- External labels name and focus the real button or editable input inside the shadow root
- Multiple and dynamic labels remain synchronized without duplicating helper/error descriptions
- Direct `ElementInternals` form submission; no hidden native select
- Keyboard navigable with arrow keys, Enter, and Escape
- Dropdown closes on outside click
- Multiple selection values are comma-separated
- Child `<snice-option>` elements take precedence over `options` array when both provided
