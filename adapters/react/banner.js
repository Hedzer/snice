import { createReactAdapter } from './wrapper';
/**
 * Banner - React adapter for snice-banner
 *
 * This is an auto-generated React wrapper for the Snice banner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/banner';
 * import { Banner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Banner />;
 * }
 * ```
 */
export const Banner = createReactAdapter({
    tagName: 'snice-banner',
    properties: ["variant", "position", "message", "dismissible", "icon", "actionText", "open"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=banner.js.map