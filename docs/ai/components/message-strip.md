# snice-message-strip

Inline contextual message bar within content flow. Differs from alert (dismissable card), banner (full-width top), toast (floating).

## Properties

```typescript
variant: 'info'|'success'|'warning'|'danger' = 'info';
dismissable: boolean = false;
icon: string = '';  // Custom icon (set "none" to hide)
```

## Slots

- `(default)` - Message content
- `icon` - Custom icon element

## Events

- `dismiss` → `{ variant: string }`

## Methods

- `show()` - Show the message strip
- `hide()` - Hide with animation

## Usage

```html
<!-- Basic -->
<snice-message-strip variant="info">Informational message.</snice-message-strip>

<!-- Variants -->
<snice-message-strip variant="success">Operation completed.</snice-message-strip>
<snice-message-strip variant="warning">Review your changes.</snice-message-strip>
<snice-message-strip variant="danger">An error occurred.</snice-message-strip>

<!-- Dismissable -->
<snice-message-strip variant="info" dismissable>You can close this.</snice-message-strip>

<!-- Custom icon -->
<snice-message-strip variant="info" icon="🔔">New notification.</snice-message-strip>

<!-- No icon -->
<snice-message-strip variant="info" icon="none">No icon shown.</snice-message-strip>

<!-- Programmatic -->
<snice-message-strip id="msg">Message</snice-message-strip>
<script>
  document.getElementById('msg').hide();
  document.getElementById('msg').show();
</script>
```

**CSS Parts:**
- `icon` - The icon container
- `content` - The message content area
- `dismiss` - The dismiss button
