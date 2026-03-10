# snice-message-strip

Inline contextual message bar within content flow. Differs from alert (card), banner (full-width), toast (floating).

## Properties

```ts
variant: 'info'|'success'|'warning'|'danger' = 'info';
dismissable: boolean = false;
icon: string = '';  // Custom icon (set "none" to hide)
```

## Methods

- `show()` → Show the message strip
- `hide()` → Hide with slide-out animation

## Events

- `dismiss` → `{ variant: string }`

## Slots

- `(default)` - Message content
- `icon` - Custom icon element

## CSS Parts

- `icon` - Icon container
- `content` - Message content area
- `dismiss` - Dismiss button

## Basic Usage

```typescript
import 'snice/components/message-strip/snice-message-strip';
```

```html
<!-- Variants -->
<snice-message-strip variant="info">Informational message.</snice-message-strip>
<snice-message-strip variant="success">Operation completed.</snice-message-strip>
<snice-message-strip variant="warning">Review your changes.</snice-message-strip>
<snice-message-strip variant="danger">An error occurred.</snice-message-strip>

<!-- Dismissable -->
<snice-message-strip variant="info" dismissable>You can close this.</snice-message-strip>

<!-- Custom icon -->
<snice-message-strip variant="info" icon="🔔">New notification.</snice-message-strip>

<!-- No icon -->
<snice-message-strip variant="info" icon="none">No icon shown.</snice-message-strip>
```

```typescript
messageStrip.hide();
messageStrip.show();
```
