<!-- AI: For a low-token version of this doc, use docs/ai/components/switch.md instead -->

# Switch
`<snice-switch>`

A toggle switch input for boolean selections.

## Basic Usage

```typescript
import 'snice/components/switch/snice-switch';
```

```html
<snice-switch label="Enable notifications"></snice-switch>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/switch/snice-switch';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-switch.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to change the switch size.

```html
<snice-switch size="small" label="Small switch"></snice-switch>
<snice-switch size="medium" label="Medium switch"></snice-switch>
<snice-switch size="large" label="Large switch"></snice-switch>
```

### States

```html
<snice-switch checked label="Enabled"></snice-switch>
<snice-switch disabled label="Disabled"></snice-switch>
<snice-switch invalid label="Invalid input"></snice-switch>
```

### With On/Off Labels

Use the `label-on` and `label-off` attributes for text inside the switch track.

```html
<snice-switch label="Dark mode" label-on="ON" label-off="OFF"></snice-switch>
```

### In a Form

The switch contains a native `<input type="checkbox">` internally, which participates in form submission when `name` is set.

```html
<form id="settings-form">
  <snice-switch name="notifications" value="enabled" label="Email notifications" required></snice-switch>
  <snice-switch name="newsletter" value="subscribed" label="Subscribe to newsletter"></snice-switch>
  <button type="submit">Save Settings</button>
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

```html
<snice-switch id="feature-switch" label="Enable feature"></snice-switch>

<script>
  document.getElementById('feature-switch').addEventListener('switch-change', (e) => {
    console.log('Switch is', e.detail.checked ? 'on' : 'off');
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the switch is on |
| `disabled` | `boolean` | `false` | Disables the switch |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `required` | `boolean` | `false` | Makes the switch required |
| `invalid` | `boolean` | `false` | Shows invalid state |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `'on'` | Form value when checked |
| `label` | `string` | `''` | Label text |
| `labelOn` (attr: `label-on`) | `string` | `''` | Text on switch track when on |
| `labelOff` (attr: `label-off`) | `string` | `''` | Text on switch track when off |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `switch-change` | `{ checked: boolean, switch: SniceSwitchElement }` | Switch state changed |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `toggle()` | -- | Toggle the switch state |
| `focus()` | `options?: FocusOptions` | Focus the switch |
| `blur()` | -- | Remove focus |
| `click()` | -- | Programmatically click the switch |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Hidden input element |
| `track` | Switch track |
| `thumb` | Switch thumb |
| `spinner` | Loading spinner |
| `label` | Label text |
