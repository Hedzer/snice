# Login Component

The login component provides a complete authentication form with username and password fields. It uses Snice's @request/@respond pattern for communication with authentication controllers, with event dispatching as a fallback for non-Snice frameworks.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Request/Respond Pattern](#requestrespond-pattern)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Examples](#examples)

## Basic Usage

```html
<snice-login controller="auth-controller"></snice-login>
```

```typescript
import 'snice/components/login/snice-login';
```

## Request/Respond Pattern

The login component uses Snice's @request/@respond pattern as its primary communication method. This enables bidirectional request/response communication between the login element and an authentication controller.

### How It Works

1. User submits the login form
2. Element sends `@request('login-user')` with credentials
3. Controller receives request via `@respond('login-user')`
4. Controller validates, authenticates, and returns result
5. Element processes response and updates UI

### Request Payload

The element sends a `LoginCredentials` object:

```typescript
interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;  // If showRememberMe is enabled
}
```

### Response Payload

The controller must return a `LoginResult` object:

```typescript
interface LoginResult {
  success: boolean;    // Whether authentication succeeded
  error?: string;      // Error message if failed
  data?: any;          // Additional data (user, token, etc.)
}
```

### Creating an Authentication Controller

```typescript
import { controller, respond, IController } from 'snice';
import type { LoginCredentials, LoginResult } from 'snice/components/login/snice-login.types';

@controller('auth-controller')
export class AuthController implements IController {
  async attach(element: HTMLElement) {
    console.log('Auth controller attached');
  }

  async detach(element: HTMLElement) {
    console.log('Auth controller detached');
  }

  @respond('login-user')
  async handleLogin(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      // Validate credentials
      if (!credentials.username || !credentials.password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      // Make API call to authenticate
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const data = await response.json();

      // Store authentication token
      if (credentials.remember) {
        localStorage.setItem('authToken', data.token);
      } else {
        sessionStorage.setItem('authToken', data.token);
      }

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'Authentication service unavailable'
      };
    }
  }
}
```

### Using the Controller

```html
<!-- Import the controller -->
<script type="module">
  import './auth-controller.ts';
  import 'snice/components/login/snice-login';
</script>

<!-- Connect login to controller -->
<snice-login
  controller="auth-controller"
  title="Welcome Back"
  show-remember-me
  show-forgot-password>
</snice-login>

<!-- Handle success with events -->
<script type="module">
  const login = document.querySelector('snice-login');

  login.addEventListener('login-success', () => {
    window.location.href = '/dashboard';
  });

  login.addEventListener('login-error', (e) => {
    console.error('Login failed:', e.detail.error);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'card' \| 'minimal'` | `'default'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Form size |
| `title` | `string` | `'Sign In'` | Form title |
| `disabled` | `boolean` | `false` | Disable the form |
| `loading` | `boolean` | `false` | Show loading state |
| `showRememberMe` | `boolean` | `true` | Show "Remember me" checkbox |
| `showForgotPassword` | `boolean` | `true` | Show "Forgot password" link |
| `actionText` | `string` | `'Sign In'` | Submit button text |

## Methods

#### `login(credentials?: LoginCredentials): Promise<LoginResult>`

Programmatically trigger login. If credentials are not provided, uses form values.

```typescript
const loginElement = document.querySelector('snice-login');

// Use form values
const result = await loginElement.login();

// Or provide credentials directly
const result = await loginElement.login({
  username: 'user@example.com',
  password: 'password123',
  remember: true
});

if (result.success) {
  console.log('Logged in:', result.data);
} else {
  console.error('Login failed:', result.error);
}
```

#### `reset(): void`

Clear the form, remove any error messages, and reset loading state.

```typescript
loginElement.reset();
```

#### `setError(message: string): void`

Display an error message.

```typescript
loginElement.setError('Invalid credentials. Please try again.');
```

#### `clearError(): void`

Remove any displayed error message.

```typescript
loginElement.clearError();
```

#### `setCredentials(credentials: Partial<LoginCredentials>): void`

Set form field values programmatically.

```typescript
loginElement.setCredentials({
  username: 'user@example.com',
  password: 'pass123',
  remember: true
});
```

## Events

Events are dispatched as a fallback for non-Snice frameworks or when using the login component without a controller.

### `login-attempt`

Dispatched when the user submits the login form.

```typescript
detail: {
  username: string;
  timestamp: string;
}
```

### `login-success`

Dispatched when login succeeds.

```typescript
detail: {
  timestamp: string;
}
```

### `login-error`

Dispatched when login fails.

```typescript
detail: {
  error: string;
  timestamp: string;
}
```

### `login-forgot-password`

Dispatched when the user clicks "Forgot password?".

```typescript
detail: {
  timestamp: string;
}
```

### Event Usage Example

```html
<snice-login id="login"></snice-login>

<script type="module">
  const login = document.getElementById('login');

  login.addEventListener('login-attempt', (e) => {
    console.log('Login attempt for:', e.detail.username);
  });

  login.addEventListener('login-success', async () => {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  });

  login.addEventListener('login-error', (e) => {
    // Show error notification
    console.error('Login failed:', e.detail.error);
  });

  login.addEventListener('login-forgot-password', () => {
    // Navigate to password reset
    window.location.href = '/forgot-password';
  });
</script>
```

## Slots

Customize the login form with named slots:

| Slot | Description |
|------|-------------|
| `before-header` | Content before the header |
| `after-header` | Content after the header |
| `subtitle` | Custom subtitle (default: "Enter your credentials to continue") |
| `before-form` | Content before the form |
| `after-form` | Content after the form |
| `form-top` | Content at top of form |
| `between-fields` | Content between username and password fields |
| `before-submit` | Content before submit button |
| `after-submit` | Content after submit button |
| `footer` | Footer content (e.g., signup link) |

## Examples

### Card Variant

```html
<snice-login
  variant="card"
  controller="auth-controller"
  title="Admin Portal"
  action-text="Access Portal">

  <p slot="subtitle">Administrator access required</p>
