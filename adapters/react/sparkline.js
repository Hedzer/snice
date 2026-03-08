import { createReactAdapter } from './wrapper';
/**
 * Sparkline - React adapter for snice-sparkline
 *
 * This is an auto-generated React wrapper for the Snice sparkline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sparkline';
 * import { Sparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sparkline />;
 * }
 * ```
 */
export const Sparkline = createReactAdapter({
    tagName: 'snice-sparkline',
    properties: ["data", "type", "color", "customColor", "width", "height", "strokeWidth", "showDots", "showArea", "smooth", "min", "max"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=sparkline.js.map