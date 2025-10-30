import { element, property, render, styles, dispatch, query, watch, ready, dispose, html, css } from 'snice';
import type {
  ChatMessage,
  MessageType,
  TypingIndicator,
  SniceChatElement,
  SniceChatEventMap,
} from './snice-chat.types';
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
 * @fires {CustomEvent<{ messageId: string }>} message-thread - Fires when starting a thread
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

  @query('.messages-area')
  private messagesArea!: HTMLElement;

  @query('.input-field')
  private inputField!: HTMLTextAreaElement;

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
  }

  @dispose()
  cleanup() {
    this.removeEventListener('keydown', this.handleKeyDown);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  @watch('messages')
  private messagesChanged() {
    // Scroll to bottom when new message added
    setTimeout(() => this.scrollToBottom(), 0);
  }

  @dispatch('message-send')
  private emitMessageSend(
    message: string,
    attachments?: File[]
  ): CustomEvent<{ message: string; attachments?: File[] }> {
    return new CustomEvent('message-send', {
      detail: { message, attachments },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('message-edit')
  private emitMessageEdit(
    messageId: string,
    newContent: string
  ): CustomEvent<{ messageId: string; newContent: string }> {
    return new CustomEvent('message-edit', {
      detail: { messageId, newContent },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('message-delete')
  private emitMessageDelete(messageId: string): CustomEvent<{ messageId: string }> {
    return new CustomEvent('message-delete', {
      detail: { messageId },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('message-react')
  private emitMessageReact(
    messageId: string,
    emoji: string
  ): CustomEvent<{ messageId: string; emoji: string }> {
    return new CustomEvent('message-react', {
      detail: { messageId, emoji },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('message-thread')
  private emitMessageThread(messageId: string): CustomEvent<{ messageId: string }> {
    return new CustomEvent('message-thread', {
      detail: { messageId },
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('typing-start')
  private emitTypingStart(): CustomEvent<{}> {
    return new CustomEvent('typing-start', {
      bubbles: true,
      composed: true,
    });
  }

  @dispatch('typing-stop')
  private emitTypingStop(): CustomEvent<{}> {
    return new CustomEvent('typing-stop', {
      bubbles: true,
      composed: true,
    });
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

  private handleReaction(messageId: string, emoji: string) {
    this.emitMessageReact(messageId, emoji);
  }

  private handleEdit(messageId: string) {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return;

    // Simple prompt for now - in a real app, this would be inline editing
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      this.emitMessageEdit(messageId, newContent);
    }
  }

  private handleDelete(messageId: string) {
    if (confirm('Delete this message?')) {
      this.emitMessageDelete(messageId);
    }
  }

  private handleThread(messageId: string) {
    this.emitMessageThread(messageId);
  }

  @render()
  render() {
    return html/*html*/`
      <div class="chat-container">
        <div class="messages-area">
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
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          />
        </svg>
        <div>No messages yet</div>
        <div style="font-size: 13px; margin-top: 4px;">Start the conversation!</div>
      </div>
    `;
  }

  private renderMessage(message: ChatMessage) {
    const isSystem = message.type === 'system';
    const isCurrentUser = message.author === this.currentUser;

    if (isSystem) {
      return html/*html*/`
        <div class="message system" data-message-id="${message.id}">
          <div class="message-content">
            <div class="message-text">${message.content}</div>
          </div>
        </div>
      `;
    }

    return html/*html*/`
      <div class="message" data-message-id="${message.id}">
        ${this.showAvatars
          ? html`
              <div class="message-avatar">
                ${message.avatar
                  ? html`<img src="${message.avatar}" alt="${message.author}" />`
                  : getInitials(message.author)}
              </div>
            `
          : ''}
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${message.author}</span>
            ${this.showTimestamps
              ? html`<span class="message-timestamp">${formatTime(message.timestamp)}</span>`
              : ''}
            ${message.edited ? html`<span class="message-edited">(edited)</span>` : ''}
          </div>
          ${message.content ? html`<div class="message-text">${message.content}</div>` : ''}
          ${message.attachment ? this.renderAttachment(message.attachment) : ''}
          ${message.reactions && message.reactions.length > 0
            ? this.renderReactions(message.id, message.reactions, isCurrentUser)
            : ''}
        </div>
        ${isCurrentUser
          ? html`
              <div class="message-actions">
                <button
                  class="action-button"
                  @click="${() => this.handleReaction(message.id, '👍')}"
                  title="React"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM5.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8 11c1.5 0 2.7-1 3.2-2H4.8c.5 1 1.7 2 3.2 2z"
                    />
                  </svg>
                </button>
                <button
                  class="action-button"
                  @click="${() => this.handleEdit(message.id)}"
                  title="Edit"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61z"
                    />
                  </svg>
                </button>
                <button
                  class="action-button"
                  @click="${() => this.handleDelete(message.id)}"
                  title="Delete"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15z"
                    />
                  </svg>
                </button>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private renderAttachment(attachment: ChatMessage['attachment']) {
    if (!attachment) return '';

    if (attachment.type === 'image') {
      return html/*html*/`
        <div class="message-attachment">
          <img src="${attachment.url}" alt="${attachment.name}" />
        </div>
      `;
    }

    return html/*html*/`
      <div class="message-attachment">
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
    reactions: ChatMessage['reactions'],
    isCurrentUser: boolean
  ) {
    if (!reactions || reactions.length === 0) return '';

    return html/*html*/`
      <div class="message-reactions">
        ${reactions.map(
          (reaction) => html`
            <div
              class="reaction ${reaction.users.includes(this.currentUser) ? 'active' : ''}"
              @click="${() => this.handleReaction(messageId, reaction.emoji)}"
            >
              <span class="reaction-emoji">${reaction.emoji}</span>
              <span class="reaction-count">${reaction.count}</span>
            </div>
          `
        )}
      </div>
    `;
  }

  private renderTypingIndicators() {
    const users = Array.from(this.typingIndicators.values());
    if (users.length === 0) return '';

    return html/*html*/`
      <div class="typing-indicators">
        <div class="typing-indicator">
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
      <div class="input-area">
        <div class="input-container">
          <textarea
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
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path
                        d="M11.28 6.22a.75.75 0 0 0-1.06 0L7.25 9.19 5.78 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0 0-1.06zM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0z"
                      />
                    </svg>
                  </button>
                `
              : ''}
            <button class="input-button send" @click="${() => this.sendMessage()}" title="Send">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M1.724 2.016a.75.75 0 0 1 1.048-.964l12.5 7a.75.75 0 0 1 0 1.292l-12.5 7a.75.75 0 0 1-1.048-.964l1.5-6.5a.75.75 0 0 1 .584-.584l5.916-1.188-5.916-1.188a.75.75 0 0 1-.584-.584l-1.5-6.5z"
                />
              </svg>
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
