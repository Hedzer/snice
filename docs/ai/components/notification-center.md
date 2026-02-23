# snice-notification-center

Bell icon with dropdown notification panel. Shows unread badge, supports dismiss and mark-as-read.

## Properties

```ts
notifications: NotificationItem[]       // Array of notification objects
```

### NotificationItem

```ts
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  icon?: string;                         // Emoji/text icon (auto-set by type if omitted)
  type?: 'info' | 'success' | 'warning' | 'error';
}
```

## Methods

- `markAsRead(id: string)` -- Mark single notification as read
- `markAllAsRead()` -- Mark all notifications as read
- `dismiss(id: string)` -- Remove notification from list

## Events

- `notification-click` -> `{ notification: NotificationItem }` -- Notification item clicked
- `notification-dismiss` -> `{ id: string }` -- Notification dismissed
- `notification-read-all` -> `void` -- All marked as read

## CSS Custom Properties

```css
--snice-font-family
--snice-color-text
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
--snice-spacing-*
--snice-font-size-sm
--snice-font-size-md
--snice-font-weight-medium
--snice-font-weight-semibold
--snice-font-weight-bold
--snice-border-radius-md
--snice-border-radius-lg
--snice-transition-fast
```

## Usage

```html
<snice-notification-center></snice-notification-center>
```

```js
const nc = document.querySelector('snice-notification-center');
nc.notifications = [
  { id: '1', title: 'New message', message: 'You have a new message', timestamp: '2 min ago', type: 'info' },
  { id: '2', title: 'Deployed', message: 'Build succeeded', timestamp: '5 min ago', type: 'success', read: true }
];

nc.addEventListener('notification-click', (e) => {
  console.log('Clicked:', e.detail.notification);
});
```
