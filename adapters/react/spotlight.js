// GENERATED FILE — DO NOT EDIT.
// Source: components/spotlight/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["steps"],
    events: { "spotlight-start": "onSpotlightStart", "spotlight-step": "onSpotlightStep", "spotlight-end": "onSpotlightEnd", "spotlight-skip": "onSpotlightSkip", "spotlight-target-missing": "onSpotlightTargetMissing" },
    formAssociated: false
});
//# sourceMappingURL=spotlight.js.map