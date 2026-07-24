// GENERATED FILE — DO NOT EDIT.
// Source: components/alert/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Alert component
 */
export interface AlertProps extends SniceBaseProps {
  variant?: any;
  size?: any;
  appearance?: any;
  title?: any;
  dismissible?: any;
  icon?: any;
  duration?: any;
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
 * import 'snice/components/alert/snice-alert';
 * import { Alert } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Alert />;
 * }
 * ```
 */
export const Alert: SniceReactComponent<AlertProps, SniceComponentRef> = createReactAdapter<AlertProps, false>({
  tagName: 'snice-alert',
  properties: ["variant","size","appearance","title","dismissible","icon","duration"],
  events: {"alert-dismiss":"onAlertDismiss","alert-hidden":"onAlertHidden","alert-shown":"onAlertShown"},
  formAssociated: false
});
