# Textarea Component

The `<snice-textarea>` component provides a multi-line text input with validation, character counting, and optional auto-grow functionality.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Features](#features)
- [Examples](#examples)

## Basic Usage

```html
<snice-textarea
  label="Comments"
  placeholder="Enter your comments here"
  rows="5"
></snice-textarea>
```

```typescript
import 'snice/components/textarea/snice-textarea';

const textarea = document.querySelector('snice-textarea');
textarea.addEventListener('textarea-change', (e) => {
  console.log('Value:', e.detail.value);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | The textarea value |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Visual style variant |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |
| `placeholder` | `string` | `''` | Placeholder text |
| `label` | `string` | `''` | Label text |
| `helperText` | `string` | `''` | Helper text below textarea |
| `errorText` | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Whether textarea is disabled |
| `readonly` | `boolean` | `false` | Whether textarea is readonly |
| `required` | `boolean` | `false` | Whether textarea is required |
| `invalid` | `boolean` | `false` | Whether to show invalid state |
| `rows` | `number` | `3` | Number of visible rows |
| `cols` | `number` | `-1` | Number of visible columns |
| `maxlength` | `number` | `-1` | Maximum character count |
| `minlength` | `number` | `-1` | Minimum character count |
| `autocomplete` | `string` | `''` | Autocomplete attribute value |
| `name` | `string` | `''` | Form field name |
| `autoGrow` | `boolean` | `false` | Whether to auto-grow height |

## Methods

### `focus(): void`
Give focus to the textarea.

```typescript
textarea.focus();
```

### `blur(): void`
Remove focus from the textarea.

```typescript
textarea.blur();
```

### `select(): void`
Select all text in the textarea.

```typescript
textarea.select();
```

### `checkValidity(): boolean`
Check if the textarea passes validation.

```typescript
const isValid = textarea.checkValidity();
```

### `reportValidity(): boolean`
Report validation status to the user.

```typescript
textarea.reportValidity();
```

### `setCustomValidity(message: string): void`
Set a custom validation message.

```typescript
textarea.setCustomValidity('This field is required');
```

## Events

### `textarea-input`
Fired when the textarea value changes during input.

**Detail**: `{ value: string, textarea: SniceTextareaElement }`

```typescript
textarea.addEventListener('textarea-input', (e) => {
  console.log('Input value:', e.detail.value);
});
```

### `textarea-change`
Fired when the textarea value is committed (blur or enter).

**Detail**: `{ value: string, textarea: SniceTextareaElement }`

```typescript
textarea.addEventListener('textarea-change', (e) => {
  console.log('Changed to:', e.detail.value);
});
```

### `textarea-focus`
Fired when the textarea receives focus.

**Detail**: `{ textarea: SniceTextareaElement }`

### `textarea-blur`
Fired when the textarea loses focus.

**Detail**: `{ textarea: SniceTextareaElement }`

## Features

- **Form Integration**: Fully form-associated custom element with validation support
- **Visual Variants**: Three style options (outlined, filled, underlined)
- **Auto-grow**: Automatically expand height to fit content
- **Character Counter**: Shows count when maxlength is set
- **Resize Control**: Four resize modes (none, vertical, horizontal, both)
- **Validation**: Built-in HTML5 validation with custom messages
- **Accessibility**: Full keyboard support and ARIA attributes

## Examples

### Basic Textarea

```html
<snice-textarea
  label="Description"
  placeholder="Enter description..."
  rows="4"
></snice-textarea>
```

### With Character Counter

```html
<snice-textarea
  label="Bio"
  maxlength="500"
  helper-text="Share a brief bio"
></snice-textarea>
```

### Auto-grow Textarea

```html
<snice-textarea
  label="Notes"
  auto-grow
  rows="3"
  placeholder="Type to expand..."
></snice-textarea>
```

### Error State

```html
<snice-textarea
  label="Message"
  invalid
  error-text="This field is required"
  required
></snice-textarea>
```

### Different Variants

```html
<snice-textarea variant="outlined" label="Outlined"></snice-textarea>
<snice-textarea variant="filled" label="Filled"></snice-textarea>
<snice-textarea variant="underlined" label="Underlined"></snice-textarea>
```

### Different Sizes

```html
<snice-textarea size="small" label="Small"></snice-textarea>
<snice-textarea size="medium" label="Medium"></snice-textarea>
<snice-textarea size="large" label="Large"></snice-textarea>
```

### Resize Control

```html
<snice-textarea resize="none" label="No resize"></snice-textarea>
<snice-textarea resize="vertical" label="Vertical only"></snice-textarea>
<snice-textarea resize="horizontal" label="Horizontal only"></snice-textarea>
<snice-textarea resize="both" label="Both directions"></snice-textarea>
```

### In a Form

```html
<form id="feedback-form">
  <snice-textarea
    name="feedback"
    label="Your Feedback"
    required
    minlength="10"
    maxlength="1000"
    helper-text="Please provide at least 10 characters"
  ></snice-textarea>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('feedback-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  console.log('Feedback:', formData.get('feedback'));
});
</script>
```
