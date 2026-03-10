<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/checkbox.md -->

# Checkbox Component

Checkbox input with support for checked, indeterminate, loading, and invalid states, multiple sizes, and full keyboard accessibility.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the checkbox is checked |
| `indeterminate` | `boolean` | `false` | Show indeterminate (partial) state |
| `disabled` | `boolean` | `false` | Disable the checkbox |
| `loading` | `boolean` | `false` | Show loading spinner |
| `required` | `boolean` | `false` | Mark as required field |
| `invalid` | `boolean` | `false` | Show invalid state styling |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Checkbox size |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `'on'` | Form field value when checked |
| `label` | `string` | `''` | Label text |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focus the checkbox |
| `blur()` | -- | Remove focus |
| `click()` | -- | Programmatically click the checkbox |
| `toggle()` | -- | Toggle the checked state |
| `setIndeterminate()` | -- | Set the checkbox to indeterminate state |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `checkbox-change` | `{ checked: boolean, indeterminate: boolean, checkbox: SniceCheckboxElement }` | Fired when the checkbox state changes |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Hidden checkbox input |
| `checkbox` | Custom checkbox element |
| `spinner` | Loading spinner |
| `label` | Label text |

## Basic Usage

```html
<snice-checkbox label="Accept terms and conditions"></snice-checkbox>
```

```typescript
import 'snice/components/checkbox/snice-checkbox';
```

## Examples

### States

Use attributes to set the checkbox state.

```html
<snice-checkbox label="Checked" checked></snice-checkbox>
<snice-checkbox label="Indeterminate" indeterminate></snice-checkbox>
<snice-checkbox label="Disabled" disabled></snice-checkbox>
<snice-checkbox label="Required" required></snice-checkbox>
<snice-checkbox label="Invalid" invalid></snice-checkbox>
<snice-checkbox label="Loading" loading></snice-checkbox>
```

### Sizes

Use the `size` attribute to change the checkbox size.

```html
<snice-checkbox label="Small" size="small"></snice-checkbox>
<snice-checkbox label="Medium" size="medium"></snice-checkbox>
<snice-checkbox label="Large" size="large"></snice-checkbox>
```

### Form Integration

Use `name` and `value` for form data.

```html
<form id="signup-form">
  <snice-checkbox name="terms" value="accepted" label="I accept the terms" required></snice-checkbox>
  <snice-checkbox name="newsletter" value="yes" label="Subscribe to newsletter"></snice-checkbox>
  <button type="submit">Sign Up</button>
</form>
```

### Select All Pattern

Use `indeterminate` for partial selection in a parent checkbox.

```html
<snice-checkbox id="select-all" label="Select all items"></snice-checkbox>
<div style="margin-left: 2rem;">
  <snice-checkbox class="item-checkbox" label="Item 1" value="item1"></snice-checkbox>
  <snice-checkbox class="item-checkbox" label="Item 2" value="item2"></snice-checkbox>
  <snice-checkbox class="item-checkbox" label="Item 3" value="item3"></snice-checkbox>
</div>
```

```typescript
selectAll.addEventListener('change', (e) => {
  items.forEach(item => item.checked = e.detail.checked);
});

items.forEach(item => {
  item.addEventListener('change', () => {
    const checkedCount = items.filter(i => i.checked).length;
    selectAll.checked = checkedCount === items.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < items.length;
  });
});
```

### Event Handling

Listen for state changes with the `checkbox-change` event.

```typescript
checkbox.addEventListener('checkbox-change', (e) => {
  console.log('Checked:', e.detail.checked);
  console.log('Indeterminate:', e.detail.indeterminate);
});
```

## Keyboard Navigation

- Space to toggle
- Tab to navigate between checkboxes

## Accessibility

- Proper `aria-checked` (including "mixed" for indeterminate)
- `aria-invalid` for validation errors
- Screen reader friendly label association
- Clear focus indicators for keyboard navigation
