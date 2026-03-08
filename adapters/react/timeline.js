import { createReactAdapter } from './wrapper';
/**
 * Timeline - React adapter for snice-timeline
 *
 * This is an auto-generated React wrapper for the Snice timeline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timeline';
 * import { Timeline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timeline />;
 * }
 * ```
 */
export const Timeline = createReactAdapter({
    tagName: 'snice-timeline',
    properties: ["orientation", "position", "items", "reverse"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=timeline.js.map