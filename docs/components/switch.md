<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/switch.md -->

# Switch

A toggle switch input for boolean selections. Supports on/off labels, form integration, and loading state.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` (property only) | `boolean` | `false` | Live on/off state |
| `defaultChecked` (attr: `checked`) | `boolean` | `false` | Authored state restored by form reset |
| `disabled` | `boolean` | `false` | Disables the switch |
| `loading` | `boolean` | `false` | Shows loading spinner and disables the switch |
| `required` | `boolean` | `false` | Makes the switch required |
| `invalid` | `boolean` | `false` | Shows invalid state |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `'on'` | Form value when checked |
| `label` | `string` | `''` | Label text |
| `labelOn` (attr: `label-on`) | `string` | `''` | Text on switch track when on |
| `labelOff` (attr: `label-off`) | `string` | `''` | Text on switch track when off |
| `type` (read-only) | `'checkbox'` | `'checkbox'` | Native-compatible control type |
| `form` (read-only) | `HTMLFormElement \| null` | — | Current owning form |
| `validity` (read-only) | `ValidityState` | — | Current constraint-validation flags |
| `validationMessage` (read-only) | `string` | `''` | Current validation message |
| `willValidate` (read-only) | `boolean` | — | Whether validation currently applies |
| `labels` (read-only) | `NodeList \| null` | — | Current wrapping and explicit labels |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `toggle()` | -- | `void` | Toggle the switch state |
| `focus()` | -- | `void` | Focus the switch |
| `blur()` | -- | `void` | Remove focus |
| `click()` | -- | `void` | Programmatically click the switch |
| `checkValidity()` | -- | `boolean` | Check current constraint validity |
| `reportValidity()` | -- | `boolean` | Report current validity |
| `setCustomValidity(message)` | `string` | `void` | Set a custom error; pass `''` to clear it |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `switch-change` | `{ checked: boolean, switch: SniceSwitchElement }` | Switch state changed |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Hidden input element |
| `track` | Switch track |
| `thumb` | Switch thumb |
| `spinner` | Loading spinner |
| `label` | Label text |

## Basic Usage

```typescript
import 'snice/components/switch/snice-switch';
```

```html
<snice-switch label="Enable notifications"></snice-switch>
```

### Checked State and Reset Default

`checked` is live checkedness. `defaultChecked` and the `checked` content attribute are the authored reset default, matching a native checkbox. Assigning or toggling `checked`—even to its current value—makes it dirty, so later default changes do not alter live state until `form.reset()` silently restores them. Browser restoration, repeated resets, disconnect/reconnect, form moves, and disabled fieldsets preserve this separation. A checked, enabled switch contributes its `value`; an unchecked switch contributes no entry.

## Examples

### Sizes

Use `size` to change the switch dimensions.

```html
<snice-switch size="small" label="Small"></snice-switch>
<snice-switch size="medium" label="Medium"></snice-switch>
<snice-switch size="large" label="Large"></snice-switch>
```

### States

```html
<snice-switch checked label="Enabled"></snice-switch>
<snice-switch disabled label="Disabled"></snice-switch>
<snice-switch invalid label="Invalid"></snice-switch>
<snice-switch loading label="Saving..."></snice-switch>
```

### With On/Off Labels

Use `label-on` and `label-off` for text inside the switch track.

```html
<snice-switch label="Dark mode" label-on="ON" label-off="OFF"></snice-switch>
```

### Form Integration

The form-associated `<snice-switch>` host participates in submission through `ElementInternals` when `name` is set. Its internal checkbox drives native interaction and accessibility, but is unnamed and does not create a second form field.

A checked, enabled switch contributes its configured `value`; an unchecked switch contributes nothing. An unchecked `required` switch reports `valueMissing`, blocks validated submission, and automatically receives invalid styling and `aria-invalid`. `setCustomValidity()` controls `customError`. The authored `invalid` property changes presentation/ARIA only. Disabled and loading switches are barred from validation; disabled switches are omitted from `FormData`, while loading preserves the current successful value. The host emits standard composed `input` and `change` events as well as `switch-change` for customer interaction.

```html
<form id="settings-form">
  <snice-switch name="notifications" value="enabled" label="Email notifications" required></snice-switch>
  <snice-switch name="newsletter" value="subscribed" label="Newsletter"></snice-switch>
  <button type="submit">Save</button>
</form>

<script>
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log('Settings:', Object.fromEntries(formData));
  });
</script>
```

### Event Handling

```typescript
el.addEventListener('switch-change', (e) => {
  console.log('Switch is', e.detail.checked ? 'on' : 'off');
});
```

## Accessibility

- Keyboard toggle with Space key
- Visible focus ring on keyboard navigation
- `role="switch"` with `aria-checked` state
- Loading state disables interaction and shows a spinner
