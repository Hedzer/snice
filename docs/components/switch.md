# Switch Component

The `<snice-switch>` component provides a toggle switch input for boolean selections, similar to iOS-style switches.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Styling](#styling)
- [Examples](#examples)

## Basic Usage

```html
<snice-switch label="Enable notifications"></snice-switch>
```

```typescript
import 'snice/components/switch/snice-switch';

const switchEl = document.querySelector('snice-switch');
switchEl.addEventListener('switch-change', (e) => {
  console.log('Switch is now:', e.detail.checked);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the switch is in the on position |
| `disabled` | `boolean` | `false` | Whether the switch is disabled |
| `required` | `boolean` | `false` | Whether the switch is required in a form |
| `invalid` | `boolean` | `false` | Whether to show invalid state styling |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the switch |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `'on'` | Form field value when checked |
| `label` | `string` | `''` | Label text displayed next to the switch |
| `labelOn` | `string` | `''` | Label shown on the switch when in on position |
| `labelOff` | `string` | `''` | Label shown on the switch when in off position |

## Methods

### `toggle(): void`
Toggle the switch state between on and off.

```typescript
switchEl.toggle();
```

### `focus(): void`
Give focus to the switch input.

```typescript
switchEl.focus();
```

### `blur(): void`
Remove focus from the switch input.

```typescript
switchEl.blur();
```

### `click(): void`
Programmatically click the switch.

```typescript
switchEl.click();
```

## Events

### `switch-change`
Fired when the switch state changes.

**Event Detail:**
```typescript
{
  checked: boolean;           // New checked state
  switch: SniceSwitchElement; // Reference to the switch element
}
```

**Usage:**
```typescript
switchEl.addEventListener('switch-change', (e) => {
  const { checked } = e.detail;
  console.log(`Switch is ${checked ? 'on' : 'off'}`);
});
```

## Styling

### Size Variants

```html
<!-- Small -->
<snice-switch size="small" label="Small switch"></snice-switch>

<!-- Medium (default) -->
<snice-switch size="medium" label="Medium switch"></snice-switch>

<!-- Large -->
<snice-switch size="large" label="Large switch"></snice-switch>
```

### State Variants

```html
<!-- Checked -->
<snice-switch checked label="Enabled"></snice-switch>

<!-- Disabled -->
<snice-switch disabled label="Disabled"></snice-switch>

<!-- Invalid -->
<snice-switch invalid label="Invalid input"></snice-switch>

<!-- Required -->
<snice-switch required label="Required *"></snice-switch>
```

## Examples

### Basic Switch

```html
<snice-switch label="Enable feature"></snice-switch>
```

### With On/Off Labels

```html
<snice-switch
  label="Dark mode"
  label-on="ON"
  label-off="OFF">
</snice-switch>
```

### Form Integration

```html
<form id="settingsForm">
  <snice-switch
    name="notifications"
    value="enabled"
    label="Email notifications"
    required>
  </snice-switch>

  <snice-switch
    name="newsletter"
    value="subscribed"
    label="Subscribe to newsletter">
  </snice-switch>

  <button type="submit">Save Settings</button>
</form>

<script type="module">
  import 'snice/components/switch/snice-switch';

  const form = document.querySelector('#settingsForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const settings = Object.fromEntries(formData);

    console.log('Settings:', settings);
    // { notifications: 'enabled' } if checked
  });
</script>
```

### Programmatic Control

```typescript
import type { SniceSwitchElement } from 'snice/components/switch/snice-switch.types';

const switchEl = document.querySelector<SniceSwitchElement>('snice-switch');

// Toggle programmatically
switchEl.toggle();

// Set specific state
switchEl.checked = true;

// Enable/disable
switchEl.disabled = true;
```

### With Event Handling

```typescript
const switchEl = document.querySelector('snice-switch');

switchEl.addEventListener('switch-change', (e) => {
  const { checked, switch: sw } = e.detail;

  if (checked) {
    console.log('Feature enabled');
    enableFeature();
  } else {
    console.log('Feature disabled');
    disableFeature();
  }
});

function enableFeature() {
  // Enable feature logic
}

function disableFeature() {
  // Disable feature logic
}
```

### Validation Example

```html
<form id="termsForm">
  <snice-switch
    id="termsSwitch"
    name="terms"
    label="I agree to the terms and conditions"
    required>
  </snice-switch>

  <button type="submit">Continue</button>
</form>

<script type="module">
  import 'snice/components/switch/snice-switch';

  const form = document.querySelector('#termsForm');
  const termsSwitch = document.querySelector('#termsSwitch');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!termsSwitch.checked) {
      termsSwitch.invalid = true;
      alert('You must agree to the terms');
      return;
    }

    termsSwitch.invalid = false;
    // Continue with form submission
  });
</script>
```

### Multiple Switches

```html
<div class="settings-group">
  <h3>Privacy Settings</h3>

  <snice-switch
    label="Public profile"
    name="public_profile"
    checked>
  </snice-switch>

  <snice-switch
    label="Show email"
    name="show_email">
  </snice-switch>

  <snice-switch
    label="Show phone number"
    name="show_phone">
  </snice-switch>

  <snice-switch
    label="Allow messages from anyone"
    name="allow_messages">
  </snice-switch>
</div>

<style>
  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 400px;
  }

  .settings-group snice-switch {
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .settings-group snice-switch:last-child {
    border-bottom: none;
  }
</style>
```

### Custom Styling with CSS Parts

```html
<style>
  snice-switch::part(track) {
    background: linear-gradient(to right, #667eea, #764ba2);
  }

  snice-switch[checked]::part(track) {
    background: linear-gradient(to right, #f093fb, #f5576c);
  }

  snice-switch::part(thumb) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  snice-switch::part(label) {
    font-weight: 600;
    color: #1f2937;
  }
</style>

<snice-switch label="Custom styled switch" checked></snice-switch>
```

## Accessibility

The switch component includes proper ARIA attributes:

- `role="switch"` on the input element
- `aria-checked` reflects the current state
- `aria-invalid` when invalid state is set
- Native `<input type="checkbox">` for form compatibility
- Keyboard accessible (Space/Enter to toggle)
- Focus visible state

## Form Behavior

The switch component works seamlessly with HTML forms:

- Acts like a checkbox input
- Only included in form data when checked
- Supports `name` and `value` attributes
- Supports `required` attribute for validation
- Compatible with FormData API

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
