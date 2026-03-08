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

- `message-send` → `{ message: string; attachments?: File[] }` - Message sent
- `message-edit` → `{ messageId: string; newContent: string }` - Message edited
- `message-delete` → `{ messageId: string }` - Message deleted
- `message-react` → `{ messageId: string; emoji: string }` - Reaction added
- `message-thread` → `{ messageId: string }` - Thread started
- `typing-start` → `{}` - User started typing
- `typing-stop` → `{}` - User stopped typing

**CSS Parts:**
- `base` - Chat container
- `messages` - Messages scrollable area
- `input-area` - Input area wrapper
- `input-container` - Input + buttons container
- `input` - Textarea input field

## Message Types

- `text` - Text message
- `image` - Image attachment
- `file` - File attachment
- `system` - System notification

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

## Usage

```typescript
// Add message
chat.addMessage({
  type: 'text', content: 'Hello!', author: 'Alice', timestamp: new Date(),
});

// Handle send
chat.addEventListener('message-send', (e) => {
  chat.addMessage({ type: 'text', content: e.detail.message, author: 'You', timestamp: new Date() });
});

// Typing indicators
chat.addTypingIndicator('Alice');
chat.removeTypingIndicator('Alice');
```
