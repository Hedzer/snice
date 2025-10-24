# Toast Components

The toast notification system provides temporary, non-blocking messages to users. It consists of two components and a static API for programmatic toast creation.

## Table of Contents
- [Components](#components)
- [Basic Usage](#basic-usage)
- [Static API](#static-api)
- [Properties](#properties)
- [Methods](#methods)
- [Examples](#examples)

## Components

### `<snice-toast>`
Individual toast notification element.

### `<snice-toast-container>`
Container that manages and positions multiple toast notifications.

## Basic Usage

### Using the Static API (Recommended)

```typescript
import Toast from 'snice/components/toast/snice-toast-container';

// Show different toast types
Toast.success('Operation completed successfully!');
Toast.error('An error occurred');
Toast.warning('Please review your input');
Toast.info('New update available');

// With options
Toast.show('Custom message', {
  type: 'success',
  duration: 5000,
  position: 'top-right',
  closable: true,
  icon: true
});
```

### Using Container Element

```html
<snice-toast-container id="toaster" position="bottom-center"></snice-toast-container>

<script type="module">
  import 'snice/components/toast/snice-toast-container';

  const container = document.querySelector('#toaster');

  // Show a toast
  const id = container.show('Hello, world!', { type: 'success' });

  // Hide specific toast
  container.hide(id);

  // Clear all toasts
  container.clear();
</script>
```

## Static API

### `Toast.show(message, options?): Promise<string>`
Show a toast with any type.

```typescript
const id = await Toast.show('Message', {
  type: 'info',
  duration: 4000,
  position: 'bottom-center',
  closable: true,
  icon: true
});
```

### `Toast.success(message, options?): Promise<string>`
Show a success toast (green).

```typescript
await Toast.success('Profile updated successfully');
```

### `Toast.error(message, options?): Promise<string>`
Show an error toast (red).

```typescript
await Toast.error('Failed to save changes');
```

### `Toast.warning(message, options?): Promise<string>`
Show a warning toast (orange).

```typescript
await Toast.warning('Your session will expire soon');
```

### `Toast.info(message, options?): Promise<string>`
Show an info toast (blue).

```typescript
await Toast.info('5 new messages');
```

### `Toast.hide(id: string): void`
Hide a specific toast by its ID.

```typescript
const id = await Toast.show('Saving...');
// Later...
Toast.hide(id);
```

### `Toast.clear(): void`
Clear all visible toasts.

```typescript
Toast.clear();
```

## Properties

### Toast Container

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `ToastPosition` | `'bottom-center'` | Container position on screen |

**ToastPosition:**
- `'top-left'`
- `'top-center'`
- `'top-right'`
- `'bottom-left'`
- `'bottom-center'`
- `'bottom-right'`

### Individual Toast

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `ToastType` | `'info'` | Visual style of toast |
| `message` | `string` | `''` | Toast message text |
| `closable` | `boolean` | `true` | Show close button |
| `icon` | `boolean` | `true` | Show type icon |

**ToastType:**
- `'success'` - Green, checkmark icon
- `'error'` - Red, error icon
- `'warning'` - Orange, warning icon
- `'info'` - Blue, info icon

## Methods

### Container Methods

#### `show(message: string, options?: ToastOptions): string`
Show a new toast and return its ID.

```typescript
const id = container.show('Success!', {
  type: 'success',
  duration: 3000,
  closable: true,
  icon: true,
  id: 'custom-id' // Optional custom ID
});
```

**ToastOptions:**
```typescript
interface ToastOptions {
  type?: ToastType;        // Default: 'info'
  duration?: number;       // ms, 0 for no auto-dismiss, default: 4000
  position?: ToastPosition; // Only used with static API
  closable?: boolean;      // Default: true
  icon?: boolean;          // Default: true
  id?: string;             // Custom ID, auto-generated if not provided
}
```

#### `hide(id: string): void`
Hide a specific toast by ID.

```typescript
container.hide('toast-1');
```

#### `clear(): void`
Remove all toasts from the container.

```typescript
container.clear();
```

### Toast Methods

#### `hide(): void`
Start the hide animation for this toast.

```typescript
toast.hide();
```

## Examples

### Basic Notifications

```typescript
import Toast from 'snice/components/toast/snice-toast-container';

// Success notification
document.querySelector('#saveBtn').addEventListener('click', async () => {
  try {
    await saveData();
    Toast.success('Changes saved successfully');
  } catch (error) {
    Toast.error('Failed to save changes');
  }
});

// Info notification
Toast.info('Welcome back, John!');

// Warning notification
if (diskSpace < 10) {
  Toast.warning('Low disk space');
}
```

### Custom Duration

```typescript
// Short toast (2 seconds)
Toast.show('Quick message', { duration: 2000 });

// Long toast (10 seconds)
Toast.show('Important message', { duration: 10000 });

// Persistent toast (no auto-dismiss)
const id = Toast.show('Click X to close', { duration: 0 });
```

### Position Variants

```html
<button onclick="Toast.show('Top Left', { position: 'top-left' })">
  Top Left
</button>
<button onclick="Toast.show('Top Center', { position: 'top-center' })">
  Top Center
</button>
<button onclick="Toast.show('Top Right', { position: 'top-right' })">
  Top Right
</button>
<button onclick="Toast.show('Bottom Left', { position: 'bottom-left' })">
  Bottom Left
</button>
<button onclick="Toast.show('Bottom Center', { position: 'bottom-center' })">
  Bottom Center
</button>
<button onclick="Toast.show('Bottom Right', { position: 'bottom-right' })">
  Bottom Right
</button>
```

### Manual Control

```typescript
// Show loading toast
const loadingId = Toast.info('Loading data...', { duration: 0 });

// Fetch data
const data = await fetchData();

// Hide loading toast
Toast.hide(loadingId);

// Show success
Toast.success('Data loaded');
```

### Without Icon

```typescript
Toast.show('Plain message', { icon: false });
```

### Non-Closable

```typescript
Toast.show('Cannot be closed manually', {
  closable: false,
  duration: 3000 // Will auto-dismiss
});
```

### Multiple Containers

```html
<snice-toast-container id="alerts" position="top-right"></snice-toast-container>
<snice-toast-container id="messages" position="bottom-left"></snice-toast-container>

<script type="module">
  import 'snice/components/toast/snice-toast-container';

  const alerts = document.querySelector('#alerts');
  const messages = document.querySelector('#messages');

  alerts.show('System alert', { type: 'warning' });
  messages.show('New message', { type: 'info' });
</script>
```

### Form Validation

```typescript
const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  // Validate
  if (!formData.get('email')) {
    Toast.error('Email is required');
    return;
  }

  if (!formData.get('password')) {
    Toast.error('Password is required');
    return;
  }

  // Show loading
  const loadingId = Toast.info('Submitting...', { duration: 0 });

  try {
    await submitForm(formData);
    Toast.hide(loadingId);
    Toast.success('Form submitted successfully');
  } catch (error) {
    Toast.hide(loadingId);
    Toast.error(error.message);
  }
});
```

### File Upload Progress

```typescript
async function uploadFile(file) {
  const uploadId = Toast.info(`Uploading ${file.name}...`, { duration: 0 });

  try {
    await upload(file);
    Toast.hide(uploadId);
    Toast.success(`${file.name} uploaded`);
  } catch (error) {
    Toast.hide(uploadId);
    Toast.error(`Failed to upload ${file.name}`);
  }
}
```

### Batch Operations

```typescript
async function deleteMultiple(ids) {
  Toast.info(`Deleting ${ids.length} items...`);

  const results = await Promise.allSettled(
    ids.map(id => deleteItem(id))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  if (succeeded > 0) {
    Toast.success(`Deleted ${succeeded} items`);
  }

  if (failed > 0) {
    Toast.error(`Failed to delete ${failed} items`);
  }
}
```

### Undo Action

```typescript
let undoTimeout;

function deleteItem(id) {
  const item = getItem(id);
  item.deleted = true;

  const toastId = Toast.warning('Item deleted', {
    duration: 5000,
    closable: false
  });

  // Create undo button
  setTimeout(() => {
    Toast.hide(toastId);
    Toast.show('Click to undo', {
      duration: 5000,
      type: 'info'
    });
  }, 100);

  undoTimeout = setTimeout(() => {
    permanentlyDelete(id);
  }, 5000);
}

function undo() {
  clearTimeout(undoTimeout);
  item.deleted = false;
  Toast.success('Deletion cancelled');
}
```

### Network Status

```typescript
window.addEventListener('online', () => {
  Toast.success('Back online');
});

window.addEventListener('offline', () => {
  Toast.error('No internet connection', { duration: 0 });
});
```

## Accessibility

- **role="alert"**: Each toast has `role="alert"` to announce to screen readers
- **aria-live="polite"**: Non-intrusive announcements
- **Close button**: Keyboard accessible with aria-label
- **Focus management**: Close button receives focus when interacted with

## Behavior

### Auto-Dismiss
- Default duration: 4000ms (4 seconds)
- Set `duration: 0` to disable auto-dismiss
- Toast fades out with animation before removal

### Positioning
- **Top positions**: New toasts appear at top (newest first)
- **Bottom positions**: New toasts appear at bottom (newest last)

### Animation
- Slide in from top/bottom based on position
- Slide out when closing
- 300ms animation duration

### Global Container
- Static API automatically creates/reuses a global container
- First container element becomes the global container
- Position can be changed dynamically

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Keep messages short**: Toasts should be scannable at a glance
2. **Use appropriate types**: Match the toast type to the message severity
3. **Set reasonable durations**: 2-5 seconds for normal messages
4. **Avoid too many toasts**: Clear old toasts before showing many new ones
5. **Don't rely solely on color**: Icons help distinguish toast types
6. **Provide actions when needed**: Use persistent toasts with manual dismiss for important actions
7. **Position consistently**: Choose one primary position for your app's toasts

## Common Patterns

### Success/Error Pattern
```typescript
try {
  await action();
  Toast.success('Success message');
} catch (error) {
  Toast.error(error.message);
}
```

### Loading Pattern
```typescript
const id = Toast.info('Loading...', { duration: 0 });
await operation();
Toast.hide(id);
Toast.success('Complete');
```

### Temporary Undo Pattern
```typescript
const id = Toast.warning('Item deleted. Click to undo', { duration: 5000 });
// Provide undo mechanism within 5 seconds
```
