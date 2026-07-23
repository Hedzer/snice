// GENERATED FILE — DO NOT EDIT.
// Source: components/step-input/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * StepInput - React adapter for snice-step-input
 *
 * This is an auto-generated React wrapper for the Snice step-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/step-input/snice-step-input';
 * import { StepInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StepInput />;
 * }
 * ```
 */
export const StepInput = createReactAdapter({
    tagName: 'snice-step-input',
    properties: ["defaultValue", "min", "max", "step", "disabled", "readonly", "size", "wrap", "name", "value"],
    events: { "value-change": "onValueChange" },
    formAssociated: true
});
//# sourceMappingURL=step-input.js.map