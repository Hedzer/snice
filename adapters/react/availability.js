import { createReactAdapter } from './wrapper';
/**
 * Availability - React adapter for snice-availability
 *
 * This is an auto-generated React wrapper for the Snice availability component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/availability';
 * import { Availability } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Availability />;
 * }
 * ```
 */
export const Availability = createReactAdapter({
    tagName: 'snice-availability',
    properties: ["value", "granularity", "startHour", "endHour", "format", "readonly"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=availability.js.map