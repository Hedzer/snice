// GENERATED FILE — DO NOT EDIT.
// Source: components/diff/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Diff - React adapter for snice-diff
 *
 * This is an auto-generated React wrapper for the Snice diff component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/diff/snice-diff';
 * import { Diff } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Diff />;
 * }
 * ```
 */
export const Diff = createReactAdapter({
    tagName: 'snice-diff',
    properties: ["oldText", "newText", "language", "mode", "lineNumbers", "contextLines", "markers", "showModeToggle"],
    events: { "diff-computed": "onDiffComputed", "mode-change": "onModeChange" },
    formAssociated: false
});
//# sourceMappingURL=diff.js.map