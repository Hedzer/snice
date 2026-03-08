import { createReactAdapter } from './wrapper';
/**
 * Link - React adapter for snice-link
 *
 * This is an auto-generated React wrapper for the Snice link component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/link';
 * import { Link } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Link />;
 * }
 * ```
 */
export const Link = createReactAdapter({
    tagName: 'snice-link',
    properties: ["href", "target", "variant", "disabled", "external", "underline", "hash"],
    events: { "click": "onClick" },
    formAssociated: false
});
//# sourceMappingURL=link.js.map