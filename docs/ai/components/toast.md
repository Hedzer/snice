# snice-toast & snice-toast-container

Temporary notification system with static API.

## Components

### snice-toast

Individual toast notification element.

```typescript
type: 'success'|'error'|'warning'|'info' = 'info';
message: string = '';
closable: boolean = true;
icon: boolean = true;
```

**Methods:**
- `hide()` - Start hide animation

### snice-toast-container

Manages and positions multiple toasts.

```typescript
position: 'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right' = 'bottom-center';
```

**Methods:**
- `show(message, options?)` - Show toast, returns ID
- `hide(id)` - Hide specific toast
- `clear()` - Remove all toasts

## Static API (Recommended)

```typescript
import Toast from 'snice/components/toast/snice-toast-container';

// Convenience methods
Toast.success(message, options?): Promise<string>
Toast.error(message, options?): Promise<string>
Toast.warning(message, options?): Promise<string>
Toast.info(message, options?): Promise<string>

// Generic
Toast.show(message, options?): Promise<string>

// Control
Toast.hide(id): void
Toast.clear(): void
```

## Toast Options

```typescript
interface ToastOptions {
  type?: 'success'|'error'|'warning'|'info';  // Default: 'info'
  duration?: number;      // ms, 0 = no auto-dismiss, default: 4000
  position?: ToastPosition;  // Only for static API
  closable?: boolean;     // Default: true
  icon?: boolean;         // Default: true
  id?: string;            // Custom ID, auto-generated if omitted
}
```

## Usage

```typescript
// Basic
Toast.success('Saved successfully');
Toast.error('Failed to load');
Toast.warning('Low disk space');
Toast.info('5 new messages');

// With options
Toast.show('Custom', {
  type: 'success',
  duration: 5000,
  position: 'top-right',
  closable: true,
  icon: false
});

// Manual control
const id = Toast.info('Loading...', { duration: 0 });
await operation();
Toast.hide(id);
Toast.success('Complete');

// Clear all
Toast.clear();
```

## Container Usage

```html
<snice-toast-container position="bottom-center"></snice-toast-container>
```

```typescript
const container = document.querySelector('snice-toast-container');
const id = container.show('Message', { type: 'success' });
container.hide(id);
container.clear();
```

## Features

- Auto-dismiss after duration (default 4s)
- 4 types with icons and colors
- 6 position options
- Slide in/out animations (300ms)
- Global container auto-creation
- Top positions prepend, bottom append
- Accessibility: role="alert", aria-live="polite"
- Close button keyboard accessible

## Patterns

**Success/Error:**
```typescript
try {
  await action();
  Toast.success('Done');
} catch (e) {
  Toast.error(e.message);
}
```

**Loading:**
```typescript
const id = Toast.info('Loading...', { duration: 0 });
await fetch();
Toast.hide(id);
```

**Persistent:**
```typescript
Toast.show('Manual close only', { duration: 0 });
```
