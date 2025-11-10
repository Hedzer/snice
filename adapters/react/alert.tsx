import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Alert component
 */
export interface AlertProps extends SniceBaseProps {
  variant?: any;
  size?: any;
  title?: any;
  dismissible?: any;
  icon?: any;
  onAlertDismiss?: (event: any) => void;
  onAlertHidden?: (event: any) => void;
  onAlertShown?: (event: any) => void;
}

/**
 * Alert - React adapter for snice-alert
 *
 * This is an auto-generated React wrapper for the Snice alert component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/alert';
 * import { Alert } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Alert />;
 * }
 * ```
 */
export const Alert = createReactAdapter<AlertProps>({
  tagName: 'snice-alert',
  properties: ["variant","size","title","dismissible","icon"],
  events: {"alert-dismiss":"onAlertDismiss","alert-hidden":"onAlertHidden","alert-shown":"onAlertShown"},
  formAssociated: false
});