</snice-login>
```

### Minimal Variant

```html
<snice-login
  variant="minimal"
  size="small"
  title="Quick Sign In"
  action-text="Continue"
  show-forgot-password="false"
  controller="auth-controller">
</snice-login>
```

### Custom Footer

```html
<snice-login controller="auth-controller">
  <div slot="footer">
    <p>Don't have an account?</p>
    <a href="/signup">Sign up here</a>
  </div>
</snice-login>
```

### Without Controller (Event-Based)

When not using a controller, handle authentication manually with events:

```html
<snice-login id="manual-login"></snice-login>

<script type="module">
  import 'snice/components/login/snice-login';

  const login = document.getElementById('manual-login');

  login.addEventListener('login-attempt', async (e) => {
    const { username } = e.detail;

    // Get form data
    const formData = {
      username: login.querySelector('input[name="username"]').value,
      password: login.querySelector('input[name="password"]').value,
      remember: login.querySelector('input[name="remember"]')?.checked
    };

    // Show loading
    login.loading = true;
    login.clearError();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      // Store token
      if (formData.remember) {
        localStorage.setItem('authToken', data.token);
      } else {
        sessionStorage.setItem('authToken', data.token);
      }

      // Success
      window.location.href = '/dashboard';

    } catch (error) {
      login.setError(error.message);
    } finally {
      login.loading = false;
    }
  });

  login.addEventListener('login-forgot-password', () => {
    window.location.href = '/forgot-password';
  });
</script>
```

### Multi-Step Authentication

```html
<snice-login
  id="mfa-login"
  controller="auth-controller"
  title="Sign In">
</snice-login>

<script type="module">
  const login = document.getElementById('mfa-login');

  login.addEventListener('login-success', async (e) => {
    // Check if MFA is required
    const session = JSON.parse(sessionStorage.getItem('authSession'));

    if (session.requiresMFA) {
      // Redirect to MFA verification
      window.location.href = '/verify-mfa';
    } else {
      // Direct to dashboard
      window.location.href = '/dashboard';
    }
  });
</script>
```

### OAuth Integration

```html
<snice-login controller="auth-controller">
  <div slot="before-form">
    <button class="oauth-button" onclick="loginWithGoogle()">
      <img src="/icons/google.svg" alt="Google">
      Continue with Google
    </button>

    <button class="oauth-button" onclick="loginWithGitHub()">
      <img src="/icons/github.svg" alt="GitHub">
      Continue with GitHub
    </button>

    <div class="divider">
      <span>or sign in with email</span>
    </div>
  </div>
</snice-login>

<script>
  function loginWithGoogle() {
    window.location.href = '/api/auth/google';
  }

  function loginWithGitHub() {
    window.location.href = '/api/auth/github';
  }
</script>
```

### Custom Styling

```html
<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  snice-login {
    width: 100%;
    max-width: 400px;
  }
</style>

<div class="login-container">
  <snice-login
    variant="card"
    size="large"
    controller="auth-controller"
    title="Welcome Back">

    <p slot="subtitle">Sign in to continue to your account</p>

    <div slot="footer" style="text-align: center; margin-top: 1rem;">
      <p style="color: #6b7280; font-size: 0.875rem;">
        Don't have an account?
        <a href="/signup" style="color: #3b82f6; text-decoration: none;">
          Sign up
        </a>
      </p>
    </div>
  </snice-login>
</div>
```

### Loading States

```html
<snice-login id="loading-demo" controller="auth-controller"></snice-login>

<script type="module">
  const login = document.getElementById('loading-demo');

  login.addEventListener('login-attempt', () => {
    // Automatically set to loading by component
    console.log('Login in progress...');
  });

  // Manually trigger loading (if needed)
  login.loading = true;

  // Disable form during maintenance
  login.disabled = true;
  login.setError('Login is temporarily unavailable for maintenance.');
</script>
```

## Accessibility

- **Keyboard support**: Full keyboard navigation with Tab and Enter
- **Form semantics**: Proper form, label, and input associations
- **ARIA attributes**: Screen reader support with proper roles
- **Autocomplete**: username and current-password autocomplete attributes
- **Focus management**: Clear focus indicators for all interactive elements
- **Error handling**: Error messages announced to screen readers

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Always use a controller**: The @request/@respond pattern provides better separation of concerns
2. **Secure authentication**: Never store passwords in plain text, always use HTTPS
3. **Provide clear feedback**: Use loading states and error messages to guide users
4. **Handle forgot password**: Implement password reset flow for better UX
5. **Consider MFA**: Add multi-factor authentication for sensitive applications
6. **Token storage**: Use localStorage for "remember me", sessionStorage otherwise
7. **Error messages**: Be specific but don't reveal whether username or password was wrong
8. **Rate limiting**: Implement server-side rate limiting to prevent brute force
9. **Keyboard accessibility**: Ensure all functionality works without a mouse
10. **Mobile responsive**: Test on mobile devices and adjust sizes accordingly

## Related Components

- **snice-button**: Used internally for submit button
- **snice-alert**: Used internally for error/success messages
- **snice-input**: Consider for custom input styling
- **snice-modal**: Can be combined for modal login dialogs

## Learn More

- [Request/Response Pattern Documentation](../request-response.md)
- [Controllers Documentation](../controllers.md)
- [Events Documentation](../events.md)
