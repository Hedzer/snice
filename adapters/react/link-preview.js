import { createReactAdapter } from './wrapper';
/**
 * LinkPreview - React adapter for snice-link-preview
 *
 * This is an auto-generated React wrapper for the Snice link-preview component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/link-preview';
 * import { LinkPreview } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LinkPreview />;
 * }
 * ```
 */
export const LinkPreview = createReactAdapter({
    tagName: 'snice-link-preview',
    properties: ["url", "title", "description", "image", "siteName", "favicon", "variant", "size"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=link-preview.js.map