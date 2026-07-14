import { element, property, render, html } from 'snice';
import type { MessageFormat } from './snice-chat.types';
import type { ChatMessage, MessageType, MessageReaction, MessageAttachment } from './snice-chat.types';
import type { SniceChatMessageElement } from './snice-chat-message.types';

/**
 * snice-chat-message - declarative message authoring for snice-chat.
 *
 * A config-carrier element (same pattern as snice-column): it renders only a
 * <slot> and exposes getMessageDefinition() so the parent snice-chat can read
 * its props + slotted body as a ChatMessage. It does not render the message
 * itself — the parent owns all rendering and the styling part surface.
 *
 * @element snice-chat-message
 */
@element('snice-chat-message')
export class SniceChatMessage extends HTMLElement implements SniceChatMessageElement {
  @property()
  author: string = '';

  @property()
  avatar: string = '';

  @property()
  type: MessageType = 'text';

  // No default: undefined defers to the chat-level `markdown` flag, exactly
  // like an imperative addMessage() without a format.
  @property()
  format?: MessageFormat;

  @property({ type: Boolean })
  edited: boolean = false;

  @property({ attribute: 'author-color' })
  authorColor: string = '';

  // Rich fields have no attribute form — set them as JS properties.
  @property({ type: Array, attribute: false })
  reactions?: MessageReaction[];

  @property({ type: Object, attribute: false })
  attachment?: MessageAttachment;

  @property({ type: Array, attribute: false })
  thread?: ChatMessage[];

  @render()
  render() {
    return html/*html*/`<slot></slot>`;
  }

  /** Serialize this element into a ChatMessage for the parent chat. */
  getMessageDefinition(): ChatMessage {
    const timestampAttr = this.getAttribute('timestamp');
    const definition: ChatMessage = {
      id: '',
      type: this.type,
      content: (this.textContent ?? '').trim(),
      author: this.author,
      timestamp: timestampAttr ? new Date(timestampAttr) : new Date(),
      edited: this.edited,
    };

    if (this.format) definition.format = this.format;
    if (this.avatar) definition.avatar = this.avatar;
    if (this.authorColor) definition.authorColor = this.authorColor;
    if (this.reactions) definition.reactions = this.reactions;
    if (this.attachment) definition.attachment = this.attachment;
    if (this.thread) definition.thread = this.thread;

    return definition;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-chat-message': SniceChatMessage;
  }
}
