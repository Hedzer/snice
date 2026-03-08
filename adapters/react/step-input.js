import { createReactAdapter } from './wrapper';
/**
 * StepInput - React adapter for snice-step-input
 *
 * This is an auto-generated React wrapper for the Snice step-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/step-input';
 * import { StepInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StepInput />;
 * }
 * ```
 */
export const StepInput = createReactAdapter({
    tagName: 'snice-step-input',
    properties: ["value", "min", "max", "step", "disabled", "readonly", "size", "wrap"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=step-input.js.map