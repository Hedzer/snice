import { createReactAdapter } from './wrapper';
/**
 * Tooltip - React adapter for snice-tooltip
 *
 * This is an auto-generated React wrapper for the Snice tooltip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tooltip';
 * import { Tooltip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tooltip />;
 * }
 * ```
 */
export const Tooltip = createReactAdapter({
    tagName: 'snice-tooltip',
    properties: ["content", "position", "trigger", "delay", "hideDelay", "offset", "arrow", "open", "maxWidth", "zIndex", "strictPositioning"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=tooltip.js.map