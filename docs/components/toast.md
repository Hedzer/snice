<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/toast.md -->

# Toast
`<snice-toast-container>`

Temporary, non-blocking notification messages. Includes a static `Toast` API for programmatic creation.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Components

| Component | Description |
|-----------|-------------|
| `<snice-toast-container>` | Container that positions and manages toast notifications |
| `<snice-toast>` | Individual toast notification element |

## Properties

### snice-toast-container

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-center'` | Position on screen |

### snice-toast

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Visual style |
| `message` | `string` | `''` | Toast message text |
| `closable` | `boolean` | `true` | Show close button |
| `icon` | `boolean` | `true` | Show type icon |

## Methods

### Static API (Toast class)

| Method | Arguments | Description |
|--------|-----------|-------------|
| `Toast.show()` | `message: string, options?: ToastOptions` | Show toast, returns `Promise<string>` (ID) |
| `Toast.success()` | `message: string, options?: ToastOptions` | Show success toast |
| `Toast.error()` | `message: string, options?: ToastOptions` | Show error toast |
| `Toast.warning()` | `message: string, options?: ToastOptions` | Show warning toast |
| `Toast.info()` | `message: string, options?: ToastOptions` | Show info toast |
| `Toast.hide()` | `id: string` | Hide specific toast |
| `Toast.clear()` | -- | Clear all toasts |

### Container Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | `message: string, options?: ToastOptions` | Show toast, returns `string` (ID) |
| `hide()` | `id: string` | Hide specific toast |
| `clear()` | -- | Clear all toasts |

### ToastOptions

```typescript
interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;       // ms, 0 = no auto-dismiss, default: 4000
  position?: ToastPosition;
  closable?: boolean;      // default: true
  icon?: boolean;          // default: true
  id?: string;             // custom ID
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `close-toast` | `{ id: string }` | Toast close button clicked |

## CSS Parts

### snice-toast

| Part | Description |
|------|-------------|
| `base` | Outer toast container (includes type modifier class) |
| `icon` | Wrapper around the type-specific SVG icon |
| `content` | The message text element |

## Basic Usage

```typescript
import Toast from 'snice/components/toast/snice-toast-container';
```

```typescript
Toast.success('Operation completed successfully!');
Toast.error('An error occurred');
Toast.warning('Please review your input');
Toast.info('New update available');
```

## Examples

### Static API

Use the static `Toast` class for the simplest usage. A container is created automatically.

```typescript
Toast.success('Profile updated');
Toast.error('Failed to save changes');
Toast.warning('Session expires soon');
Toast.info('5 new messages');
```

### Custom Options

Pass options to control duration, position, and appearance.

```typescript
Toast.show('Custom message', {
  type: 'success',
  duration: 5000,
  position: 'top-right',
  closable: true,
  icon: true
});
```

### Loading Pattern

Show a persistent toast during an async operation, then replace it.

```typescript
const id = await Toast.info('Loading...', { duration: 0 });
await fetchData();
Toast.hide(id);
Toast.success('Data loaded');
```

### Position Variants

Use the `position` option to place toasts anywhere on screen.

```typescript
Toast.show('Top Left', { position: 'top-left' });
Toast.show('Top Center', { position: 'top-center' });
Toast.show('Top Right', { position: 'top-right' });
Toast.show('Bottom Left', { position: 'bottom-left' });
Toast.show('Bottom Center', { position: 'bottom-center' });
Toast.show('Bottom Right', { position: 'bottom-right' });
```

### Container Element

Use a container element directly for more control.

```html
<snice-toast-container position="bottom-center"></snice-toast-container>
```

```typescript
const id = container.show('Hello!', { type: 'success' });
container.hide(id);
container.clear();
```
