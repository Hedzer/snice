import { type SniceReactComponent } from './wrapper';
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
export declare const Comments: SniceReactComponent<CommentsProps, SniceComponentRef>;
//# sourceMappingURL=comments.d.ts.map