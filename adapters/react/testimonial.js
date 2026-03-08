import { createReactAdapter } from './wrapper';
/**
 * Testimonial - React adapter for snice-testimonial
 *
 * This is an auto-generated React wrapper for the Snice testimonial component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/testimonial';
 * import { Testimonial } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Testimonial />;
 * }
 * ```
 */
export const Testimonial = createReactAdapter({
    tagName: 'snice-testimonial',
    properties: ["quote", "author", "avatar", "role", "company", "rating", "variant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=testimonial.js.map