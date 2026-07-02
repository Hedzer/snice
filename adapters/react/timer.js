// GENERATED FILE — DO NOT EDIT.
// Source: components/timer/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["mode", "initialTime", "running"],
    events: { "timer-start": "onTimerStart", "timer-stop": "onTimerStop", "timer-reset": "onTimerReset", "timer-complete": "onTimerComplete" },
    formAssociated: false
});
//# sourceMappingURL=timer.js.map