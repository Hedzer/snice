import { createReactAdapter } from './wrapper';
/**
 * SplitPane - React adapter for snice-split-pane
 *
 * This is an auto-generated React wrapper for the Snice split-pane component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-pane';
 * import { SplitPane } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitPane />;
 * }
 * ```
 */
export const SplitPane = createReactAdapter({
    tagName: 'snice-split-pane',
    properties: ["direction", "primarySize", "minPrimarySize", "minSecondarySize", "snapSize", "disabled"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=split-pane.js.map