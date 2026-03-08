import { createReactAdapter } from './wrapper';
/**
 * Mentions - React adapter for snice-mentions
 *
 * This is an auto-generated React wrapper for the Snice mentions component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/mentions';
 * import { Mentions } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Mentions />;
 * }
 * ```
 */
export const Mentions = createReactAdapter({
    tagName: 'snice-mentions',
    properties: ["value", "users", "placeholder", "readonly", "trigger"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=mentions.js.map