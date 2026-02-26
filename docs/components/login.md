[//]: # (AI: For a low-token version of this doc, use docs/ai/components/login.md instead)

# Login
`<snice-login>`

A complete authentication form with username/password fields, using Snice's @request/@respond pattern for controller communication.

## Basic Usage

```typescript
import 'snice/components/login/snice-login';
```

```html
<snice-login controller="auth-controller"></snice-login>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/login/snice-login';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-login.min.js"></script>
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

The login component uses `@request('login-user')` to communicate with an authentication controller.

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

```html
<snice-login id="login"></snice-login>

<script type="module">
  import 'snice/components/login/snice-login';

  const login = document.getElementById('login');

  login.addEventListener('login-success', () => {
    window.location.href = '/dashboard';
  });

  login.addEventListener('login-error', (e) => {
    console.error('Failed:', e.detail.error);
  });

  login.addEventListener('login-forgot-password', () => {
    window.location.href = '/forgot-password';
  });
</script>
```

### Programmatic Control

```typescript
const login = document.querySelector('snice-login');

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

## Request/Respond Types

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

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer login container |
| `header` | `<div>` | The header section containing the title |
| `title` | `<h1>` | The title heading element |
| `form` | `<form>` | The login form element |
| `footer` | `<div>` | The footer section below the form |

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
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `login-attempt` | `{ username, timestamp }` | Form submitted |
| `login-success` | `{ timestamp }` | Login succeeded |
| `login-error` | `{ error, timestamp }` | Login failed |
| `login-forgot-password` | `{ timestamp }` | Forgot password clicked |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `login()` | `credentials?: LoginCredentials` | Trigger login (uses form values if no args) |
| `reset()` | -- | Clear form, error, and loading state |
| `setError()` | `message: string` | Display an error message |
| `clearError()` | -- | Remove error message |
| `setCredentials()` | `credentials: Partial<LoginCredentials>` | Set form field values |

## Requests

| Request | Params | Description |
|---------|--------|-------------|
| `login-user` | `LoginCredentials` | Sent to controller on login attempt |
