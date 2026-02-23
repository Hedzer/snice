[//]: # (AI: For a low-token version of this doc, use docs/ai/components/input.md instead)

# Input
`<snice-input>`

Text input field with validation, icons, and form association.

## Basic Usage

```typescript
import 'snice/components/input/snice-input';
```

```html
<snice-input label="Name" placeholder="Enter your name"></snice-input>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/input/snice-input';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-input.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the input style.

```html
<snice-input variant="outlined" label="Outlined"></snice-input>
<snice-input variant="filled" label="Filled"></snice-input>
<snice-input variant="underlined" label="Underlined"></snice-input>
```

### Sizes

Use the `size` attribute to change the input size.

```html
<snice-input size="small" placeholder="Small"></snice-input>
<snice-input size="medium" placeholder="Medium"></snice-input>
<snice-input size="large" placeholder="Large"></snice-input>
```

### Input Types

Use the `type` attribute to set the input type.

```html
<snice-input type="text" label="Text"></snice-input>
<snice-input type="email" label="Email"></snice-input>
<snice-input type="number" label="Age" min="0" max="120"></snice-input>
<snice-input type="tel" label="Phone"></snice-input>
<snice-input type="url" label="Website"></snice-input>
<snice-input type="search" label="Search"></snice-input>
```

### Password Toggle

Set the `password` attribute along with `type="password"` to show a visibility toggle button.

```html
<snice-input type="password" password label="Password"></snice-input>
```

### Icons

Use the `prefix-icon` and `suffix-icon` attributes to add icons. Supports emoji, URLs, image files, and Material Symbols ligatures.

```html
<snice-input prefix-icon="🔍" placeholder="Search"></snice-input>
<snice-input suffix-icon="✉️" type="email" label="Email"></snice-input>
<snice-input prefix-icon="/icons/search.svg" placeholder="Search"></snice-input>
<snice-input prefix-icon="search" placeholder="Search"></snice-input>
```

### Icon Slots

Use the `prefix-icon` and `suffix-icon` slots for custom icon content like external icon fonts.

```html
<snice-input placeholder="Search">
  <span slot="prefix-icon" class="material-symbols-outlined">search</span>
</snice-input>
<snice-input placeholder="Email">
  <span slot="suffix-icon" class="material-symbols-outlined">mail</span>
</snice-input>
```

### Clearable

Set the `clearable` attribute to show a clear button when the input has a value.

```html
<snice-input value="Hello" clearable label="Clearable"></snice-input>
```

### Helper and Error Text

Use `helper-text` and `error-text` to display guidance or validation messages.

```html
<snice-input label="Username" helper-text="Must be unique"></snice-input>
<snice-input label="Email" invalid error-text="Invalid email address"></snice-input>
```

### Loading

Set the `loading` attribute to show a spinner and disable the input.

```html
<snice-input loading label="Validating" value="user@example.com"></snice-input>
```

### Disabled and Readonly

```html
<snice-input disabled value="Cannot edit" label="Disabled"></snice-input>
<snice-input readonly value="Read only" label="Readonly"></snice-input>
```

### Validation

Use `required`, `pattern`, `minlength`, and `maxlength` for built-in validation.

```html
<snice-input type="email" required label="Email"></snice-input>
<snice-input pattern="[A-Za-z]+" label="Letters only"></snice-input>
<snice-input minlength="3" maxlength="20" label="Username"></snice-input>
```

### Number Input

Use `min`, `max`, and `step` for number inputs.

```html
<snice-input type="number" min="0" max="100" step="5" label="Quantity"></snice-input>
```

### Form Integration

Use `name` and `required` for native form participation.

```html
<form>
  <snice-input name="username" required label="Username"></snice-input>
  <snice-input name="email" type="email" required label="Email"></snice-input>
</form>
```

### Event Handling

Listen for input events using `input-input` and `input-change`.

```html
<snice-input id="inp" label="Type something"></snice-input>
<script>
const inp = document.querySelector('#inp');
inp.addEventListener('input-input', (e) => console.log('Input:', e.detail.value));
inp.addEventListener('input-change', (e) => console.log('Change:', e.detail.value));
</script>
```

## Slots

| Name | Description |
|------|-------------|
| `prefix-icon` | Custom prefix icon content (overrides `prefixIcon` property) |
| `suffix-icon` | Custom suffix icon content (overrides `suffixIcon` property) |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `type` | `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search' \| 'date' \| 'time' \| 'datetime-local'` | `'text'` | Input type |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Visual style |
| `value` | `value` | `string` | `''` | Input value |
| `placeholder` | `placeholder` | `string` | `''` | Placeholder text |
| `label` | `label` | `string` | `''` | Label text |
| `helperText` | `helper-text` | `string` | `''` | Helper text below input |
| `errorText` | `error-text` | `string` | `''` | Error text below input |
| `disabled` | `disabled` | `boolean` | `false` | Disables the input |
| `readonly` | `readonly` | `boolean` | `false` | Makes the input read-only |
| `loading` | `loading` | `boolean` | `false` | Shows loading spinner |
| `required` | `required` | `boolean` | `false` | Marks as required |
| `invalid` | `invalid` | `boolean` | `false` | Shows invalid styling |
| `clearable` | `clearable` | `boolean` | `false` | Shows clear button |
| `password` | `password` | `boolean` | `false` | Shows password visibility toggle |
| `min` | `min` | `string` | `''` | Minimum value (number inputs) |
| `max` | `max` | `string` | `''` | Maximum value (number inputs) |
| `step` | `step` | `string` | `''` | Step value (number inputs) |
| `pattern` | `pattern` | `string` | `''` | Validation pattern |
| `maxlength` | `maxlength` | `number` | `-1` | Maximum character length |
| `minlength` | `minlength` | `number` | `-1` | Minimum character length |
| `autocomplete` | `autocomplete` | `string` | `''` | Autocomplete hint |
| `name` | `name` | `string` | `''` | Form field name |
| `prefixIcon` | `prefix-icon` | `string` | `''` | Prefix icon (emoji, URL, or ligature) |
| `suffixIcon` | `suffix-icon` | `string` | `''` | Suffix icon (emoji, URL, or ligature) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `input-input` | `{ value, input }` | Fired on each keystroke |
| `input-change` | `{ value, input }` | Fired on value commit |
| `input-focus` | `{ input }` | Fired on focus |
| `input-blur` | `{ input }` | Fired on blur |
| `input-clear` | `{ input }` | Fired when cleared |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | — | Focuses the input |
| `blur()` | — | Removes focus |
| `select()` | — | Selects all text |
| `clear()` | — | Clears the value |
| `checkValidity()` | — | Returns input validity |
| `reportValidity()` | — | Reports input validity |
| `setCustomValidity()` | `message: string` | Sets custom validation message |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | The native input element |
| `prefix-icon` | The prefix icon container |
| `suffix-icon` | The suffix icon container |
| `clear` | The clear button |
| `spinner` | The loading spinner |
| `password-toggle` | The password visibility toggle |
| `helper-text` | The helper text element |
| `error-text` | The error text element |
