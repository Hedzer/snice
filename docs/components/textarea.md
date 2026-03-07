<!-- AI: For a low-token version of this doc, use docs/ai/components/textarea.md instead -->

# Textarea
`<snice-textarea>`

A multi-line text input with validation, character counting, and optional auto-grow.

## Basic Usage

```typescript
import 'snice/components/textarea/snice-textarea';
```

```html
<snice-textarea label="Comments" placeholder="Enter your comments here" rows="5"></snice-textarea>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/textarea/snice-textarea';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-textarea.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the visual style.

```html
<snice-textarea variant="outlined" label="Outlined"></snice-textarea>
<snice-textarea variant="filled" label="Filled"></snice-textarea>
<snice-textarea variant="underlined" label="Underlined"></snice-textarea>
```

### Sizes

Use the `size` attribute to change the textarea size.

```html
<snice-textarea size="small" label="Small"></snice-textarea>
<snice-textarea size="medium" label="Medium"></snice-textarea>
<snice-textarea size="large" label="Large"></snice-textarea>
```

### With Character Counter

Set the `maxlength` attribute to show a character counter.

```html
<snice-textarea label="Bio" maxlength="500" helper-text="Share a brief bio"></snice-textarea>
```

### Auto-grow

Set the `auto-grow` attribute to expand height automatically as content grows.

```html
<snice-textarea label="Notes" auto-grow rows="3" placeholder="Type to expand..."></snice-textarea>
```

### Resize Control

Use the `resize` attribute to control user resize behavior.

```html
<snice-textarea resize="none" label="No resize"></snice-textarea>
<snice-textarea resize="vertical" label="Vertical only"></snice-textarea>
<snice-textarea resize="horizontal" label="Horizontal only"></snice-textarea>
<snice-textarea resize="both" label="Both directions"></snice-textarea>
```

### Error State

Set the `invalid` attribute with `error-text` to show validation errors.

```html
<snice-textarea label="Message" invalid error-text="This field is required" required></snice-textarea>
```

### In a Form

The textarea is form-associated and participates in form submission.

```html
<form id="feedback-form">
  <snice-textarea name="feedback" label="Your Feedback" required minlength="10" maxlength="1000" helper-text="At least 10 characters"></snice-textarea>
  <button type="submit">Submit</button>
</form>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Textarea value |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Visual style |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |
| `placeholder` | `string` | `''` | Placeholder text |
| `label` | `string` | `''` | Label text |
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text below textarea |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message (shown when invalid) |
| `disabled` | `boolean` | `false` | Disables the textarea |
| `readonly` | `boolean` | `false` | Makes the textarea read-only |
| `required` | `boolean` | `false` | Makes the textarea required |
| `invalid` | `boolean` | `false` | Shows invalid state |
| `rows` | `number` | `3` | Number of visible rows |
| `cols` | `number` | `-1` | Number of visible columns |
| `maxlength` | `number` | `-1` | Maximum character count |
| `minlength` | `number` | `-1` | Minimum character count |
| `autocomplete` | `string` | `''` | Autocomplete attribute |
| `name` | `string` | `''` | Form field name |
| `autoGrow` (attr: `auto-grow`) | `boolean` | `false` | Auto-expand height |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `textarea-input` | `{ value: string, textarea: SniceTextareaElement }` | Value changed during input |
| `textarea-change` | `{ value: string, textarea: SniceTextareaElement }` | Value committed (blur) |
| `textarea-focus` | `{ textarea: SniceTextareaElement }` | Textarea received focus |
| `textarea-blur` | `{ textarea: SniceTextareaElement }` | Textarea lost focus |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focus the textarea |
| `blur()` | -- | Remove focus |
| `select()` | -- | Select all text |
| `checkValidity()` | -- | Check validation, returns `boolean` |
| `reportValidity()` | -- | Report validation to user, returns `boolean` |
| `setCustomValidity()` | `message: string` | Set custom validation message |

## CSS Parts

| Part | Description |
|------|-------------|
| `textarea` | The native textarea element |
| `spinner` | Loading spinner |
| `error-text` | Error message container |
| `helper-text` | Helper text container |
