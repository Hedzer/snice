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
| `checked` | `boolean` | `false` | Whether the switch is on |
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

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `toggle()` | -- | `void` | Toggle the switch state |
| `focus()` | `options?: FocusOptions` | `void` | Focus the switch |
| `blur()` | -- | `void` | Remove focus |
| `click()` | -- | `void` | Programmatically click the switch |

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

The switch contains an internal `<input type="checkbox">` that participates in form submission when `name` is set.

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
