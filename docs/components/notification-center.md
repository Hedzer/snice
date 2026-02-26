[//]: # (AI: For a low-token version of this doc, use docs/ai/components/notification-center.md instead)

# Notification Center Component

`<snice-notification-center>`

A bell icon with a dropdown notification panel. Displays an unread count badge, supports marking notifications as read, and allows dismissing individual items.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Types](#types)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/notification-center/snice-notification-center';
```

```html
<snice-notification-center></snice-notification-center>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/notification-center/snice-notification-center';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-notification-center.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `notifications` | `NotificationItem[]` | `[]` | Array of notification objects to display |
| `open` | `boolean` | `false` | Whether the dropdown panel is visible |

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

## Types

### NotificationItem

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

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-font-family` | Font family |
| `--snice-color-text` | Primary text color |
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
| `--snice-spacing-*` | Various spacing tokens |
| `--snice-font-size-sm` | Small text size |
| `--snice-font-size-md` | Base text size |
| `--snice-font-weight-medium` | Medium font weight |
| `--snice-font-weight-semibold` | Semibold font weight |
| `--snice-font-weight-bold` | Bold font weight |
| `--snice-border-radius-md` | Item border radius |
| `--snice-border-radius-lg` | Panel border radius |
| `--snice-transition-fast` | Hover transition speed |

## Examples

### Basic Notifications

Populate the `notifications` property to display items in the dropdown panel.

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  import 'snice/components/notification-center/snice-notification-center';

  const nc = document.getElementById('nc');
  nc.notifications = [
    {
      id: '1',
      title: 'New message',
      message: 'You have a new message from Sarah',
      timestamp: '2 min ago',
      type: 'info'
    },
    {
      id: '2',
      title: 'Build complete',
      message: 'Production deployment succeeded',
      timestamp: '10 min ago',
      type: 'success',
      read: true
    },
    {
      id: '3',
      title: 'Disk space low',
      message: 'Server storage is at 90% capacity',
      timestamp: '1 hour ago',
      type: 'warning'
    }
  ];
</script>
```

### Handling Notification Clicks

Listen for the `notification-click` event to navigate or take action when a notification is clicked.

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  import 'snice/components/notification-center/snice-notification-center';

  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'New order', message: 'Order #4521 placed', timestamp: 'Just now', type: 'info' },
    { id: '2', title: 'Payment received', message: '$249.99 from Acme Corp', timestamp: '5 min ago', type: 'success' }
  ];

  nc.addEventListener('notification-click', (e) => {
    const notification = e.detail.notification;
    console.log('Clicked:', notification.title);

    // Mark as read when clicked
    nc.markAsRead(notification.id);

    // Navigate to relevant page
    window.location.href = `/notifications/${notification.id}`;
  });
</script>
```

### Notification Types

Each `type` automatically applies a default icon if no custom `icon` is provided.

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  import 'snice/components/notification-center/snice-notification-center';

  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'Info', message: 'System update available', timestamp: '1 min ago', type: 'info' },
    { id: '2', title: 'Success', message: 'File uploaded successfully', timestamp: '3 min ago', type: 'success' },
    { id: '3', title: 'Warning', message: 'API rate limit approaching', timestamp: '5 min ago', type: 'warning' },
    { id: '4', title: 'Error', message: 'Database connection failed', timestamp: '8 min ago', type: 'error' }
  ];
</script>
```

### Dismiss and Mark All Read

Use methods to manage notification state programmatically.

```html
<snice-notification-center id="nc"></snice-notification-center>
<button id="clear-all">Clear All</button>

<script type="module">
  import 'snice/components/notification-center/snice-notification-center';

  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'Alert 1', message: 'First notification', timestamp: '1 min ago', type: 'info' },
    { id: '2', title: 'Alert 2', message: 'Second notification', timestamp: '2 min ago', type: 'warning' },
    { id: '3', title: 'Alert 3', message: 'Third notification', timestamp: '3 min ago', type: 'error' }
  ];

  // Listen for individual dismissals
  nc.addEventListener('notification-dismiss', (e) => {
    console.log('Dismissed notification:', e.detail.id);
  });

  // Listen for mark-all-read
  nc.addEventListener('notification-read-all', () => {
    console.log('All notifications marked as read');
  });

  // Programmatically clear all
  document.getElementById('clear-all').addEventListener('click', () => {
    nc.markAllAsRead();
  });
</script>
```

### Custom Icons

Override the default type-based icon with a custom emoji or text using the `icon` property.

```html
<snice-notification-center id="nc"></snice-notification-center>

<script type="module">
  import 'snice/components/notification-center/snice-notification-center';

  const nc = document.getElementById('nc');
  nc.notifications = [
    { id: '1', title: 'New follower', message: 'Alex started following you', timestamp: 'Just now', icon: '👤' },
    { id: '2', title: 'Achievement unlocked', message: 'You completed 100 tasks', timestamp: '5 min ago', icon: '🏆' },
    { id: '3', title: 'Reminder', message: 'Team standup in 15 minutes', timestamp: '10 min ago', icon: '⏰' }
  ];
</script>
```

## Accessibility

- The bell icon is keyboard-focusable and opens the dropdown panel on click or Enter/Space
- The unread count badge is visible for sighted users; the count is communicated via the badge element
- Notification items in the dropdown are interactive and clickable
- The dismiss button is accessible for keyboard navigation
- The "Mark all as read" action is available as a link at the top of the panel
- Unread notifications are visually distinguished with a highlighted background
