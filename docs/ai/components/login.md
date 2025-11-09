# snice-login

Login form with username/password using @request/@respond pattern.

## Properties

```typescript
variant: 'default'|'card'|'minimal' = 'default';
size: 'small'|'medium'|'large' = 'medium';
title: string = 'Sign In';
disabled: boolean = false;
loading: boolean = false;
showRememberMe: boolean = true;
showForgotPassword: boolean = true;
actionText: string = 'Sign In';
```

## Methods

- `login(credentials?: LoginCredentials): Promise<LoginResult>` - Programmatic login via @request/@respond
- `setCredentials({username?, password?, remember?})` - Set form field values
- `reset()` - Clear form, alert, loading state
- `setError(message)` - Display error alert
- `clearError()` - Clear alert

## @Request/@Respond Pattern (Primary)

Component uses `@request('login-user')` to communicate with controller.

**Element request:**
```typescript
interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}
```

**Controller response:**
```typescript
interface LoginResult {
  success: boolean;
  error?: string;
  data?: any;  // Can include user, token, etc.
}
```

**Controller setup:**
```typescript
import { controller, respond, IController } from 'snice';

@controller('auth-controller')
class AuthController implements IController {
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    // Validate, authenticate, return result
    return { success: true, data: { user, token } };
  }
}
```

**Usage:**
```html
<snice-login controller="auth-controller"></snice-login>
```

## Events (Fallback)

Dispatched for non-Snice framework consumers.

- `login-attempt` - {username, timestamp} - Form submitted
- `login-success` - {timestamp} - Login succeeded
- `login-error` - {error, timestamp} - Login failed
- `login-forgot-password` - {timestamp} - Forgot password clicked

## Usage

```html
<!-- With controller (primary) -->
<snice-login controller="auth-controller"></snice-login>

<!-- Variants -->
<snice-login variant="card"></snice-login>
<snice-login variant="minimal"></snice-login>

<!-- Sizes -->
<snice-login size="small"></snice-login>
<snice-login size="large"></snice-login>

<!-- Options -->
<snice-login
  title="Welcome Back"
  action-text="Sign In"
  show-remember-me
  show-forgot-password>
</snice-login>

<!-- Custom subtitle/footer -->
<snice-login>
  <p slot="subtitle">Please sign in to continue</p>
  <div slot="footer">
    <a href="/signup">Create account</a>
  </div>
</snice-login>

<!-- Event handling (fallback) -->
<script>
const login = document.querySelector('snice-login');

login.addEventListener('login-success', (e) => {
  window.location = '/dashboard';
});

login.addEventListener('login-error', (e) => {
  console.error(e.detail.error);
});
</script>
```

## Slots

- `before-header`, `after-header` - Around header
- `subtitle` - Custom subtitle
- `before-form`, `after-form` - Around form
- `form-top` - Top of form
- `between-fields` - Between username/password
- `before-submit`, `after-submit` - Around button
- `footer` - Footer content

## Features

- @request/@respond with controllers (primary)
- Event dispatch fallback
- 3 visual variants
- 3 sizes
- Optional remember me
- Optional forgot password
- Loading/disabled states
- Error display via alert component
- Keyboard accessible (Enter to submit)
