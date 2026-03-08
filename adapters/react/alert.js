import { createReactAdapter } from './wrapper';
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
export const Alert = createReactAdapter({
    tagName: 'snice-alert',
    properties: ["variant", "size", "title", "dismissible", "icon"],
    events: { "alert-dismiss": "onAlertDismiss", "alert-hidden": "onAlertHidden", "alert-shown": "onAlertShown" },
    formAssociated: false
});
//# sourceMappingURL=alert.js.map