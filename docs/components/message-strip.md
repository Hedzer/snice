<!-- AI: For a low-token version of this doc, use docs/ai/components/message-strip.md instead -->

# Message Strip Component
`<snice-message-strip>`

An inline contextual message bar for displaying status messages within content flow. Unlike alerts (dismissable card), banners (full-width top), and toasts (floating), message strips are designed to sit inline within your content.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/message-strip/snice-message-strip';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-message-strip.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | Message type / color |
| `dismissable` | `boolean` | `false` | Show dismiss button |
| `icon` | `string` | `''` | Custom icon (set "none" to hide) |

## Methods

#### `show(): void`
Show the message strip after it has been hidden.

#### `hide(): void`
Hide the message strip with a slide-out animation.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `dismiss` | `{ variant: string }` | Fired when dismiss button is clicked |

## Slots

| Name | Description |
|------|-------------|
| (default) | Message content |
| `icon` | Custom icon element |

## CSS Parts

| Part | Description |
|------|-------------|
| `icon` | The icon container |
| `content` | The message content area |
| `dismiss` | The dismiss button |

```css
snice-message-strip::part(content) {
  font-weight: 500;
}

snice-message-strip::part(dismiss) {
  opacity: 0.8;
}
```

## Basic Usage

```typescript
import 'snice/components/message-strip/snice-message-strip';
```

```html
<snice-message-strip variant="info">This is an informational message.</snice-message-strip>
```

## Examples

### Variants

Use the `variant` attribute to indicate the message type.

```html
<snice-message-strip variant="info">This is an informational message.</snice-message-strip>
<snice-message-strip variant="success">Operation completed successfully.</snice-message-strip>
<snice-message-strip variant="warning">Please review your changes.</snice-message-strip>
<snice-message-strip variant="danger">An error occurred while saving.</snice-message-strip>
```

### Dismissable

Set the `dismissable` attribute to allow users to close the message.

```html
<snice-message-strip variant="info" dismissable>
  You can dismiss this message.
</snice-message-strip>
```

```typescript
messageStrip.addEventListener('dismiss', (e) => {
  console.log(`Dismissed: ${e.detail.variant}`);
});
```

### Custom Icons

Use the `icon` attribute for a custom icon, or set it to "none" to hide the default icon.

```html
<!-- Custom emoji icon -->
<snice-message-strip variant="info" icon="🔔">
  You have 3 new notifications.
</snice-message-strip>

<!-- No icon -->
<snice-message-strip variant="info" icon="none">
  Message without an icon.
</snice-message-strip>
```

### Slotted Icon

Use the `icon` slot for custom icon elements.

```html
<snice-message-strip variant="success">
  <svg slot="icon" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
  File uploaded successfully.
</snice-message-strip>
```

### Programmatic Show/Hide

```html
<snice-message-strip variant="success">
  Your changes have been saved.
</snice-message-strip>
```

```typescript
messageStrip.hide();
messageStrip.show();
```

### Form Validation Context

```html
<form>
  <snice-message-strip variant="danger" dismissable style="display: none;">
    Please fill in all required fields.
  </snice-message-strip>

  <input type="text" required>
  <button type="submit">Submit</button>
</form>
```

```typescript
form.addEventListener('submit', (e) => {
  if (!form.checkValidity()) {
    e.preventDefault();
    errorStrip.style.display = '';
    errorStrip.show();
  }
});
```

### Stacked Messages

```html
<div style="display: flex; flex-direction: column; gap: 8px;">
  <snice-message-strip variant="danger" dismissable>
    Server connection lost.
  </snice-message-strip>
  <snice-message-strip variant="warning" dismissable>
    Your session will expire in 5 minutes.
  </snice-message-strip>
  <snice-message-strip variant="info">
    New version available.
  </snice-message-strip>
</div>
```

## Accessibility

- Uses `role="status"` with `aria-live="polite"` for screen readers
- Dismiss button has `aria-label="Dismiss"`
- Default variant icons provide visual context clues
- Supports both light and dark color schemes

## When to Use Which

| Component | Use Case |
|-----------|----------|
| **Message Strip** | Inline contextual feedback within content |
| **Alert** | Prominent dismissable card-style notification |
| **Banner** | Full-width message at the top of the page |
| **Toast** | Floating temporary notification |
