# snice-login

Login form component with username, password, and optional features.

## Properties

```typescript
variant: 'default'|'card'|'minimal' = 'default';
size: 'small'|'medium'|'large' = 'medium';
title: string = '';
disabled: boolean = false;
loading: boolean = false;
showRememberMe: boolean = false;
showForgotPassword: boolean = false;
actionText: string = 'Login';
```

## Methods

- `login(credentials)` - Programmatic login, returns {success, error?, data?}
- `reset()` - Clear form
- `setError(message)` - Display error message
- `clearError()` - Clear error message

## Events

- `submit` - {username, password, remember}
- `forgot-password` - User clicked forgot password link

## Usage

```html
<!-- Basic -->
<snice-login title="Sign In"></snice-login>

<!-- Variants -->
<snice-login variant="card"></snice-login>
<snice-login variant="minimal"></snice-login>

<!-- With remember me and forgot password -->
<snice-login show-remember-me show-forgot-password></snice-login>

<!-- Custom action text -->
<snice-login action-text="Sign In"></snice-login>

<!-- Loading state -->
<snice-login loading></snice-login>

<!-- Disabled -->
<snice-login disabled></snice-login>

<!-- Sizes -->
<snice-login size="small"></snice-login>
<snice-login size="medium"></snice-login>
<snice-login size="large"></snice-login>

<!-- Event handling -->
<snice-login id="login"></snice-login>
<script>
const login = document.querySelector('#login');

login.addEventListener('submit', async (e) => {
  const {username, password, remember} = e.detail;

  login.loading = true;
  const result = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({username, password})
  });

  if (!result.ok) {
    login.setError('Invalid credentials');
    login.loading = false;
  } else {
    window.location = '/dashboard';
  }
});

login.addEventListener('forgot-password', () => {
  window.location = '/forgot-password';
});
</script>

<!-- Programmatic login -->
<script>
const result = await login.login({
  username: 'user@example.com',
  password: 'password123',
  remember: true
});

if (result.success) {
  console.log('Logged in:', result.data);
} else {
  console.error('Login failed:', result.error);
}
</script>
```

## Features

- 3 visual variants (default/card/minimal)
- 3 sizes
- Optional remember me checkbox
- Optional forgot password link
- Loading and disabled states
- Error message display
- Programmatic and event-based submission
- Keyboard accessible (Enter to submit)
