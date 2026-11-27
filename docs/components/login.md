<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/login.md -->

# Login
`<snice-login>`

A complete authentication form with username/password fields, using Snice's @request/@respond pattern for controller communication.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Requests](#requests)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'card' \| 'minimal'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Form size |
| `title` | `string` | `'Sign In'` | Form title |
| `disabled` | `boolean` | `false` | Disable the form |
| `loading` | `boolean` | `false` | Show loading state |
| `showRememberMe` (attr: `show-remember-me`) | `boolean` | `true` | Show "Remember me" checkbox |
| `showForgotPassword` (attr: `show-forgot-password`) | `boolean` | `true` | Show "Forgot password" link |
| `actionText` (attr: `action-text`) | `string` | `'Sign In'` | Submit button text |
| `alertMessage` | `string` | `''` | Inline alert text; set from JS to show a message above the form |
| `alertVariant` | `'error' \| 'success' \| ''` | `''` | Styling for `alertMessage` |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `login()` | `credentials?: LoginCredentials` | Trigger login via @request (uses form values if no args) |
| `reset()` | -- | Clear form, error, and loading state |
| `setError()` | `message: string` | Display an error message |
| `clearError()` | -- | Remove error message |
| `setCredentials()` | `credentials: Partial<LoginCredentials>` | Set form field values |
| `showAlert()` | `message: string, variant: 'error' \| 'success'` | Show an inline alert above the form; `setError()` is the error-only shorthand |
| `clearAlert()` | -- | Remove the inline alert |

## Requests

The login component uses `@request('login-user')` to communicate with an authentication controller.

| Request | Params | Description |
|---------|--------|-------------|
| `login-user` | `LoginCredentials` | Sent to controller on login attempt |

### Types

```typescript
interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
  data?: any;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `login-attempt` | `{ username, timestamp }` | Form submitted |
| `login-success` | `{ timestamp }` | Login succeeded |
| `login-error` | `{ error, timestamp }` | Login failed |
| `login-forgot-password` | `{ timestamp }` | Forgot password clicked |

## Slots

| Name | Description |
|------|-------------|
| `before-header` | Content before the header |
| `after-header` | Content after the header |
| `subtitle` | Custom subtitle text |
| `before-form` | Content before the form (e.g., OAuth buttons) |
| `after-form` | Content after the form |
| `form-top` | Content at top of form |
| `between-fields` | Content between username and password fields |
| `before-submit` | Content before submit button |
| `after-submit` | Content after submit button |
| `footer` | Footer content (e.g., signup link) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer login container |
| `header` | `<div>` | The header section containing the title |
| `title` | `<h1>` | The title heading element |
| `form` | `<form>` | The login form element |
| `subtitle` | `<p>` | The default subtitle paragraph |
| `field` | `<div>` | A form field wrapper |
| `username-field` | `<div>` | Added beside `field` on the username row |
| `password-field` | `<div>` | Added beside `field` on the password row |
| `label` | `<label>` | A field label |
| `username-label` | `<label>` | Added beside `label` on the username row |
| `password-label` | `<label>` | Added beside `label` on the password row |
| `input` | `<input>` | A field input |
| `username-input` | `<input>` | Added beside `input` on the username row |
| `password-input` | `<input>` | Added beside `input` on the password row |
| `options` | `<div>` | The remember-me / forgot-password row |
| `remember` | `<label>` | The remember-me label wrapper |
| `checkbox` | `<input>` | The remember-me checkbox |
| `forgot-link` | `<a>` | The forgot-password link |
| `submit-button` | `<snice-button>` | The submit control that sends the credentials |
| `alert` | `<snice-alert>` | The inline alert banner |
| `footer` | `<div>` | The footer section below the form |

The inline banner is a `<snice-alert>`, so every one of its own parts is
forwarded with an `alert-` prefix.

### Forwarded from the inline alert

| Part | Element | Description |
|------|---------|-------------|
| `alert-base` | `<div>` | The alert's root container |
| `alert-body` | `<div>` | The alert's `role="alert"` region wrapping icon and content |
| `alert-icon` | `<span>` | The alert's icon container |
| `alert-icon-content` | `<span>` | The alert's built-in variant glyph |
| `alert-content` | `<div>` | The alert's title and description wrapper |
| `alert-title` | `<div>` | The alert's title text |
| `alert-description` | `<div>` | The alert's description text |
| `alert-close` | `<button>` | The alert's dismiss button |
| `alert-close-icon` | `<span>` | The alert's dismiss button glyph |

The submit control is itself a `<snice-button>`, so every one of its own parts
is forwarded through with a `submit-button-` prefix. Use these when you need the
real `<button>` inside it — its focus ring, padding and colors live there, not on
the `<snice-button>` host.

### Forwarded from the submit button

| Part | Element | Description |
|------|---------|-------------|
| `submit-button-base` | `<button>` | The inner button element |
| `submit-button-spinner` | `<span>` | The loading spinner |
| `submit-button-label` | `<span>` | The label wrapper around the action text |
| `submit-button-icon` | `<span>` | The icon slot wrapper |
| `submit-button-icon-start` | `<span>` | Added beside `submit-button-icon` when the icon renders before the label |
| `submit-button-icon-end` | `<span>` | Added beside `submit-button-icon` when the icon renders after the label |
| `submit-button-base-loading` | `<button>` | Added beside `submit-button-base` while the button is loading |
| `submit-button-base-disabled` | `<button>` | Added beside `submit-button-base` while the button is disabled |

```css
snice-login::part(base) {
  max-width: 400px;
  margin: 0 auto;
}

