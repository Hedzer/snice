import { createReactAdapter } from './wrapper';
/**
 * Gauge - React adapter for snice-gauge
 *
 * This is an auto-generated React wrapper for the Snice gauge component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/gauge';
 * import { Gauge } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Gauge />;
 * }
 * ```
 */
export const Gauge = createReactAdapter({
    tagName: 'snice-gauge',
    properties: ["value", "min", "max", "label", "variant", "size", "showValue", "thickness"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=gauge.js.map