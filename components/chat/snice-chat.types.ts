/**
 * Types for the snice-chat component
 */

/**
 * Message types
 */
export type MessageType = 'text' | 'file' | 'image' | 'system';

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  author: string;
  avatar?: string;
  timestamp: Date;
  edited?: boolean;
  reactions?: MessageReaction[];
  thread?: ChatMessage[];
  attachment?: MessageAttachment;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
}

/**
 * Message reaction
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  user: string;
  timestamp: Date;
}

/**
 * Custom events
 */
export interface SniceChatEventMap {
  'message-send': CustomEvent<{ message: string; attachments?: File[] }>;
  'message-edit': CustomEvent<{ messageId: string; newContent: string }>;
  'message-delete': CustomEvent<{ messageId: string }>;
  'message-react': CustomEvent<{ messageId: string; emoji: string }>;
  'message-thread': CustomEvent<{ messageId: string }>;
  'typing-start': CustomEvent<{}>;
  'typing-stop': CustomEvent<{}>;
}

/**
 * snice-chat element interface
 */
export interface SniceChatElement extends HTMLElement {
  /**
   * Chat messages
   */
  messages: ChatMessage[];

  /**
   * Current user name
   */
  currentUser: string;

  /**
   * Current user avatar URL
   */
  currentAvatar: string;

  /**
   * Placeholder for input
   */
  placeholder: string;

  /**
   * Whether file uploads are enabled
   */
  allowFiles: boolean;

  /**
   * Whether to show typing indicators
   */
  showTyping: boolean;

  /**
   * Whether to show avatars
   */
  showAvatars: boolean;

  /**
   * Whether to show timestamps
   */
  showTimestamps: boolean;

  /**
   * Add a message
   */
  addMessage(message: Omit<ChatMessage, 'id'>): void;

  /**
   * Update a message
   */
  updateMessage(messageId: string, updates: Partial<ChatMessage>): void;

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void;

  /**
   * Add typing indicator
   */
  addTypingIndicator(user: string): void;

  /**
   * Remove typing indicator
   */
  removeTypingIndicator(user: string): void;

  /**
   * Clear all messages
   */
  clear(): void;

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void;

  /**
   * Scroll to message
   */
  scrollToMessage(messageId: string): void;
}
