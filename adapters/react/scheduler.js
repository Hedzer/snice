import { createReactAdapter } from './wrapper';
/**
 * Scheduler - React adapter for snice-scheduler
 *
 * This is an auto-generated React wrapper for the Snice scheduler component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/scheduler';
 * import { Scheduler } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Scheduler />;
 * }
 * ```
 */
export const Scheduler = createReactAdapter({
    tagName: 'snice-scheduler',
    properties: ["resources", "events", "view", "date", "granularity", "startHour", "endHour"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=scheduler.js.map