import { element, property, render, styles, dispatch, query, watch, observe, ready, dispose, html, css, unsafeHTML } from 'snice';
import { PENCIL, TRASH, PAPER_CLIP, PAPER_AIRPLANE_SOLID } from '../icons';
import { FALLBACK_ACCENTS } from '../utils';
import { ChatLayout, MessageFormat } from './snice-chat.types';
import type {
  ChatMessage,
  MessageType,
  TypingIndicator,
  SniceChatElement,
  SniceChatEventMap,
} from './snice-chat.types';
import type { SniceChatMessageElement } from './snice-chat-message.types';
import '../empty-state/snice-empty-state';
import '../markdown/snice-markdown';
import './snice-chat-message';
import cssContent from './snice-chat.css?inline';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Stable color for an author name: hash → one of the 8 accent slots. Returns a
 * theme accent var with the shared concrete fallback.
 */
function autoAuthorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const slot = (hash % 8) + 1;
  return `var(--snice-color-accent-${slot}, ${FALLBACK_ACCENTS[slot - 1]})`;
}

/**
 * Author colors ride on message data, so they can come from a backend. A CSS
 * color never needs `;`, `{`, or `}` — reject values that could smuggle extra
 * declarations into the inline style attribute.
 */
function isSafeCssColor(value: string): boolean {
  return !/[;{}]/.test(value);
}

/**
 * snice-chat - Chat interface component
 *
 * A Slack-style chat interface with messages, typing indicators, and file uploads
 *
 * @element snice-chat
 *
 * @fires {CustomEvent<{ message: string; attachments?: File[] }>} message-send - Fires when sending a message
 * @fires {CustomEvent<{ messageId: string; newContent: string }>} message-edit - Fires when editing a message
 * @fires {CustomEvent<{ messageId: string }>} message-delete - Fires when deleting a message
 * @fires {CustomEvent<{ messageId: string; emoji: string }>} message-react - Fires when reacting to a message
 * @fires {CustomEvent<{}>} typing-start - Fires when user starts typing
 * @fires {CustomEvent<{}>} typing-stop - Fires when user stops typing
 */
@element('snice-chat')
export class SniceChat extends HTMLElement implements SniceChatElement {
  @property({ type: Array, attribute: false })
  messages: ChatMessage[] = [];

  @property({ type: String, attribute: 'current-user' })
  currentUser: string = 'You';

  @property({ type: String, attribute: 'current-avatar' })
  currentAvatar: string = '';

  @property({ type: String })
  placeholder: string = 'Type a message...';

  @property({ type: Boolean, attribute: 'allow-files' })
  allowFiles: boolean = true;

  @property({ type: Boolean, attribute: 'show-typing' })
  showTyping: boolean = true;

  @property({ type: Boolean, attribute: 'show-avatars' })
  showAvatars: boolean = true;

  @property({ type: Boolean, attribute: 'show-timestamps' })
  showTimestamps: boolean = true;

  @property({ type: Object, attribute: false })
  authorColors: Record<string, string> = {};

  @property({ type: Boolean, attribute: 'color-authors' })
  colorAuthors: boolean = false;

  @property({ type: Boolean })
  markdown: boolean = false;

  @property()
  layout: ChatLayout = ChatLayout.Default;

  // Internal reactive state: id of the message currently being edited inline.
  @property({ attribute: false })
  private editingId: string | null = null;

  // Internal reactive state: id of the message pending inline delete-confirm.
  @property({ attribute: false })
  private confirmingDeleteId: string | null = null;

  @query('.messages-area')
  private messagesArea!: HTMLElement;

  @query('.input-field')
  private inputField!: HTMLTextAreaElement;

  @query('.edit-field')
  private editField?: HTMLTextAreaElement;

  @query('.message-edit')
  private editBox?: HTMLElement;

