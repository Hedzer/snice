# snice-login

Login form with username/password using @request/@respond pattern.

## Properties

```ts
variant: 'default'|'card'|'minimal' = 'default';
size: 'small'|'medium'|'large' = 'medium';
title: string = 'Sign In';
disabled: boolean = false;
loading: boolean = false;
showRememberMe: boolean = true;      // attr: show-remember-me
showForgotPassword: boolean = true;   // attr: show-forgot-password
actionText: string = 'Sign In';      // attr: action-text
alertMessage: string = '';                        // JS only; inline alert above the form
alertVariant: 'error'|'success'|'' = '';          // JS only; styles alertMessage
```

## Methods

- `login(credentials?)` → Trigger login via @request (async)
- `setCredentials({username?, password?, remember?})` → Set form values
- `reset()` → Clear form, alert, loading
- `setError(message)` → Show error alert
- `clearError()` → Clear alert
- `showAlert(message, 'error'|'success')` → Show inline alert; `setError` is the error-only shorthand
- `clearAlert()` → Remove inline alert

## Requests

- `login-user` → sends `LoginCredentials`, expects `LoginResult`

## Types

```ts
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

- `login-attempt` → `{ username, timestamp }`
- `login-success` → `{ timestamp }`
- `login-error` → `{ error, timestamp }`
- `login-forgot-password` → `{ timestamp }`

## Slots

- `before-header`, `after-header` - Around header
- `subtitle` - Custom subtitle
- `before-form`, `after-form` - Around form
- `form-top` - Top of form
- `between-fields` - Between username/password
- `before-submit`, `after-submit` - Around button
- `footer` - Footer content

## CSS Parts

- `base` - Outer login container
- `header` - Header section
- `title` - H1 title element
- `form` - The login form
- `subtitle` - Default subtitle paragraph
- `field` - A form field wrapper
- `username-field` - Added to the username `field`
- `password-field` - Added to the password `field`
- `label` - A field label
- `username-label` - Added to the username `label`
- `password-label` - Added to the password `label`
- `input` - A field input
- `username-input` - Added to the username `input`
- `password-input` - Added to the password `input`
- `options` - Remember-me / forgot-password row
- `remember` - Remember-me label wrapper
- `checkbox` - Remember-me checkbox
- `forgot-link` - Forgot-password link
- `submit-button` - The `<snice-button>` submit control
- `alert` - The inline `<snice-alert>` banner
- `footer` - Footer section

Forwarded from the inline `<snice-alert>` via `exportparts`:

- `alert-base` - Exported `base` of the alert banner
- `alert-body` - Exported `body` of the alert banner
- `alert-icon` - Exported `icon` of the alert banner
- `alert-icon-content` - Exported `icon-content` of the alert banner
- `alert-content` - Exported `content` of the alert banner
- `alert-title` - Exported `title` of the alert banner
- `alert-description` - Exported `description` of the alert banner
- `alert-close` - Exported `close` of the alert banner
- `alert-close-icon` - Exported `close-icon` of the alert banner

Forwarded from the submit `<snice-button>` via `exportparts`:

- `submit-button-base` - The inner `<button>` (focus ring, padding, colors)
- `submit-button-spinner` - Submit loading spinner
- `submit-button-label` - Submit label wrapper
- `submit-button-icon` - Submit icon slot wrapper
- `submit-button-icon-start` - Exported `icon-start` of the submit button
- `submit-button-icon-end` - Exported `icon-end` of the submit button
- `submit-button-base-loading` - Exported `base-loading` of the submit button
- `submit-button-base-disabled` - Exported `base-disabled` of the submit button

```css
snice-login::part(submit-button) { width: 100%; }
snice-login::part(submit-button-base):focus-visible {
  outline: 2px solid rgb(37 99 235);
  outline-offset: 2px;
}
```

## Basic Usage

```typescript
import 'snice/components/login/snice-login';
```

```typescript
// In a template — bind the controller class directly (preferred)
html`<snice-login controller=${AuthController} title="Welcome" show-remember-me></snice-login>`
```

```html
<!-- Raw HTML — string name -->
<snice-login controller="auth-controller" title="Welcome" show-remember-me></snice-login>

<!-- Variants -->
<snice-login variant="card"></snice-login>
<snice-login variant="minimal" size="small"></snice-login>

<!-- Custom slots -->
<snice-login>
  <p slot="subtitle">Please sign in</p>
  <div slot="footer"><a href="/signup">Create account</a></div>
</snice-login>
```

```typescript
// Controller
@controller('auth-controller')
class AuthController {
  @respond('login-user')
  async handleLogin(creds: LoginCredentials): Promise<LoginResult> {
    return { success: true, data: { token } };
  }
}

// Event fallback
login.addEventListener('login-success', () => location.href = '/dashboard');
```

## Accessibility

- Inputs use `<label for>`; `autocomplete="username"` / `"current-password"`
- Required fields carry `required`
- Enter on the password field submits
- Loading and disabled states propagate to every input and the submit button
