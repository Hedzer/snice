import { createReactAdapter } from './wrapper';
/**
 * Funnel - React adapter for snice-funnel
 *
 * This is an auto-generated React wrapper for the Snice funnel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/funnel';
 * import { Funnel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Funnel />;
 * }
 * ```
 */
export const Funnel = createReactAdapter({
    tagName: 'snice-funnel',
    properties: ["data", "variant", "orientation", "showLabels", "showValues", "showPercentages", "animation"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=funnel.js.map