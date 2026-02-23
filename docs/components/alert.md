[//]: # (AI: For a low-token version of this doc, use docs/ai/components/alert.md instead)

# Alert Component

The alert component displays notification messages to provide user feedback for informational, success, warning, or error states. It supports customizable variants, sizes, titles, icons, and optional dismissal.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<snice-alert>
  This is a basic alert message.
</snice-alert>
```

```typescript
import 'snice/components/alert/snice-alert';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Alert size |
| `title` | `string` | `''` | Optional title text |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `icon` | `string` | `''` | Custom icon (URL, image file, emoji, font ligature) or `'none'` to hide |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property and default variant icons. |
| (default) | Alert message content |

### Icon Slot Usage

Use the `icon` slot for external CSS-based icon fonts (Material Symbols, Font Awesome) that need to work inside shadow DOM:

```html
<snice-alert variant="info" title="Information">
  <span slot="icon" class="material-symbols-outlined">info</span>
  This is an informational message with a Material Symbols icon.
</snice-alert>

<snice-alert variant="error">
  <i slot="icon" class="fa-solid fa-circle-exclamation"></i>
  An error occurred with Font Awesome icon.
</snice-alert>
```

## Methods

#### `show(): void`
Display the alert (if previously hidden).

```typescript
alert.show();
```

#### `hide(): void`
Hide the alert with animation.

```typescript
alert.hide();
```

## Events

#### `alert-dismiss`
Fired when the dismiss button is clicked.

**Event Detail:**
```typescript
{
  variant: AlertVariant;
  title: string;
}
```

**Usage:**
```typescript
alert.addEventListener('alert-dismiss', (e) => {
  console.log('Alert dismissed:', e.detail.variant);
});
```

#### `alert-hidden`
Fired when the alert is fully hidden (after animation).

**Event Detail:**
```typescript
{
  variant: AlertVariant;
  title: string;
}
```

#### `alert-shown`
Fired when the alert is shown.

**Event Detail:**
```typescript
{
  variant: AlertVariant;
  title: string;
}
```

## Examples

### Basic Alerts

```html
<!-- Info alert (default) -->
<snice-alert>
  This is an informational message.
</snice-alert>

<!-- Success alert -->
<snice-alert variant="success">
  Operation completed successfully!
</snice-alert>

<!-- Warning alert -->
<snice-alert variant="warning">
  Please review your input before continuing.
</snice-alert>

<!-- Error alert -->
<snice-alert variant="error">
  An error occurred while processing your request.
</snice-alert>
```

### Alert with Title

```html
<snice-alert variant="info" title="Did you know?">
  You can customize alerts with titles to provide better context for your messages.
</snice-alert>

<snice-alert variant="success" title="Success!">
  Your profile has been updated successfully.
</snice-alert>

<snice-alert variant="warning" title="Warning">
  Your session will expire in 5 minutes.
</snice-alert>

<snice-alert variant="error" title="Error">
  Unable to connect to the server. Please try again.
</snice-alert>
```

### Dismissible Alerts

```html
<snice-alert variant="info" dismissible>
  This alert can be dismissed by clicking the X button.
</snice-alert>

<snice-alert variant="success" title="Account Created" dismissible>
  Your account has been created successfully. Check your email to verify.
</snice-alert>
```

### Different Sizes

```html
<snice-alert size="small" variant="info">
  Small alert message
</snice-alert>

<snice-alert size="medium" variant="success">
  Medium alert message (default)
</snice-alert>

<snice-alert size="large" variant="warning">
  Large alert message
</snice-alert>
```

### Custom Icons

The `icon` property supports multiple formats:
- **URLs**: Image files (`/icons/info.svg`)
- **Inline SVG**: `<svg>...</svg>`
- **Emoji**: `🎉`, `💡`
- **Font ligatures**: Text for icon fonts like Material Symbols (`info`, `lightbulb`)

```html
<!-- Emoji icons -->
<snice-alert variant="success" icon="🎉">
  Congratulations! You've unlocked a new achievement!
</snice-alert>

<snice-alert variant="info" icon="💡">
  Pro tip: Save time by using keyboard shortcuts.
</snice-alert>

<!-- Image URL -->
<snice-alert variant="info" icon="/icons/info-circle.svg">
  Custom image icon alert.
</snice-alert>

<!-- Font ligature (Material Symbols) -->
<snice-alert variant="info" icon="lightbulb">
  Font ligature icon alert.
</snice-alert>

<!-- No icon -->
<snice-alert variant="warning" icon="none">
  This alert has no icon.
</snice-alert>
```

### Form Validation Alerts

```html
<form id="signup-form">
  <snice-alert variant="error" title="Validation Error" id="form-error" style="display: none;">
    <ul id="error-list"></ul>
  </snice-alert>

  <label>
    Email:
    <input type="email" name="email" required>
  </label>

  <label>
    Password:
    <input type="password" name="password" required>
  </label>

  <button type="submit">Sign Up</button>
</form>

<script type="module">
  import 'snice/components/alert/snice-alert';

  const form = document.getElementById('signup-form');
  const errorAlert = document.getElementById('form-error');
  const errorList = document.getElementById('error-list');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errors = [];

    const email = form.email.value;
    const password = form.password.value;

    if (!email.includes('@')) {
      errors.push('Invalid email address');
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (errors.length > 0) {
      errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
      errorAlert.style.display = 'block';
      errorAlert.show();
    } else {
      errorAlert.style.display = 'none';
      // Submit form
    }
  });
</script>
```

### Dynamic Alerts

```html
<div id="alert-container"></div>

<button onclick="showSuccessAlert()">Show Success</button>
<button onclick="showErrorAlert()">Show Error</button>

<script type="module">
  import 'snice/components/alert/snice-alert';

  window.showSuccessAlert = () => {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('snice-alert');
    alert.variant = 'success';
    alert.title = 'Success!';
    alert.dismissible = true;
    alert.textContent = 'Operation completed successfully.';

    container.appendChild(alert);

    alert.addEventListener('alert-hidden', () => {
      alert.remove();
    });
  };

  window.showErrorAlert = () => {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('snice-alert');
    alert.variant = 'error';
    alert.title = 'Error';
    alert.dismissible = true;
    alert.textContent = 'Something went wrong. Please try again.';

    container.appendChild(alert);

    alert.addEventListener('alert-hidden', () => {
      alert.remove();
    });
  };
</script>
```

### Auto-Dismiss Alert

```html
<snice-alert id="auto-dismiss" variant="success" title="Saved!">
  Your changes have been saved.
</snice-alert>

<script type="module">
  import 'snice/components/alert/snice-alert';

  const alert = document.getElementById('auto-dismiss');

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alert.hide();
  }, 5000);

  alert.addEventListener('alert-hidden', () => {
    console.log('Alert was auto-dismissed');
  });
</script>
```

### Alert with Links

```html
<snice-alert variant="info" title="Update Available">
  A new version of the application is available.
  <a href="/updates" style="text-decoration: underline; font-weight: 600;">
    View update details
  </a>
</snice-alert>

<snice-alert variant="warning" title="Action Required">
  Your payment method is expiring soon.
  <a href="/billing" style="text-decoration: underline; font-weight: 600;">
    Update payment method
  </a>
</snice-alert>
```

### Alert with Rich Content

```html
<snice-alert variant="success" title="Welcome!">
  <p>Thank you for joining our platform. Here's what you can do next:</p>
  <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
    <li>Complete your profile</li>
    <li>Explore available features</li>
    <li>Connect with other users</li>
  </ul>
</snice-alert>
```

### Notification Center

```html
<div id="notifications" style="position: fixed; top: 1rem; right: 1rem; width: 20rem; z-index: 1000;">
  <!-- Notifications will be added here -->
</div>

<button onclick="notify('info', 'New message received')">Info</button>
<button onclick="notify('success', 'File uploaded successfully')">Success</button>
<button onclick="notify('warning', 'Low disk space')">Warning</button>
<button onclick="notify('error', 'Connection lost')">Error</button>

<script type="module">
  import 'snice/components/alert/snice-alert';

  window.notify = (variant, message) => {
    const container = document.getElementById('notifications');
    const alert = document.createElement('snice-alert');

    alert.variant = variant;
    alert.dismissible = true;
    alert.textContent = message;
    alert.style.marginBottom = '0.5rem';

    container.appendChild(alert);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      alert.hide();
    }, 4000);

    alert.addEventListener('alert-hidden', () => {
      alert.remove();
    });
  };
</script>
```

### Alert Stack

```html
<style>
  .alert-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 40rem;
  }
</style>

<div class="alert-stack">
  <snice-alert variant="info" title="System Maintenance" dismissible>
    Scheduled maintenance is planned for tonight at 11 PM EST.
  </snice-alert>

  <snice-alert variant="warning" title="Limited Availability" dismissible>
    Some features may be temporarily unavailable during the maintenance window.
  </snice-alert>

  <snice-alert variant="success" title="New Feature Released" dismissible>
    Check out our new dashboard analytics feature!
  </snice-alert>
</div>
```

### Event Handling

```typescript
import type { SniceAlertElement } from 'snice/components/alert/snice-alert.types';

const alert = document.querySelector<SniceAlertElement>('snice-alert');

alert.addEventListener('alert-dismiss', (e) => {
  console.log('User dismissed alert:', e.detail);
  // Track analytics
  analytics.track('alert_dismissed', {
    variant: e.detail.variant,
    title: e.detail.title
  });
});

alert.addEventListener('alert-shown', () => {
  console.log('Alert is now visible');
});

alert.addEventListener('alert-hidden', () => {
  console.log('Alert is now hidden');
  // Clean up or remove from DOM
  alert.remove();
});
```

### API Response Alerts

```html
<snice-alert id="api-alert" style="display: none;"></snice-alert>

<button onclick="makeApiCall()">Make API Call</button>

<script type="module">
  import type { SniceAlertElement } from 'snice/components/alert/snice-alert.types';

  window.makeApiCall = async () => {
    const alert = document.getElementById('api-alert') as SniceAlertElement;

    try {
      const response = await fetch('/api/data');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      alert.variant = 'success';
      alert.title = 'Success!';
      alert.textContent = 'Data loaded successfully.';
      alert.dismissible = true;
      alert.style.display = 'block';
      alert.show();

    } catch (error) {
      alert.variant = 'error';
      alert.title = 'Error';
      alert.textContent = `Failed to load data: ${error.message}`;
      alert.dismissible = true;
      alert.style.display = 'block';
      alert.show();
    }
  };
</script>
```

## Accessibility

- **ARIA role**: `alert` role with `aria-live="polite"` for screen reader announcements
- **Keyboard support**: Dismiss button is keyboard accessible
- **Color contrast**: All variants meet WCAG AA standards
- **Screen reader friendly**: Content is properly announced
- **Focus management**: Dismiss button receives proper focus

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Choose appropriate variants**: Use semantic variants that match the message type
2. **Keep messages concise**: Short, clear messages are more effective
3. **Use titles for context**: Titles help users quickly understand the alert type
4. **Make important alerts dismissible**: Allow users to close alerts they've read
5. **Auto-dismiss when appropriate**: Consider auto-dismissing success messages
6. **Position alerts appropriately**: Place alerts near related content or in a notification area
7. **Don't overuse**: Too many alerts can overwhelm users
8. **Provide actionable information**: Include next steps or actions when relevant
9. **Test with screen readers**: Ensure alerts are announced properly
10. **Handle multiple alerts**: Stack or queue alerts to avoid overwhelming users

## Common Patterns

### Success Pattern
```html
<snice-alert variant="success" title="Success!" dismissible>
  Your changes have been saved.
</snice-alert>
```

### Error Pattern
```html
<snice-alert variant="error" title="Error" dismissible>
  Unable to save changes. Please try again.
</snice-alert>
```

### Warning Pattern
```html
<snice-alert variant="warning" title="Warning">
  This action cannot be undone.
</snice-alert>
```

### Info Pattern
```html
<snice-alert variant="info" title="Information">
  New features are available in this update.
</snice-alert>
```

### Inline Form Validation
```html
<snice-alert variant="error" size="small">
  Please enter a valid email address.
</snice-alert>
```

## Variant Colors

| Variant | Color Scheme | Use Case |
|---------|-------------|----------|
| `info` | Blue | General information, tips, updates |
| `success` | Green | Successful operations, confirmations |
| `warning` | Orange | Cautions, important notices |
| `error` | Red | Errors, failed operations, critical issues |
