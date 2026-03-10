# snice-chat

Slack-style chat interface with messages, typing indicators, reactions, and file attachments.

## Properties

```typescript
messages: ChatMessage[] = [];           // property only
currentUser: string = 'You';           // attribute: current-user
currentAvatar: string = '';            // attribute: current-avatar
placeholder: string = 'Type a message...';
allowFiles: boolean = true;            // attribute: allow-files
showTyping: boolean = true;            // attribute: show-typing
showAvatars: boolean = true;           // attribute: show-avatars
showTimestamps: boolean = true;        // attribute: show-timestamps
```

## Methods

- `addMessage(message: Omit<ChatMessage, 'id'>)` - Add message
- `updateMessage(messageId: string, updates: Partial<ChatMessage>)` - Update message
- `deleteMessage(messageId: string)` - Delete message
- `addTypingIndicator(user: string)` - Show typing indicator
- `removeTypingIndicator(user: string)` - Remove typing indicator
- `clear()` - Clear all messages
- `scrollToBottom()` - Scroll to bottom
- `scrollToMessage(messageId: string)` - Scroll to message

## Events

- `message-send` -> `{ message: string, attachments?: File[] }`
- `message-edit` -> `{ messageId: string, newContent: string }`
- `message-delete` -> `{ messageId: string }`
- `message-react` -> `{ messageId: string, emoji: string }`
- `message-thread` -> `{ messageId: string }`
- `typing-start` -> `{}`
- `typing-stop` -> `{}`

## CSS Parts

- `base` - Chat container
- `messages` - Messages scrollable area
- `input-area` - Input area wrapper
- `input-container` - Input + buttons container
- `input` - Textarea input field

## Basic Usage

```html
<snice-chat current-user="You"></snice-chat>
```

```typescript
import 'snice/components/chat/snice-chat';

chat.addMessage({ type: 'text', content: 'Hello!', author: 'Alice', timestamp: new Date() });

chat.addEventListener('message-send', (e) => {
  chat.addMessage({ type: 'text', content: e.detail.message, author: 'You', timestamp: new Date() });
});

chat.addTypingIndicator('Alice');
chat.removeTypingIndicator('Alice');
```

## Accessibility

- Keyboard navigation for messages and controls
- ARIA roles for chat structure
