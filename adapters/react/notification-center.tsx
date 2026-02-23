import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the NotificationCenter component
 */
export interface NotificationCenterProps extends SniceBaseProps {
  notifications?: any;
  open?: any;

}

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
export const NotificationCenter = createReactAdapter<NotificationCenterProps>({
  tagName: 'snice-notification-center',
  properties: ["notifications","open"],
  events: {},
  formAssociated: false
});
