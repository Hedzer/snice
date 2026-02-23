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
