<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/notification-center.md -->

# Notification Center
`<snice-notification-center>`

A bell icon with a dropdown notification panel. Displays an unread count badge, supports marking notifications as read, and allows dismissing individual items.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `notifications` | `NotificationItem[]` | `[]` | Array of notification objects to display (set via JS) |
| `open` | `boolean` | `false` | Whether the dropdown panel is visible |
| `icon` | `string` | `''` | Custom bell icon (URL, image file, or emoji). Use slot for icon fonts. |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `markAsRead()` | `id: string` | Mark a single notification as read by its ID |
| `markAllAsRead()` | -- | Mark all notifications as read |
| `dismiss()` | `id: string` | Remove a notification from the list by its ID |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `notification-click` | `{ notification: NotificationItem }` | Fired when a notification item is clicked |
| `notification-dismiss` | `{ id: string }` | Fired when a notification is dismissed |
| `notification-read-all` | `void` | Fired when all notifications are marked as read |

## Slots

| Name | Description |
|------|-------------|
| `icon` | Custom bell icon content. Overrides the `icon` property. Useful for icon fonts. |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `trigger` | `<button>` | The bell icon button |
| `icon` | `<span>` | The bell icon span |
| `panel` | `<div>` | The dropdown notification panel |
| `panel-header` | `<div>` | The panel header with title and mark-all-read action |

```css
snice-notification-center::part(trigger) {
  font-size: 1.5rem;
}

snice-notification-center::part(panel) {
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
```

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-color-primary` | Mark-all-read link color and unread highlight |
| `--snice-color-primary-subtle` | Unread item background |
| `--snice-color-danger` | Badge background and dismiss hover color |
| `--snice-color-text-inverse` | Badge text color |
| `--snice-color-text-secondary` | Message text color |
| `--snice-color-text-tertiary` | Timestamp, empty state text, and dismiss icon color |
| `--snice-color-border` | Panel and item border color |
| `--snice-color-background` | Panel background color |
| `--snice-color-background-element` | Item hover and bell hover background |
| `--snice-shadow-lg` | Panel drop shadow |

## Basic Usage

```typescript
import 'snice/components/notification-center/snice-notification-center';
```

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'New message', message: 'You have a new message', timestamp: '2 min ago', type: 'info' },
    { id: '2', title: 'Build complete', message: 'Deployment succeeded', timestamp: '10 min ago', type: 'success', read: true }
  ];
</script>
```

## Examples

### Notification Types

Each `type` automatically applies a default icon if no custom `icon` is provided.

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'Info', message: 'System update available', timestamp: '1 min ago', type: 'info' },
    { id: '2', title: 'Success', message: 'File uploaded successfully', timestamp: '3 min ago', type: 'success' },
    { id: '3', title: 'Warning', message: 'API rate limit approaching', timestamp: '5 min ago', type: 'warning' },
    { id: '4', title: 'Error', message: 'Database connection failed', timestamp: '8 min ago', type: 'error' }
  ];
</script>
```

### Handling Notification Clicks

Listen for the `notification-click` event to navigate or take action when a notification is clicked.

```typescript
nc.addEventListener('notification-click', (e) => {
  const notification = e.detail.notification;
  console.log('Clicked:', notification.title);
  nc.markAsRead(notification.id);
});
```

### Dismiss and Mark All Read

Use methods to manage notification state programmatically.

```typescript
// Listen for individual dismissals
nc.addEventListener('notification-dismiss', (e) => {
  console.log('Dismissed notification:', e.detail.id);
});

// Listen for mark-all-read
nc.addEventListener('notification-read-all', () => {
  console.log('All notifications marked as read');
});

// Programmatically mark all as read
nc.markAllAsRead();
```

### Custom Icons

Override the default type-based icon with a custom emoji or text using the `icon` property on each notification item.

```typescript
nc.notifications = [
  { id: '1', title: 'New follower', message: 'Alex started following you', timestamp: 'Just now', icon: '\u{1F464}' },
  { id: '2', title: 'Achievement unlocked', message: 'You completed 100 tasks', timestamp: '5 min ago', icon: '\u{1F3C6}' },
  { id: '3', title: 'Reminder', message: 'Team standup in 15 minutes', timestamp: '10 min ago', icon: '\u{23F0}' }
];
```

## Accessibility

- The bell icon is keyboard-focusable and opens the dropdown panel on click or Enter/Space
- The unread count badge is visible for sighted users
- Notification items in the dropdown are interactive and clickable
- The dismiss button is accessible for keyboard navigation
- The "Mark all as read" action is available in the panel header
- Unread notifications are visually distinguished with a highlighted background

## Data Types

```typescript
interface NotificationItem {
  id: string;                                        // Unique identifier
  title: string;                                     // Notification title
  message: string;                                   // Notification body text
  timestamp: string;                                 // Display timestamp (e.g., "2 min ago")
  read?: boolean;                                    // Whether the notification has been read
  icon?: string;                                     // Emoji or text icon (auto-set by type if omitted)
  type?: 'info' | 'success' | 'warning' | 'error';  // Notification type (determines default icon)
}
```
