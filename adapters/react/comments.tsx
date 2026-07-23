// GENERATED FILE — DO NOT EDIT.
// Source: components/comments/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Comments component
 */
export interface CommentsProps extends SniceBaseProps {
  comments?: any;
  currentUser?: any;
  allowReplies?: any;
  allowLikes?: any;
  maxDepth?: any;
  onCommentAdd?: (event: any) => void;
  onCommentReply?: (event: any) => void;
  onCommentDelete?: (event: any) => void;
  onCommentLike?: (event: any) => void;
}

/**
 * Comments - React adapter for snice-comments
 *
 * This is an auto-generated React wrapper for the Snice comments component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/comments/snice-comments';
 * import { Comments } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Comments />;
 * }
 * ```
 */
export const Comments: SniceReactComponent<CommentsProps, SniceComponentRef> = createReactAdapter<CommentsProps, false>({
  tagName: 'snice-comments',
  properties: ["comments","currentUser","allowReplies","allowLikes","maxDepth"],
  events: {"comment-add":"onCommentAdd","comment-reply":"onCommentReply","comment-delete":"onCommentDelete","comment-like":"onCommentLike"},
  formAssociated: false
});
