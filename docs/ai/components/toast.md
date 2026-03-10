# snice-toast & snice-toast-container

Temporary notification system with static API.

## Components

- `<snice-toast-container>` - Positions and manages toasts
- `<snice-toast>` - Individual toast notification

## snice-toast-container

```typescript
position: 'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right' = 'bottom-center';
```

## snice-toast

```typescript
type: 'success'|'error'|'warning'|'info' = 'info';
message: string = '';
closable: boolean = true;
icon: boolean = true;
```

## Static API

```typescript
import Toast from 'snice/components/toast/snice-toast-container';

Toast.success(message, options?): Promise<string>
Toast.error(message, options?): Promise<string>
Toast.warning(message, options?): Promise<string>
Toast.info(message, options?): Promise<string>
Toast.show(message, options?): Promise<string>
Toast.hide(id): void
Toast.clear(): void
```

## ToastOptions

```typescript
interface ToastOptions {
  type?: 'success'|'error'|'warning'|'info';
  duration?: number;       // ms, 0 = no auto-dismiss, default: 4000
  position?: ToastPosition;
  closable?: boolean;
  icon?: boolean;
  id?: string;
}
```

## Methods (container instance)

- `show(message, options?)` - Show toast, returns ID
- `hide(id)` - Hide specific toast
- `clear()` - Remove all toasts

## Events (snice-toast)

- `close-toast` -> `{ id: string }` - Close button clicked

## CSS Parts (snice-toast)

- `base` - Outer toast div (has type modifier class)
- `icon` - Icon span wrapper
- `content` - Message text span

## Basic Usage

```typescript
Toast.success('Saved successfully');
Toast.error('Failed to load');
Toast.warning('Low disk space');

Toast.show('Custom', { type: 'success', duration: 5000, position: 'top-right' });

const id = await Toast.info('Loading...', { duration: 0 });
await operation();
Toast.hide(id);
```

```html
<snice-toast-container position="bottom-center"></snice-toast-container>
```
