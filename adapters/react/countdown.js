import { createReactAdapter } from './wrapper';
/**
 * Countdown - React adapter for snice-countdown
 *
 * This is an auto-generated React wrapper for the Snice countdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/countdown';
 * import { Countdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Countdown />;
 * }
 * ```
 */
export const Countdown = createReactAdapter({
    tagName: 'snice-countdown',
    properties: ["target", "format", "variant", "days", "hours", "minutes", "seconds"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=countdown.js.map