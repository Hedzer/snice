import { createReactAdapter } from './wrapper';
/**
 * WorkOrder - React adapter for snice-work-order
 *
 * This is an auto-generated React wrapper for the Snice work-order component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/work-order';
 * import { WorkOrder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <WorkOrder />;
 * }
 * ```
 */
export const WorkOrder = createReactAdapter({
    tagName: 'snice-work-order',
    properties: ["woNumber", "date", "dueDate", "priority", "status", "customer", "description", "tasks", "parts", "asset", "laborRate", "notes", "variant", "showQr", "qrData", "qrPosition"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=work-order.js.map