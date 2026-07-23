// GENERATED FILE — DO NOT EDIT.
// Source: components/notification-center/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the NotificationCenter component
 */
export interface NotificationCenterProps extends SniceBaseProps {
  notifications?: any;
  open?: any;
  placement?: any;
  icon?: any;
  onNotificationClick?: (event: any) => void;
  onNotificationDismiss?: (event: any) => void;
  onNotificationReadAll?: (event: any) => void;
}

/**
 * NotificationCenter - React adapter for snice-notification-center
 *
 * This is an auto-generated React wrapper for the Snice notification-center component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/notification-center/snice-notification-center';
 * import { NotificationCenter } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NotificationCenter />;
 * }
 * ```
 */
export const NotificationCenter: SniceReactComponent<NotificationCenterProps, SniceComponentRef> = createReactAdapter<NotificationCenterProps, false>({
  tagName: 'snice-notification-center',
  properties: ["notifications","open","placement","icon"],
  events: {"notification-click":"onNotificationClick","notification-dismiss":"onNotificationDismiss","notification-read-all":"onNotificationReadAll"},
  formAssociated: false
});
