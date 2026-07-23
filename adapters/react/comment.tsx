// GENERATED FILE — DO NOT EDIT.
// Source: components/comments/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const Comment: SniceReactComponent<CommentProps, SniceComponentRef> = createReactAdapter<CommentProps, false>({
  tagName: 'snice-comment',
  properties: [],
  events: {},
  formAssociated: false
});
