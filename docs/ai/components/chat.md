# snice-chat

Slack-style chat interface with messages, typing indicators, reactions, and file attachments.

## Usage

```html
<snice-chat current-user="You"></snice-chat>
```

## Properties

- `messages: ChatMessage[]` - Messages array (property only)
- `currentUser: string` - Current user name (default: `"You"`)
- `currentAvatar: string` - Current user avatar URL (default: `""`)
- `placeholder: string` - Input placeholder (default: `"Type a message..."`)
- `allowFiles: boolean` - Enable file uploads (default: `true`)
- `showTyping: boolean` - Show typing indicators (default: `true`)
- `showAvatars: boolean` - Show user avatars (default: `true`)
- `showTimestamps: boolean` - Show timestamps (default: `true`)

## Methods

- `addMessage(message: Omit<ChatMessage, 'id'>): void` - Add message
- `updateMessage(messageId: string, updates: Partial<ChatMessage>): void` - Update message
- `deleteMessage(messageId: string): void` - Delete message
- `addTypingIndicator(user: string): void` - Add typing indicator
- `removeTypingIndicator(user: string): void` - Remove typing indicator
- `clear(): void` - Clear messages
- `scrollToBottom(): void` - Scroll to bottom
- `scrollToMessage(messageId: string): void` - Scroll to message

## Events

- `message-send: CustomEvent<{ message: string; attachments?: File[] }>` - Message sent
- `message-edit: CustomEvent<{ messageId: string; newContent: string }>` - Message edited
- `message-delete: CustomEvent<{ messageId: string }>` - Message deleted
- `message-react: CustomEvent<{ messageId: string; emoji: string }>` - Reaction added
- `message-thread: CustomEvent<{ messageId: string }>` - Thread started
- `typing-start: CustomEvent<{}>` - User started typing
- `typing-stop: CustomEvent<{}>` - User stopped typing

## Message Types

- `text` - Text message
- `image` - Image attachment
- `file` - File attachment
- `system` - System notification

## CSS Variables

```css
--snice-chat-height
--snice-chat-border-radius
--snice-chat-text-color
--snice-chat-background
--snice-chat-border-color
--snice-chat-author-color
--snice-chat-timestamp-color
--snice-chat-system-color
--snice-chat-placeholder-color
--snice-chat-scrollbar-color
--snice-chat-scrollbar-hover-color
--snice-chat-avatar-background
--snice-chat-avatar-text-color
--snice-chat-attachment-border
--snice-chat-attachment-background
--snice-chat-attachment-icon-background
--snice-chat-attachment-icon-color
--snice-chat-reaction-background
--snice-chat-reaction-border
--snice-chat-reaction-hover-background
--snice-chat-reaction-active-background
--snice-chat-reaction-active-color
--snice-chat-reaction-active-border
--snice-chat-actions-background
--snice-chat-action-color
--snice-chat-action-hover-background
--snice-chat-typing-color
--snice-chat-typing-dot-color
--snice-chat-input-background
--snice-chat-input-container-background
--snice-chat-input-border
--snice-chat-input-focus-border
--snice-chat-button-color
--snice-chat-button-hover-background
--snice-chat-send-color
--snice-chat-send-background
--snice-chat-send-hover-background
--snice-chat-empty-color
```

## Types

```typescript
type MessageType = 'text' | 'file' | 'image' | 'system';

interface ChatMessage {
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

interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}
```

## Example

```javascript
const chat = document.querySelector('snice-chat');

// Add message
chat.addMessage({
  type: 'text',
  content: 'Hello!',
  author: 'Alice',
  avatar: 'https://example.com/alice.jpg',
  timestamp: new Date(),
  formats: [],
});

// Add image
chat.addMessage({
  type: 'image',
  content: '',
  author: 'Bob',
  timestamp: new Date(),
  formats: [],
  attachment: {
    type: 'image',
    url: 'https://example.com/image.jpg',
    name: 'photo.jpg',
  },
});

// Add reaction
chat.addEventListener('message-react', (e) => {
  const message = chat.messages.find((m) => m.id === e.detail.messageId);
  const reactions = message.reactions || [];
  reactions.push({ emoji: e.detail.emoji, count: 1, users: [chat.currentUser] });
  chat.updateMessage(e.detail.messageId, { reactions });
});

// Typing indicator
chat.addTypingIndicator('Alice');
setTimeout(() => chat.removeTypingIndicator('Alice'), 2000);

// Send message
chat.addEventListener('message-send', (e) => {
  chat.addMessage({
    type: 'text',
    content: e.detail.message,
    author: 'You',
    timestamp: new Date(),
    formats: [],
  });
});
```

## Features

- Text, image, file, system messages
- Edit, delete, react to messages
- Typing indicators
- User avatars with initials fallback
- Timestamps
- Auto-scroll to new messages
- File upload support
- Emoji reactions with counts
- Message actions (edit, delete)
