import { createReactAdapter } from './wrapper';
/**
 * Timer - React adapter for snice-timer
 *
 * This is an auto-generated React wrapper for the Snice timer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timer';
 * import { Timer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timer />;
 * }
 * ```
 */
export const Timer = createReactAdapter({
    tagName: 'snice-timer',
    properties: ["mode", "initialTime", "running", "time"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=timer.js.map