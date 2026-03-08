import { createReactAdapter } from './wrapper';
/**
 * ProgressRing - React adapter for snice-progress-ring
 *
 * This is an auto-generated React wrapper for the Snice progress-ring component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/progress-ring';
 * import { ProgressRing } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ProgressRing />;
 * }
 * ```
 */
export const ProgressRing = createReactAdapter({
    tagName: 'snice-progress-ring',
    properties: ["value", "max", "size", "thickness", "color", "showValue", "label"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=progress-ring.js.map