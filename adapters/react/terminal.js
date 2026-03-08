import { createReactAdapter } from './wrapper';
/**
 * Terminal - React adapter for snice-terminal
 *
 * This is an auto-generated React wrapper for the Snice terminal component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/terminal';
 * import { Terminal } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Terminal />;
 * }
 * ```
 */
export const Terminal = createReactAdapter({
    tagName: 'snice-terminal',
    properties: ["renderTrigger", "prompt", "cwd", "readonly", "maxLines", "showTimestamps"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=terminal.js.map