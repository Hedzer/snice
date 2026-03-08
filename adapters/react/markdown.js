import { createReactAdapter } from './wrapper';
/**
 * Markdown - React adapter for snice-markdown
 *
 * This is an auto-generated React wrapper for the Snice markdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/markdown';
 * import { Markdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Markdown />;
 * }
 * ```
 */
export const Markdown = createReactAdapter({
    tagName: 'snice-markdown',
    properties: ["sanitize", "theme", "renderedHtml"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=markdown.js.map