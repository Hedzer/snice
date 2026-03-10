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
```

## Methods

- `login(credentials?)` → Trigger login via @request (async)
- `setCredentials({username?, password?, remember?})` → Set form values
- `reset()` → Clear form, alert, loading
- `setError(message)` → Show error alert
- `clearError()` → Clear alert

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
- `footer` - Footer section

## Basic Usage

```typescript
import 'snice/components/login/snice-login';
```

```html
<!-- With controller -->
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
