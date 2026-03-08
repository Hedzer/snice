import { createReactAdapter } from './wrapper';
/**
 * Slider - React adapter for snice-slider
 *
 * This is an auto-generated React wrapper for the Snice slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/slider';
 * import { Slider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Slider />;
 * }
 * ```
 */
export const Slider = createReactAdapter({
    tagName: 'snice-slider',
    properties: ["size", "variant", "value", "min", "max", "step", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "name", "showValue", "showTicks", "vertical"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=slider.js.map