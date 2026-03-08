import { createReactAdapter } from './wrapper';
/**
 * Comments - React adapter for snice-comments
 *
 * This is an auto-generated React wrapper for the Snice comments component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/comments';
 * import { Comments } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Comments />;
 * }
 * ```
 */
export const Comments = createReactAdapter({
    tagName: 'snice-comments',
    properties: ["comments", "currentUser", "allowReplies", "allowLikes", "maxDepth"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=comments.js.map