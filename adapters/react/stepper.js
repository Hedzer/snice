import { createReactAdapter } from './wrapper';
/**
 * Stepper - React adapter for snice-stepper
 *
 * This is an auto-generated React wrapper for the Snice stepper component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stepper';
 * import { Stepper } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Stepper />;
 * }
 * ```
 */
export const Stepper = createReactAdapter({
    tagName: 'snice-stepper',
    properties: ["steps", "currentStep", "orientation", "clickable"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=stepper.js.map