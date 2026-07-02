// GENERATED FILE — DO NOT EDIT.
// Source: components/terminal/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["prompt", "cwd", "readonly", "maxLines", "showTimestamps"],
    events: { "terminal-command": "onTerminalCommand", "terminal-clear": "onTerminalClear", "terminal-ready": "onTerminalReady" },
    formAssociated: false
});
//# sourceMappingURL=terminal.js.map