/**
 * Types for the snice-chat-message config-carrier element.
 *
 * snice-chat-message is the declarative authoring API for snice-chat: a message
 * is written as a child element, and the parent reads it via getMessageDefinition().
 * It renders only <slot> — the parent owns all message rendering.
 */
import type { ChatMessage, MessageType, MessageFormat, MessageReaction, MessageAttachment } from './snice-chat.types';

export interface SniceChatMessageElement extends HTMLElement {
  /** Message author name */
  author: string;
  /** Author avatar URL */
  avatar: string;
  /** Message type */
  type: MessageType;
  /** How the message body is rendered; undefined defers to the chat-level markdown flag */
  format?: MessageFormat;
  /** Whether the message has been edited */
  edited: boolean;
  /** Per-message author color override */
  authorColor: string;
  /** Reactions (property-only; no attribute form) */
  reactions?: MessageReaction[];
  /** Attachment (property-only; no attribute form) */
  attachment?: MessageAttachment;
  /** Thread replies (property-only; no attribute form) */
  thread?: ChatMessage[];
  /** Serialize this element into a ChatMessage for the parent chat */
  getMessageDefinition(): ChatMessage;
}