snice-login::part(title) {
  font-size: 1.5rem;
  font-weight: 700;
}

snice-login::part(form) {
  gap: 1.25rem;
}

snice-login::part(submit-button) {
  width: 100%;
}

/* The focus ring belongs on the element that actually takes focus. */
snice-login::part(submit-button-base):focus-visible {
  outline: 2px solid rgb(37 99 235);
  outline-offset: 2px;
  box-shadow: none;
}
```

## Basic Usage

```typescript
import 'snice/components/login/snice-login';
```

```html
<snice-login controller="auth-controller"></snice-login>
```

In a Snice template, bind the controller class directly (preferred — no registry name needed at the call site):

```typescript
import { AuthController } from './controllers/auth-controller';

html`<snice-login controller=${AuthController}></snice-login>`
```

## Examples

### Variants

Use the `variant` attribute to change the visual style.

```html
<snice-login variant="default" controller="auth-controller"></snice-login>
<snice-login variant="card" controller="auth-controller"></snice-login>
<snice-login variant="minimal" controller="auth-controller"></snice-login>
```

### Sizes

Use the `size` attribute to change the form size.

```html
<snice-login size="small" controller="auth-controller"></snice-login>
<snice-login size="large" controller="auth-controller"></snice-login>
```

### Custom Title and Action

Use `title` and `action-text` to customize the form text.

```html
<snice-login
  controller="auth-controller"
  title="Admin Portal"
  action-text="Access Portal"
  show-remember-me
  show-forgot-password>
</snice-login>
```

### Custom Slots

```html
<snice-login controller="auth-controller">
  <p slot="subtitle">Administrator access required</p>
  <div slot="before-form">
    <button onclick="loginWithGoogle()">Continue with Google</button>
  </div>
  <div slot="footer">
    <p>Don't have an account? <a href="/signup">Sign up</a></p>
  </div>
</snice-login>
```

### Request/Respond Pattern

```typescript
import { controller, respond, IController } from 'snice';
import type { LoginCredentials, LoginResult } from 'snice/components/login/snice-login.types';

@controller('auth-controller')
export class AuthController implements IController {
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      return { success: false, error: 'Invalid credentials' };
    }

    const data = await response.json();
    return { success: true, data: { user: data.user, token: data.token } };
  }
}
```

### Event-Based (Without Controller)

```typescript
login.addEventListener('login-success', () => {
  window.location.href = '/dashboard';
});

login.addEventListener('login-error', (e) => {
  console.error('Failed:', e.detail.error);
});

login.addEventListener('login-forgot-password', () => {
  window.location.href = '/forgot-password';
});
```

### Programmatic Control

```typescript
// Set credentials
login.setCredentials({ username: 'user@example.com', password: 'pass123' });

// Trigger login
const result = await login.login();

// Error handling
login.setError('Invalid credentials');
login.clearError();

// Reset form
login.reset();
```

## Accessibility

- Form inputs use proper `<label>` elements with `for` attributes
- Inputs have `autocomplete` attributes (`username`, `current-password`)
- Enter key on password field triggers form submission
- Loading and disabled states propagate to all form inputs and the submit button
- Required fields are marked with the `required` attribute
