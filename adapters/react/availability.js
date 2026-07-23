// GENERATED FILE — DO NOT EDIT.
// Source: components/availability/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Availability - React adapter for snice-availability
 *
 * This is an auto-generated React wrapper for the Snice availability component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/availability/snice-availability';
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
    events: { "availability-change": "onAvailabilityChange" },
    formAssociated: false
});
//# sourceMappingURL=availability.js.map