  @query('.message-confirm')
  private confirmBox?: HTMLElement;

  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private typingTimeout: number | null = null;
  private fileInput: HTMLInputElement | null = null;

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.addEventListener('keydown', this.handleKeyDown);
    this.ingestSlottedMessages();
  }

  // Declarative dual-API: read slotted <snice-chat-message> children as the
  // messages source. An empty slot leaves the array untouched. Mirrors
  // snice-table / snice-column. Slotted messages keep a stable id across
  // re-ingests (keyed per element), runtime state (reactions, inline edits)
  // survives, and imperatively-added messages are appended after the slot set.
  @observe('mutation:childList')
  private onSlottedMessagesChanged() {
    this.ingestSlottedMessages();
  }

  @observe('mutation:attributes', { subtree: true })
  private onSlottedMessageAttributesChanged() {
    this.ingestSlottedMessages();
  }

  // Element → stable message id, so re-ingesting doesn't mint new ids and
  // orphan reactions/edit state keyed to the old ones.
  private slotMessageIds = new WeakMap<SniceChatMessageElement, string>();

  // Every id ever minted for a slot element, so a removed slot child isn't
  // misclassified as an imperative message and resurrected on re-ingest.
  private mintedSlotIds = new Set<string>();

  private ingestSlottedMessages() {
    const els = Array.from(
      this.querySelectorAll('snice-chat-message')
    ) as SniceChatMessageElement[];

    if (els.length === 0) return;

    const existingById = new Map(this.messages.map((m) => [m.id, m]));

    const slotMessages = els.map((el) => {
      let id = this.slotMessageIds.get(el);
      if (!id) {
        id = generateId();
        this.slotMessageIds.set(el, id);
        this.mintedSlotIds.add(id);
      }

      const definition = { ...el.getMessageDefinition(), id };
      const existing = existingById.get(id);
      if (!existing) return definition;

      // Runtime state outranks the (possibly stale) light DOM: keep reactions
      // accumulated via the UI unless the element declares its own, and keep
      // an inline edit's content over the original slotted text.
      if (!definition.reactions && existing.reactions) definition.reactions = existing.reactions;
      if (existing.edited && !definition.edited) {
        definition.content = existing.content;
        definition.edited = true;
      }
      return definition;
    });

    // Imperatively-added messages (addMessage) are not backed by an element;
    // keep them, appended after the slot set.
    const imperative = this.messages.filter((m) => !this.mintedSlotIds.has(m.id));

    this.messages = [...slotMessages, ...imperative];
  }

  @dispose()
  cleanup() {
    this.removeEventListener('keydown', this.handleKeyDown);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  @watch('messages')
  private messagesChanged(oldMessages?: ChatMessage[], newMessages?: ChatMessage[]) {
    // Scroll to bottom only when a message was appended — reactions and edits
    // reassign the array too, and must not yank the viewport while the user
    // is scrolled up reading history.
    if ((newMessages?.length ?? 0) > (oldMessages?.length ?? 0)) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  @dispatch('message-send', { bubbles: true, composed: true })
  private emitMessageSend(message: string, attachments?: File[]) {
    return { message, attachments };
  }

  @dispatch('message-edit', { bubbles: true, composed: true })
  private emitMessageEdit(messageId: string, newContent: string) {
    return { messageId, newContent };
  }

  @dispatch('message-delete', { bubbles: true, composed: true })
  private emitMessageDelete(messageId: string) {
    return { messageId };
  }

  @dispatch('message-react', { bubbles: true, composed: true })
  private emitMessageReact(messageId: string, emoji: string) {
    return { messageId, emoji };
  }

  @dispatch('typing-start', { bubbles: true, composed: true })
  private emitTypingStart() {
    return {};
  }

  @dispatch('typing-stop', { bubbles: true, composed: true })
  private emitTypingStop() {
    return {};
  }

  /**
   * Add a message
   */
  addMessage(message: Omit<ChatMessage, 'id'>): void {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
    };
    this.messages = [...this.messages, newMessage];
  }

  /**
   * Update a message
   */
  updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
    this.messages = this.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    this.messages = this.messages.filter((msg) => msg.id !== messageId);
  }

  /**
   * Add typing indicator
   */
  addTypingIndicator(user: string): void {
    this.typingIndicators.set(user, { user, timestamp: new Date() });
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator(user: string): void {
    this.typingIndicators.delete(user);
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    if (this.messagesArea) {
      this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
  }

  /**
   * Scroll to message
   */
  scrollToMessage(messageId: string): void {
    // Using dynamic querySelector for data attributes is acceptable
    const messageEl = this.shadowRoot?.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target !== this.inputField) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  private handleInput() {
    // Start typing indicator
    if (!this.typingTimeout) {
      this.emitTypingStart();
    }

    // Reset typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = window.setTimeout(() => {
      this.emitTypingStop();
      this.typingTimeout = null;
    }, 1000);
  }

  private sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;

    this.emitMessageSend(message);
    this.inputField.value = '';
    this.adjustTextareaHeight();

    // Stop typing
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    this.emitTypingStop();
  }

  private handleFileClick() {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.multiple = true;
      this.fileInput.addEventListener('change', () => this.handleFileSelect());
    }
    this.fileInput.click();
  }

  private handleFileSelect() {
    if (!this.fileInput?.files || this.fileInput.files.length === 0) return;

    const files = Array.from(this.fileInput.files);
    this.emitMessageSend('', files);
    this.fileInput.value = '';
  }

  private adjustTextareaHeight() {
    if (!this.inputField) return;
    this.inputField.style.height = 'auto';
    this.inputField.style.height = `${Math.min(this.inputField.scrollHeight, 150)}px`;
  }

  // Reactions are social: anyone can react to any message. Toggle the current
  // user on/off the emoji, update the local model, and emit for a backend.
  private handleReaction(messageId: string, emoji: string) {
    const me = this.currentUser;
    this.messages = this.messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.reactions ?? [])];
      const i = reactions.findIndex((r) => r.emoji === emoji);
      if (i === -1) {
        reactions.push({ emoji, count: 1, users: [me] });
      } else {
        const r = reactions[i];
        const removing = r.users.includes(me);
        const users = removing ? r.users.filter((u) => u !== me) : [...r.users, me];
        // Adjust by ±1 — never recompute from users.length, which destroys
        // server counts backed by truncated user lists (count 128, users [2]).
        const count = Math.max(users.length, r.count + (removing ? -1 : 1));
        if (count === 0) reactions.splice(i, 1);
        else reactions[i] = { ...r, count, users };
      }
      return { ...m, reactions };
    });
    this.emitMessageReact(messageId, emoji);
  }

  // Edit is inline: clicking edit swaps the body for a textarea. Owner-only.
  // Inline modes are exclusive: opening one closes the other.
  private startEdit(messageId: string) {
    this.confirmingDeleteId = null;
    this.editingId = messageId;
  }

  private cancelEdit() {
    this.editingId = null;
  }

  private commitEdit(messageId: string) {
    const next = (this.editField?.value ?? '').trim();
    const message = this.messages.find((m) => m.id === messageId);
    this.editingId = null;
    if (!message || !next || next === message.content) return;
    this.updateMessage(messageId, { content: next, edited: true });
    this.emitMessageEdit(messageId, next);
  }

  private handleEditKeydown(e: KeyboardEvent, messageId: string) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.commitEdit(messageId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cancelEdit();
    }
  }

  @watch('editingId')
  private focusEditField() {
    if (this.editingId === null) return;
    // Watchers run before the re-render is even scheduled (renders flush on
    // a microtask), so defer to a frame where the editor exists.
    requestAnimationFrame(() => {
      this.editField?.focus();
      // The editor is taller than the message body it replaces; on the last
      // message its Save/Cancel row would clip below the scroll area.
      this.editBox?.scrollIntoView({ block: 'nearest' });
    });
  }

  // Delete asks for inline confirmation (not a native confirm dialog).
  // Owner-only. On confirm, updates the local model and emits for a backend.
  // Inline modes are exclusive: opening one closes the other.
  private handleDelete(messageId: string) {
    this.editingId = null;
    this.confirmingDeleteId = messageId;
  }

  @watch('confirmingDeleteId')
  private revealDeleteConfirm() {
    if (this.confirmingDeleteId === null) return;
    // Same clipping problem as the inline editor: the confirm row extends
    // the last message past the bottom of the scroll area.
    requestAnimationFrame(() => this.confirmBox?.scrollIntoView({ block: 'nearest' }));
  }

  private confirmDelete(messageId: string) {
    this.confirmingDeleteId = null;
    this.deleteMessage(messageId);
    this.emitMessageDelete(messageId);
  }

  private cancelDelete() {
    this.confirmingDeleteId = null;
  }

  @render()
  render() {
    return html/*html*/`
      <div part="base" class="chat-container">
        <div part="messages" class="messages-area" role="log" aria-label="Conversation messages">
          ${this.messages.length === 0
            ? this.renderEmptyState()
            : this.messages.map((msg) => this.renderMessage(msg))}
        </div>
        ${this.showTyping && this.typingIndicators.size > 0 ? this.renderTypingIndicators() : ''}
        ${this.renderInputArea()}
      </div>
    `;
  }

  private renderEmptyState() {
    return html/*html*/`
      <div style="padding: 2rem;">
        <snice-empty-state 
          icon="💬" 
          title="No messages yet" 
          description="Start the conversation!"
          size="medium">
        </snice-empty-state>
      </div>
    `;
  }

  // Per-message author color. Precedence: per-message override → authorColors
  // map → auto (only when color-authors is set) → none (falls through to the
  // default token in CSS). Computed per element instance — no global registry.
  private resolveAuthorColor(message: ChatMessage): string {
    if (message.authorColor && isSafeCssColor(message.authorColor)) return message.authorColor;
    const mapped = this.authorColors[message.author];
    if (mapped && isSafeCssColor(mapped)) return mapped;
    if (this.colorAuthors) return autoAuthorColor(message.author);
    return '';
  }

  // Markdown is opt-in: per-message format='markdown', or the component-wide
  // `markdown` attribute (which a per-message format='text' can override).
  private shouldRenderMarkdown(message: ChatMessage): boolean {
    if (message.format === MessageFormat.Markdown) return true;
    if (this.markdown && message.format !== MessageFormat.Text) return true;
    return false;
  }

  private renderMessageBody(message: ChatMessage) {
    if (this.shouldRenderMarkdown(message)) {
      return html/*html*/`<snice-markdown part="message-text" class="message-text" .content=${message.content}></snice-markdown>`;
    }

    return html/*html*/`<div part="message-text" class="message-text">${message.content}</div>`;
  }

  private renderMessage(message: ChatMessage) {
    const isSystem = message.type === 'system';
    const isCurrentUser = message.author === this.currentUser;

    if (isSystem) {
      return html/*html*/`
        <div part="message system-message" class="message system" data-message-id="${message.id}">
          <div class="message-content">
            <div part="message-text" class="message-text">${message.content}</div>
          </div>
        </div>
      `;
    }

    const ownClass = isCurrentUser ? 'own' : 'other';
    const ownPart = isCurrentUser ? 'message-own' : 'message-other';
    const authorColor = this.resolveAuthorColor(message);
    const authorStyle = authorColor ? `--snice-chat-author-color:${authorColor}` : '';
    const isEditing = this.editingId === message.id;
    const isConfirmingDelete = this.confirmingDeleteId === message.id;
    const hasReactions = !!message.reactions && message.reactions.length > 0;

    return html/*html*/`
      <div part="message ${ownPart}" class="message ${ownClass}" data-message-id="${message.id}">
        ${this.showAvatars
          ? html`
              <div part="avatar" class="message-avatar">
                ${message.avatar
                  ? html`<img src="${message.avatar}" alt="${message.author}" />`
                  : getInitials(message.author)}
              </div>
            `
          : ''}
        <div class="message-content">
          <div class="message-header">
            <span part="author" class="message-author" style="${authorStyle}">${message.author}</span>
            ${this.showTimestamps
              ? html`<span part="timestamp" class="message-timestamp">${formatTime(message.timestamp)}</span>`
              : ''}
            ${message.edited ? html`<span part="edited" class="message-edited">(edited)</span>` : ''}
          </div>
          ${isEditing
            ? this.renderEditor(message)
            : message.content ? this.renderMessageBody(message) : ''}
          ${message.attachment ? this.renderAttachment(message.attachment) : ''}
          ${hasReactions ? this.renderReactions(message.id, message.reactions) : ''}
          ${isConfirmingDelete ? this.renderDeleteConfirm(message) : ''}
        </div>
        ${isEditing || isConfirmingDelete ? '' : this.renderActions(message.id, isCurrentUser)}
      </div>
    `;
  }

  // Inline message editor — replaces the body while editing. Enter saves,
  // Shift+Enter newlines, Esc cancels.
  private renderEditor(message: ChatMessage) {
    return html/*html*/`
      <div class="message-edit">
        <textarea
          part="edit-input"
          class="edit-field"
          .value=${message.content}
          @keydown=${(e: KeyboardEvent) => this.handleEditKeydown(e, message.id)}
        ></textarea>
        <div class="edit-actions">
          <button part="edit-save" class="edit-button edit-save" @click=${() => this.commitEdit(message.id)}>Save</button>
          <button part="edit-cancel" class="edit-button" @click=${() => this.cancelEdit()}>Cancel</button>
        </div>
      </div>
    `;
  }

  // Inline delete confirmation — replaces the hover actions while pending, so
  // a misclick can't destroy a message. Confirm deletes + emits; Cancel aborts.
  private renderDeleteConfirm(message: ChatMessage) {
    return html/*html*/`
      <div part="delete-confirm" class="message-confirm">
        <span class="confirm-text">Delete this message?</span>
        <div class="confirm-actions">
          <button part="delete-confirm-yes" class="confirm-button confirm-delete" @click=${() => this.confirmDelete(message.id)}>Delete</button>
          <button part="delete-confirm-no" class="confirm-button" @click=${() => this.cancelDelete()}>Cancel</button>
        </div>
      </div>
    `;
  }

  // Hover action menu. React is available on every message (you react to
  // others, not just yourself); edit and delete are owner-only.
  private renderActions(messageId: string, isCurrentUser: boolean) {
    return html/*html*/`
      <div part="actions" class="message-actions">
        <button class="action-button" @click=${() => this.handleReaction(messageId, '👍')} title="React" aria-label="React">
          <span class="action-emoji" aria-hidden="true">🙂</span>
        </button>
        ${isCurrentUser
          ? html`
              <button class="action-button" @click=${() => this.startEdit(messageId)} title="Edit" aria-label="Edit message">
                ${unsafeHTML(PENCIL)}
              </button>
              <button class="action-button" @click=${() => this.handleDelete(messageId)} title="Delete" aria-label="Delete message">
                ${unsafeHTML(TRASH)}
              </button>
            `
          : ''}
      </div>
    `;
  }

  private renderAttachment(attachment: ChatMessage['attachment']) {
    if (!attachment) return '';

    if (attachment.type === 'image') {
      return html/*html*/`
        <div part="attachment" class="message-attachment">
          <img src="${attachment.url}" alt="${attachment.name}" />
        </div>
      `;
    }

    return html/*html*/`
      <div part="attachment" class="message-attachment">
        <div class="attachment-file">
          <div class="attachment-icon">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M3.5 1.75a.25.25 0 0 1 .25-.25h3.5a.75.75 0 0 0 0 1.5h.75a.25.25 0 0 1 .25.25v2.75a.75.75 0 0 0 1.5 0V2.25c0-.69-.56-1.25-1.25-1.25h-.75c0-.69-.56-1.25-1.25-1.25h-4c-.69 0-1.25.56-1.25 1.25v11.5c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V6.25a.75.75 0 0 0-1.5 0v7.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25V1.75z"
              />
            </svg>
          </div>
          <div class="attachment-info">
            <div class="attachment-name">${attachment.name}</div>
            ${attachment.size
              ? html`<div class="attachment-size">${formatFileSize(attachment.size)}</div>`
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderReactions(
    messageId: string,
    reactions: ChatMessage['reactions']
  ) {
    if (!reactions || reactions.length === 0) return '';

    return html/*html*/`
      <div part="reactions" class="message-reactions">
        ${reactions.map((reaction) => {
          const isActive = reaction.users.includes(this.currentUser);
          return html`
            <div
              part="reaction ${isActive ? 'reaction-active' : ''}"
              class="reaction ${isActive ? 'active' : ''}"
              @click="${() => this.handleReaction(messageId, reaction.emoji)}"
            >
              <span class="reaction-emoji">${reaction.emoji}</span>
              <span class="reaction-count">${reaction.count}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderTypingIndicators() {
    const users = Array.from(this.typingIndicators.values());
    if (users.length === 0) return '';

    return html/*html*/`
      <div class="typing-indicators">
        <div part="typing-indicator" class="typing-indicator">
          <span>${users.map((u) => u.user).join(', ')} ${users.length === 1 ? 'is' : 'are'} typing</span>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;
  }

  private renderInputArea() {
    return html/*html*/`
      <div part="input-area" class="input-area">
        <div part="input-container" class="input-container">
          <textarea
            part="input"
            class="input-field"
            placeholder="${this.placeholder}"
            @input="${() => this.handleInput()}"
            @focus="${() => this.adjustTextareaHeight()}"
            rows="1"
          ></textarea>
          <div class="input-buttons">
            ${this.allowFiles
              ? html`
                  <button
                    class="input-button"
                    @click="${() => this.handleFileClick()}"
                    title="Attach file"
                  >
                    ${unsafeHTML(PAPER_CLIP)}
                  </button>
                `
              : ''}
            <button class="input-button send" @click="${() => this.sendMessage()}" title="Send">
              ${unsafeHTML(PAPER_AIRPLANE_SOLID)}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-chat': SniceChat;
  }
  interface HTMLElementEventMap extends SniceChatEventMap {}
}
