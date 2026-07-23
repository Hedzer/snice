// GENERATED FILE — DO NOT EDIT.
// Source: components/slider/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Slider - React adapter for snice-slider
 *
 * This is an auto-generated React wrapper for the Snice slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/slider/snice-slider';
 * import { Slider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Slider />;
 * }
 * ```
 */
export const Slider = createReactAdapter({
    tagName: 'snice-slider',
    properties: ["defaultValue", "size", "variant", "min", "max", "step", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "name", "showValue", "showTicks", "vertical", "value"],
    events: { "slider-input": "onSliderInput", "slider-change": "onSliderChange" },
    formAssociated: true
});
//# sourceMappingURL=slider.js.map