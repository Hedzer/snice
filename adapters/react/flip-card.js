import { createReactAdapter } from './wrapper';
/**
 * FlipCard - React adapter for snice-flip-card
 *
 * This is an auto-generated React wrapper for the Snice flip-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/flip-card';
 * import { FlipCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FlipCard />;
 * }
 * ```
 */
export const FlipCard = createReactAdapter({
    tagName: 'snice-flip-card',
    properties: ["flipped", "clickToFlip", "direction", "duration"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=flip-card.js.map