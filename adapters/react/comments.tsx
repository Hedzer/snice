import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Comments component
 */
export interface CommentsProps extends SniceBaseProps {
  comments?: any;
  currentUser?: any;
  allowReplies?: any;
  allowLikes?: any;
  maxDepth?: any;

}

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
export const Comments = createReactAdapter<CommentsProps>({
  tagName: 'snice-comments',
  properties: ["comments","currentUser","allowReplies","allowLikes","maxDepth"],
  events: {},
  formAssociated: false
});
