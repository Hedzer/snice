import { createReactAdapter } from './wrapper';
/**
 * Progress - React adapter for snice-progress
 *
 * This is an auto-generated React wrapper for the Snice progress component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/progress';
 * import { Progress } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Progress />;
 * }
 * ```
 */
export const Progress = createReactAdapter({
    tagName: 'snice-progress',
    properties: ["value", "max", "variant", "size", "color", "indeterminate", "showLabel", "label", "striped", "animated", "thickness"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=progress.js.map