// GENERATED FILE — DO NOT EDIT.
// Source: components/notification-center/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * NotificationCenter - React adapter for snice-notification-center
 *
 * This is an auto-generated React wrapper for the Snice notification-center component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/notification-center';
 * import { NotificationCenter } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NotificationCenter />;
 * }
 * ```
 */
export const NotificationCenter = createReactAdapter({
    tagName: 'snice-notification-center',
    properties: ["notifications", "open", "placement", "icon"],
    events: { "notification-click": "onNotificationClick", "notification-dismiss": "onNotificationDismiss", "notification-read-all": "onNotificationReadAll" },
    formAssociated: false
});
//# sourceMappingURL=notification-center.js.map