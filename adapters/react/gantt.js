// GENERATED FILE — DO NOT EDIT.
// Source: components/gantt/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    events: { "task-click": "onTaskClick", "task-resize": "onTaskResize", "task-move": "onTaskMove", "task-link": "onTaskLink" },
    formAssociated: false
});
//# sourceMappingURL=gantt.js.map