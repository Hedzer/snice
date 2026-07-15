<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/checkbox.md -->

# Checkbox Component

Native-style form checkbox with checked, indeterminate, loading, validation, and size states. It is a form-associated custom element: checked values participate in `FormData`, required validation blocks submission, form reset restores the authored default, and disabled fieldsets are respected.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Checked State and Reset Defaults](#checked-state-and-reset-defaults)
- [Form Integration](#form-integration)
- [Validation](#validation)
- [Event Handling](#event-handling)
- [Select All Pattern](#select-all-pattern)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `checked` | -- | `boolean` | `false` | Live checked state. Property assignments do not rewrite the reset default. |
| `defaultChecked` | `checked` | `boolean` | `false` | Authored/default checked state restored by form reset. |
| `indeterminate` | `indeterminate` | `boolean` | `false` | Shows the partial-selection state. Independent of `checked`. |
| `disabled` | `disabled` | `boolean` | `false` | Authored disabled state. Effective fieldset disabledness does not rewrite it. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner and blocks interaction. It does not remove the control from form data or validation. |
| `required` | `required` | `boolean` | `false` | Makes an unchecked enabled checkbox invalid. |
| `invalid` | `invalid` | `boolean` | `false` | Visual invalid styling only; use `required` or `setCustomValidity()` for constraint validation. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Checkbox size. |
| `name` | `name` | `string` | `''` | Form field name. An empty name is not submitted. |
| `value` | `value` | `string` | `'on'` | Exact form value submitted while checked. |
| `label` | `label` | `string` | `''` | Visible label text. |
| `type` | -- | `'checkbox'` | `'checkbox'` | Read-only control type. |
| `form` | -- | `HTMLFormElement \| null` | `null` | Read-only owning form. |
| `validity` | -- | `ValidityState` | -- | Read-only constraint-validation state. |
| `validationMessage` | -- | `string` | `''` | Read-only current validation message. |
| `willValidate` | -- | `boolean` | -- | Read-only validation participation state. |
| `labels` | -- | `NodeList \| null` | -- | Read-only associated labels. |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focuses the internal native checkbox. |
| `blur()` | -- | Removes focus. |
| `click()` | -- | Runs the native activation path unless disabled or loading. |
| `toggle()` | -- | Alias for the same activation path as `click()`. |
| `setIndeterminate()` | -- | Sets `indeterminate` without changing `checked` or firing events. |
| `checkValidity()` | -- | Checks constraint validity and returns the result. |
| `reportValidity()` | -- | Reports constraint validity and returns the result. |
| `setCustomValidity(message)` | `string` | Sets a custom validation error; pass `''` to clear it. |

## Events

User activation emits these events in order:

| Event | Detail | Description |
|-------|--------|-------------|
| `input` | standard `Event` | Checked state changed through pointer, keyboard, label, `click()`, or `toggle()` activation. |
| `change` | standard `Event` | Follows `input` after the same activation. |
| `checkbox-change` | `{ checked, indeterminate, checkbox }` | Component-specific event emitted after `change`. |

All three bubble from the `<snice-checkbox>` host and cross shadow boundaries. Direct property assignment, `setIndeterminate()`, form reset, and browser state restoration are silent. Canceling the activation click prevents the state change and all three events.

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Native checkbox input. |
| `checkbox` | Visual checkbox. |
| `spinner` | Loading spinner. |
| `label` | Label text. |

## Basic Usage

```html
<snice-checkbox label="Accept terms and conditions"></snice-checkbox>
```

```typescript
import 'snice/components/checkbox/snice-checkbox';
```

### States and Sizes

```html
<snice-checkbox label="Checked by default" checked></snice-checkbox>
<snice-checkbox label="Indeterminate" indeterminate></snice-checkbox>
<snice-checkbox label="Disabled" disabled></snice-checkbox>
<snice-checkbox label="Loading" loading></snice-checkbox>

<snice-checkbox label="Small" size="small"></snice-checkbox>
<snice-checkbox label="Medium" size="medium"></snice-checkbox>
<snice-checkbox label="Large" size="large"></snice-checkbox>
```

## Checked State and Reset Defaults

The model matches a native `HTMLInputElement`:

- `checkbox.checked` is the current state.
- `checkbox.defaultChecked` and the `checked` content attribute are the reset default.
- Assigning `checked`, even to its existing value, makes current state independent from later default changes.
- Changing `defaultChecked` updates current state only while checkedness is still clean.
- Form reset restores `checked` from `defaultChecked`, but preserves `indeterminate`.

```html
<form id="preferences">
  <snice-checkbox id="digest" name="digest" value="weekly" checked
    label="Weekly digest"></snice-checkbox>
  <button type="reset">Restore defaults</button>
</form>
```

```typescript
const digest = document.querySelector('#digest');

digest.checked = false;       // live state; the checked attribute remains
digest.defaultChecked = true; // reset still returns to checked
preferences.reset();          // digest.checked === true
```

## Form Integration

A checkbox is a successful form control only when it is checked, enabled, and has a non-empty `name`. Its submitted value is the exact `value` string, including `''`; the default is `'on'`. Multiple checked boxes may submit repeated entries with the same name.

```html
<form id="signup-form">
  <snice-checkbox
    name="terms"
    value="accepted"
    label="I accept the terms"
    required
  ></snice-checkbox>

  <snice-checkbox
    name="topics"
    value="releases"
    label="Release notes"
    checked
  ></snice-checkbox>

  <snice-checkbox
    name="topics"
    value="tutorials"
    label="Tutorials"
  ></snice-checkbox>

  <button type="submit">Sign up</button>
  <button type="reset">Reset</button>
</form>
```

```typescript
signupForm.addEventListener('submit', event => {
  event.preventDefault();
  console.log([...new FormData(signupForm)]);
});
```

A `disabled` checkbox and a checkbox effectively disabled by an ancestor `<fieldset disabled>` are omitted and do not validate. A checkbox in that fieldset's first `<legend>` remains enabled, matching native fieldset rules. The authored `checkbox.disabled` property and attribute are not changed by fieldset ancestry.

The standard `form` attribute can associate a checkbox with a form elsewhere in the document:

```html
<form id="filters"></form>
<snice-checkbox form="filters" name="archived" value="include"
  label="Include archived"></snice-checkbox>
```

## Validation

An enabled unchecked `required` checkbox has `validity.valueMissing === true`, makes its form invalid, and blocks normal submission. `checkValidity()`, `reportValidity()`, `validity`, `validationMessage`, and `setCustomValidity()` follow the native form-control API.

```typescript
const terms = document.querySelector('[name="terms"]');

terms.setCustomValidity('Review and accept the policy.');
terms.reportValidity();

terms.addEventListener('checkbox-change', () => {
  terms.setCustomValidity('');
});
```

The `invalid` property changes presentation and `aria-invalid`; it does not create a constraint-validation error by itself.

## Event Handling

Use `change` when only the current state is needed, or `checkbox-change` when the typed detail is convenient:

```typescript
checkbox.addEventListener('change', () => {
  console.log('Checked:', checkbox.checked);
});

checkbox.addEventListener('checkbox-change', event => {
  console.log(event.detail.checked);
  console.log(event.detail.indeterminate);
});
```

## Select All Pattern

`indeterminate` communicates partial selection without changing the checked value.

```html
<snice-checkbox id="select-all" label="Select all items"></snice-checkbox>
<div class="items">
  <snice-checkbox label="Item 1"></snice-checkbox>
  <snice-checkbox label="Item 2"></snice-checkbox>
  <snice-checkbox label="Item 3"></snice-checkbox>
</div>
```

```typescript
const selectAll = document.querySelector('#select-all');
const items = [...document.querySelectorAll('.items snice-checkbox')];

selectAll.addEventListener('change', () => {
  for (const item of items) item.checked = selectAll.checked;
});

for (const item of items) {
  item.addEventListener('change', () => {
    const checkedCount = items.filter(candidate => candidate.checked).length;
    selectAll.checked = checkedCount === items.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < items.length;
  });
}
```

## Keyboard Navigation

- `Space` toggles the focused checkbox.
- `Tab` and `Shift+Tab` move focus through the document.

## Accessibility

- Uses a native checkbox input for keyboard and assistive-technology behavior.
- Exposes `aria-checked="mixed"` for indeterminate state.
- Associates the `label` text with the native control.
- Supports association and activation through external `<label for="...">` elements.
- Shows a visible keyboard focus indicator.
- Exposes `aria-invalid` for explicit invalid presentation.
