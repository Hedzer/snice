import { createReactAdapter } from './wrapper';
/**
 * Toast - React adapter for snice-toast
 *
 * This is an auto-generated React wrapper for the Snice toast component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/toast';
 * import { Toast } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Toast />;
 * }
 * ```
 */
export const Toast = createReactAdapter({
    tagName: 'snice-toast',
    properties: ["type", "message", "closable", "icon"],
    events: { "close-toast": "onCloseToast" },
    formAssociated: false
});
//# sourceMappingURL=toast.js.map