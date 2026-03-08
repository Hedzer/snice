import { createReactAdapter } from './wrapper';
/**
 * Spotlight - React adapter for snice-spotlight
 *
 * This is an auto-generated React wrapper for the Snice spotlight component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spotlight';
 * import { Spotlight } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spotlight />;
 * }
 * ```
 */
export const Spotlight = createReactAdapter({
    tagName: 'snice-spotlight',
    properties: ["steps", "currentIndex", "active"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=spotlight.js.map