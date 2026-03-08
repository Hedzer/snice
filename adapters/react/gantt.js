import { createReactAdapter } from './wrapper';
/**
 * Gantt - React adapter for snice-gantt
 *
 * This is an auto-generated React wrapper for the Snice gantt component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/gantt';
 * import { Gantt } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Gantt />;
 * }
 * ```
 */
export const Gantt = createReactAdapter({
    tagName: 'snice-gantt',
    properties: ["tasks", "zoom", "showDependencies"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=gantt.js.map