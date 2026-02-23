import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-comments.css?inline';
import type { SniceCommentsElement, Comment, CommentAddDetail, CommentReplyDetail, CommentDeleteDetail, CommentLikeDetail } from './snice-comments.types';

@element('snice-comments')
export class SniceComments extends HTMLElement implements SniceCommentsElement {
  @property({ type: Array })
  comments: Comment[] = [];

  @property({ attribute: 'current-user' })
  currentUser = '';

  @property({ type: Boolean, attribute: 'allow-replies' })
  allowReplies = true;

  @property({ type: Boolean, attribute: 'allow-likes' })
  allowLikes = true;

  @property({ type: Number, attribute: 'max-depth' })
  maxDepth = 3;

  @query('.comments__new-input')
  private newInput?: HTMLTextAreaElement;

  private replyingTo: string | null = null;
  private replyText = '';
  private newCommentText = '';

  @ready()
  init() {
    // Component ready
  }

  @watch('comments')
  handleCommentsChange() {
    // Re-render on comments change
  }

  private generateId(): string {
    return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private formatTimestamp(ts: string): string {
    try {
      const date = new Date(ts);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return ts;
    }
  }

  private findComment(comments: Comment[], id: string): Comment | null {
    for (const c of comments) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = this.findComment(c.replies, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeComment(comments: Comment[], id: string): Comment[] {
    return comments
      .filter(c => c.id !== id)
      .map(c => ({
        ...c,
        replies: c.replies ? this.removeComment(c.replies, id) : undefined
      }));
  }

  private updateComment(comments: Comment[], id: string, updater: (c: Comment) => Comment): Comment[] {
    return comments.map(c => {
      if (c.id === id) return updater(c);
      if (c.replies) {
        return { ...c, replies: this.updateComment(c.replies, id, updater) };
      }
      return c;
    });
  }

  // --- Public API ---

  addComment(text: string, parentId?: string): void {
    if (!text.trim()) return;

    const newComment: Comment = {
      id: this.generateId(),
      author: this.currentUser || 'Anonymous',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false
    };

    if (parentId) {
      const parent = this.findComment(this.comments, parentId);
      if (!parent) return;

      this.comments = this.updateComment(this.comments, parentId, c => ({
        ...c,
        replies: [...(c.replies || []), newComment]
      }));

      this.emitCommentReply({
        id: newComment.id,
        text: newComment.text,
        author: newComment.author,
        parentId
      });
    } else {
      this.comments = [...this.comments, newComment];

      this.emitCommentAdd({
        id: newComment.id,
        text: newComment.text,
        author: newComment.author
      });
    }
  }

  deleteComment(id: string): void {
    const comment = this.findComment(this.comments, id);
    if (!comment) return;

    this.comments = this.removeComment(this.comments, id);

    this.emitCommentDelete({ id });
  }

  likeComment(id: string): void {
    const comment = this.findComment(this.comments, id);
    if (!comment) return;

    const newLiked = !comment.liked;
    const newLikes = (comment.likes || 0) + (newLiked ? 1 : -1);

    this.comments = this.updateComment(this.comments, id, c => ({
      ...c,
      liked: newLiked,
      likes: newLikes
    }));

    this.emitCommentLike({
      id,
      likes: newLikes,
      liked: newLiked
    });
  }

  @dispatch('comment-add', { bubbles: true, composed: true })
  private emitCommentAdd(detail?: CommentAddDetail): CommentAddDetail {
    return detail!;
  }

  @dispatch('comment-reply', { bubbles: true, composed: true })
  private emitCommentReply(detail?: CommentReplyDetail): CommentReplyDetail {
    return detail!;
  }

  @dispatch('comment-delete', { bubbles: true, composed: true })
  private emitCommentDelete(detail?: CommentDeleteDetail): CommentDeleteDetail {
    return detail!;
  }

  @dispatch('comment-like', { bubbles: true, composed: true })
  private emitCommentLike(detail?: CommentLikeDetail): CommentLikeDetail {
    return detail!;
  }

  private handleNewComment() {
    if (!this.newCommentText.trim()) return;
    this.addComment(this.newCommentText);
    this.newCommentText = '';
    if (this.newInput) {
      this.newInput.value = '';
    }
  }

  private handleReply(parentId: string) {
    if (!this.replyText.trim()) return;
    this.addComment(this.replyText, parentId);
    this.replyText = '';
    this.replyingTo = null;
  }

  private handleNewInputChange(e: Event) {
    this.newCommentText = (e.target as HTMLTextAreaElement).value;
  }

  private handleReplyInputChange(e: Event) {
    this.replyText = (e.target as HTMLTextAreaElement).value;
  }

  private handleNewKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.handleNewComment();
    }
  }

  private handleReplyKeydown(e: KeyboardEvent, parentId: string) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.handleReply(parentId);
    }
    if (e.key === 'Escape') {
      this.replyingTo = null;
    }
  }

  private startReply(commentId: string) {
    this.replyingTo = commentId;
    this.replyText = '';
  }

  private cancelReply() {
    this.replyingTo = null;
    this.replyText = '';
  }

  private renderComment(comment: Comment, depth: number): unknown {
    const canReply = this.allowReplies && depth < this.maxDepth;
    const isOwn = this.currentUser && comment.author === this.currentUser;
    const isReplying = this.replyingTo === comment.id;
    const hasLikes = (comment.likes || 0) > 0;

    return html/*html*/`
      <div class="comment" data-id="${comment.id}">
        <div class="comment__avatar">
          <if ${comment.avatar}>
            <img src="${comment.avatar}" alt="${comment.author}" />
          </if>
          <if ${!comment.avatar}>
            ${this.getInitials(comment.author)}
          </if>
        </div>
        <div class="comment__body">
          <div class="comment__header">
            <span class="comment__author">${comment.author}</span>
            <span class="comment__time">${this.formatTimestamp(comment.timestamp)}</span>
          </div>
          <p class="comment__text">${comment.text}</p>
          <div class="comment__actions">
            <if ${this.allowLikes}>
              <button class="comment__action ${comment.liked ? 'comment__action--liked' : ''}"
                      @click=${() => this.likeComment(comment.id)}
                      aria-label="${comment.liked ? 'Unlike' : 'Like'}">
                <span>${comment.liked ? '\u2764' : '\u2661'}</span>
                <if ${hasLikes}>
                  <span class="comment__like-count">${comment.likes}</span>
                </if>
              </button>
            </if>
            <if ${canReply}>
              <button class="comment__action"
                      @click=${() => this.startReply(comment.id)}
                      aria-label="Reply">
                Reply
              </button>
            </if>
            <if ${isOwn}>
              <button class="comment__action comment__action--delete"
                      @click=${() => this.deleteComment(comment.id)}
                      aria-label="Delete comment">
                Delete
              </button>
            </if>
          </div>

          <if ${isReplying}>
            <div class="comment__reply-input">
              <textarea class="comments__input"
                        placeholder="Write a reply..."
                        rows="1"
                        @input=${this.handleReplyInputChange}
                        @keydown=${(e: KeyboardEvent) => this.handleReplyKeydown(e, comment.id)}></textarea>
              <button class="comments__submit"
                      @click=${() => this.handleReply(comment.id)}>
                Reply
              </button>
              <button class="comment__cancel"
                      @click=${() => this.cancelReply()}>
                Cancel
              </button>
            </div>
          </if>

          <if ${comment.replies && comment.replies.length > 0}>
            <div class="comment__replies">
              ${(comment.replies || []).map(reply => this.renderComment(reply, depth + 1))}
            </div>
          </if>
        </div>
      </div>
    `;
  }

  @render()
  renderContent() {
    const hasComments = this.comments.length > 0;

    return html/*html*/`
      <div class="comments" part="base">
        <div class="comments__input-area" part="input-area">
          <textarea class="comments__input comments__new-input"
                    placeholder="Write a comment..."
                    rows="2"
                    @input=${this.handleNewInputChange}
                    @keydown=${this.handleNewKeydown}></textarea>
          <button class="comments__submit"
                  @click=${() => this.handleNewComment()}
                  aria-label="Post comment">
            Post
          </button>
        </div>

        <if ${hasComments}>
          <div class="comments__list" part="list">
            ${this.comments.map(c => this.renderComment(c, 0))}
          </div>
        </if>
        <if ${!hasComments}>
          <div class="comments__empty">No comments yet. Be the first to comment!</div>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
