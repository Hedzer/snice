// GENERATED FILE — DO NOT EDIT.
// Source: components/rating/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Rating - React adapter for snice-rating
 *
 * This is an auto-generated React wrapper for the Snice rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/rating/snice-rating';
 * import { Rating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Rating />;
 * }
 * ```
 */
export const Rating = createReactAdapter({
    tagName: 'snice-rating',
    properties: ["value", "max", "icon", "emptyIcon", "size", "readonly", "precision"],
    events: { "rating-change": "onRatingChange" },
    formAssociated: false
});
//# sourceMappingURL=rating.js.map