# snice-notification-center

Bell icon with dropdown notification panel. Shows unread badge, supports dismiss and mark-as-read.

## Properties

```typescript
notifications: NotificationItem[] = [];  // attr: none (JS only)
open: boolean = false;                   // Panel visibility
icon: string = '';                       // Custom bell icon (URL, image, emoji)
placement: 'start'|'end' = 'end';        // Panel alignment side
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
- `badge` - The internal `<snice-badge>` carrying the unread count
- `icon` - The bell icon span
- `panel` - The dropdown notification panel
- `panel-header` - Panel header with title and mark-all-read action
- `panel-title` - Panel title text
- `mark-all-button` - Mark-all-read button
- `list` - The `<ul>` of notifications
- `item` - One notification `<li>`
- `item-icon` - Notification type icon
- `item-content` - Notification text block
- `item-title` - Notification title
- `item-message` - Notification message
- `item-time` - Notification timestamp
- `dismiss` - Per-notification dismiss button
- `empty-state` - The internal `<snice-empty-state>` shown with no notifications

State tokens:

- `trigger-open` - Added to `trigger` while the panel is open
- `item-unread` - Added to `item` while the notification is unread

Forwarded from the unread `<snice-badge>` via `exportparts`:

- `badge-base` - Exported `base` of the internal badge
- `badge-badge` - Exported `badge` of the internal badge
- `badge-badge-dot` - Exported `badge-dot` of the internal badge (badge while `dot` is set)
- `badge-badge-pulse` - Exported `badge-pulse` of the internal badge (badge while `pulse` is set)

Forwarded from the empty `<snice-empty-state>` via `exportparts`:

- `empty-state-base` - Exported `base` of the internal empty state
- `empty-state-container` - Exported `container` of the internal empty state
- `empty-state-icon` - Exported `icon` of the internal empty state
- `empty-state-title` - Exported `title` of the internal empty state
- `empty-state-description` - Exported `description` of the internal empty state
- `empty-state-action` - Exported `action` of the internal empty state
- `empty-state-extra` - Exported `extra` of the internal empty state

## CSS Custom Properties

```css
--snice-color-primary              /* Mark all read link, unread highlight */
--snice-color-primary-subtle-hover /* Unread item hover (base tint derives from --snice-color-primary) */
--snice-color-danger               /* Badge background, dismiss hover */
--snice-color-surface              /* Badge text, via the nested snice-badge */
--snice-color-text-secondary       /* Message text */
--snice-color-text-tertiary        /* Timestamp, empty state, dismiss icon */
--snice-color-border               /* Panel, item borders */
--snice-color-surface           /* Panel background */
--snice-color-surface-hover        /* Item hover, bell hover */
--snice-shadow-xl                  /* Panel shadow */
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
