# snice-notification-center

Bell icon with dropdown notification panel. Shows unread badge, supports dismiss and mark-as-read.

## Properties

```typescript
notifications: NotificationItem[] = [];  // attr: none (JS only)
open: boolean = false;                   // Panel visibility
icon: string = '';                       // Custom bell icon (URL, image, emoji)
```

## Methods

- `markAsRead(id: string)` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read
- `dismiss(id: string)` - Remove notification from list

## Events

- `notification-click` → `{ notification: NotificationItem }` - Item clicked
- `notification-dismiss` → `{ id: string }` - Item dismissed
- `notification-read-all` → `void` - All marked as read

## Slots

- `icon` - Custom bell icon content (overrides `icon` property)

## CSS Parts

- `trigger` - The bell icon button
- `icon` - The bell icon span
- `panel` - The dropdown notification panel
- `panel-header` - Panel header with title and mark-all-read action

## CSS Custom Properties

```css
--snice-color-primary              /* Mark all read link, unread highlight */
--snice-color-primary-subtle       /* Unread item background */
--snice-color-danger               /* Badge background, dismiss hover */
--snice-color-text-inverse         /* Badge text */
--snice-color-text-secondary       /* Message text */
--snice-color-text-tertiary        /* Timestamp, empty state, dismiss icon */
--snice-color-border               /* Panel, item borders */
--snice-color-background           /* Panel background */
--snice-color-background-element   /* Item hover, bell hover */
--snice-shadow-lg                  /* Panel shadow */
```

## Basic Usage

```html
<snice-notification-center></snice-notification-center>
```

```typescript
import 'snice/components/notification-center/snice-notification-center';

nc.notifications = [
  { id: '1', title: 'New message', message: 'You have a new message', timestamp: '2 min ago', type: 'info' },
  { id: '2', title: 'Deployed', message: 'Build succeeded', timestamp: '5 min ago', type: 'success', read: true }
];

nc.addEventListener('notification-click', (e) => {
  console.log('Clicked:', e.detail.notification);
});
```

## Accessibility

- Bell icon is keyboard-focusable
- Unread count via badge element
- Notification items are clickable with dismiss buttons
- "Mark all as read" action in panel header

## Types

```typescript
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  icon?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}
```
