export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;
  replies?: Comment[];
  likes?: number;
  liked?: boolean;
}

export interface SniceCommentsElement extends HTMLElement {
  comments: Comment[];
  currentUser: string;
  allowReplies: boolean;
  allowLikes: boolean;
  maxDepth: number;

  addComment(text: string, parentId?: string): void;
  deleteComment(id: string): void;
  likeComment(id: string): void;
}

export interface CommentAddDetail {
  id: string;
  text: string;
  author: string;
  parentId?: string;
}

export interface CommentReplyDetail {
  id: string;
  text: string;
  author: string;
  parentId: string;
}

export interface CommentDeleteDetail {
  id: string;
}

export interface CommentLikeDetail {
  id: string;
  likes: number;
  liked: boolean;
}

export interface SniceCommentsEventMap {
  'comment-add': CustomEvent<CommentAddDetail>;
  'comment-reply': CustomEvent<CommentReplyDetail>;
  'comment-delete': CustomEvent<CommentDeleteDetail>;
  'comment-like': CustomEvent<CommentLikeDetail>;
}

/**
 * Declarative usage via child elements:
 *
 * <snice-comments current-user="John" allow-replies allow-likes>
 *   <snice-comment author="Alice" avatar="alice.jpg" timestamp="2024-01-15T10:30:00Z" likes="3">
 *     This is a great article!
 *     <snice-comment author="Bob" timestamp="2024-01-15T11:00:00Z">
 *       Thanks Alice!
 *     </snice-comment>
 *   </snice-comment>
 *   <snice-comment author="Charlie" timestamp="2024-01-15T12:00:00Z">
 *     Very informative.
 *   </snice-comment>
 * </snice-comments>
 *
 * <snice-comment> attributes: author, avatar, timestamp, likes (number), liked (boolean), id
 * Nested <snice-comment> elements become replies.
 */
