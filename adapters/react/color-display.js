import { createReactAdapter } from './wrapper';
/**
 * ColorDisplay - React adapter for snice-color-display
 *
 * This is an auto-generated React wrapper for the Snice color-display component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/color-display';
 * import { ColorDisplay } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorDisplay />;
 * }
 * ```
 */
export const ColorDisplay = createReactAdapter({
    tagName: 'snice-color-display',
    properties: ["value", "format", "showSwatch", "showLabel", "swatchSize", "label"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=color-display.js.map