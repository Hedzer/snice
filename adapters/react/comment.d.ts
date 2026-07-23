import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Comment component
 */
export interface CommentProps extends SniceBaseProps {
    'author'?: string;
    'avatar'?: string;
    'timestamp'?: string;
    'likes'?: string | number;
    'liked'?: boolean;
}
/**
 * Comment - React adapter for snice-comment
 *
 * This is an auto-generated React wrapper for the Snice comment component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/comments/snice-comments';
 * import { Comment } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Comment />;
 * }
 * ```
 */
export declare const Comment: SniceReactComponent<CommentProps, SniceComponentRef>;
//# sourceMappingURL=comment.d.ts.map