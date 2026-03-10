<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/chat.md -->

# Chat Component

Slack-style chat interface with messages, typing indicators, reactions, file attachments, and message threading.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `messages` | `ChatMessage[]` | `[]` | Chat messages (property only) |
| `currentUser` (attr: `current-user`) | `string` | `'You'` | Current user name |
| `currentAvatar` (attr: `current-avatar`) | `string` | `''` | Current user avatar URL |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `allowFiles` (attr: `allow-files`) | `boolean` | `true` | Enable file uploads |
| `showTyping` (attr: `show-typing`) | `boolean` | `true` | Show typing indicators |
| `showAvatars` (attr: `show-avatars`) | `boolean` | `true` | Show user avatars |
| `showTimestamps` (attr: `show-timestamps`) | `boolean` | `true` | Show message timestamps |

### ChatMessage Interface

```typescript
interface ChatMessage {
  id: string;
  type: 'text' | 'file' | 'image' | 'system';
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

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addMessage()` | `message: Omit<ChatMessage, 'id'>` | Add a new message |
| `updateMessage()` | `messageId: string, updates: Partial<ChatMessage>` | Update an existing message |
| `deleteMessage()` | `messageId: string` | Delete a message by ID |
| `addTypingIndicator()` | `user: string` | Show typing indicator for a user |
| `removeTypingIndicator()` | `user: string` | Remove typing indicator for a user |
| `clear()` | -- | Clear all messages |
| `scrollToBottom()` | -- | Scroll to the bottom of the chat |
| `scrollToMessage()` | `messageId: string` | Scroll to a specific message |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `message-send` | `{ message: string, attachments?: File[] }` | User sends a message |
| `message-edit` | `{ messageId: string, newContent: string }` | User edits a message |
| `message-delete` | `{ messageId: string }` | User deletes a message |
| `message-react` | `{ messageId: string, emoji: string }` | User reacts to a message |
| `message-thread` | `{ messageId: string }` | User starts a thread |
| `typing-start` | `{}` | Current user starts typing |
| `typing-stop` | `{}` | Current user stops typing |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-chat-height` | Chat container height |
| `--snice-chat-border-radius` | Container border radius |
| `--snice-chat-text-color` | Primary text color |
| `--snice-chat-background` | Background color |
| `--snice-chat-border-color` | Border color |
| `--snice-chat-author-color` | Author name color |
| `--snice-chat-timestamp-color` | Timestamp text color |
| `--snice-chat-system-color` | System message color |
| `--snice-chat-placeholder-color` | Input placeholder color |
| `--snice-chat-scrollbar-color` | Scrollbar thumb color |
| `--snice-chat-scrollbar-hover-color` | Scrollbar hover color |
| `--snice-chat-avatar-background` | Avatar background color |
| `--snice-chat-avatar-text-color` | Avatar text color |
| `--snice-chat-attachment-border` | Attachment border color |
| `--snice-chat-attachment-background` | Attachment background |
| `--snice-chat-attachment-icon-background` | Attachment icon background |
| `--snice-chat-attachment-icon-color` | Attachment icon color |
| `--snice-chat-reaction-background` | Reaction background |
| `--snice-chat-reaction-border` | Reaction border |
| `--snice-chat-reaction-hover-background` | Reaction hover background |
| `--snice-chat-reaction-active-background` | Active reaction background |
| `--snice-chat-reaction-active-color` | Active reaction text color |
| `--snice-chat-reaction-active-border` | Active reaction border |
| `--snice-chat-actions-background` | Actions menu background |
| `--snice-chat-action-color` | Action icon color |
| `--snice-chat-action-hover-background` | Action hover background |
| `--snice-chat-typing-color` | Typing indicator text color |
| `--snice-chat-typing-dot-color` | Typing indicator dot color |
| `--snice-chat-input-background` | Input field background |
| `--snice-chat-input-container-background` | Input area background |
| `--snice-chat-input-border` | Input border |
| `--snice-chat-input-focus-border` | Input focus border |
| `--snice-chat-button-color` | Button icon color |
| `--snice-chat-button-hover-background` | Button hover background |
| `--snice-chat-send-color` | Send button text color |
| `--snice-chat-send-background` | Send button background |
| `--snice-chat-send-hover-background` | Send button hover background |
| `--snice-chat-empty-color` | Empty state text color |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The chat container |
| `messages` | The scrollable messages area |
| `input-area` | The input area wrapper |
| `input-container` | Container holding the input and buttons |
| `input` | The message input field |

## Basic Usage

```html
<snice-chat id="chat" current-user="You"></snice-chat>
```

```typescript
import 'snice/components/chat/snice-chat';

chat.addEventListener('message-send', (e) => {
  chat.addMessage({
    type: 'text',
    content: e.detail.message,
    author: 'You',
    timestamp: new Date(),
  });
});
```

## Examples

### With Avatars

Use `current-avatar` and the `avatar` field on messages for user profile images.

```html
<snice-chat current-user="Alice" current-avatar="https://example.com/alice.jpg"></snice-chat>

<script>
  chat.addMessage({
    type: 'text', content: 'Hello!', author: 'Bob',
    avatar: 'https://example.com/bob.jpg', timestamp: new Date()
  });
</script>
```

### With File Attachments

Add messages with `attachment` objects for images and files.

```javascript
chat.addMessage({
  type: 'image', content: '', author: 'Alice', timestamp: new Date(),
  attachment: { type: 'image', url: 'https://example.com/image.jpg', name: 'vacation.jpg' }
});

chat.addMessage({
  type: 'file', content: '', author: 'Bob', timestamp: new Date(),
  attachment: { type: 'file', url: 'https://example.com/doc.pdf', name: 'report.pdf', size: 245760 }
});
```

### With Reactions

Add messages with `reactions` and handle the `message-react` event.

```javascript
chat.addMessage({
  type: 'text', content: 'Great work!', author: 'Alice', timestamp: new Date(),
  reactions: [
    { emoji: '\ud83d\udc4d', count: 3, users: ['Bob', 'Charlie', 'Diana'] },
    { emoji: '\ud83c\udf89', count: 1, users: ['Eve'] }
  ]
});

chat.addEventListener('message-react', (e) => {
  console.log('Reaction:', e.detail.emoji, 'on message:', e.detail.messageId);
});
```

### System Messages

Use `type: 'system'` for notification-style messages.

```javascript
chat.addMessage({
  type: 'system', content: 'Alice joined the channel', author: 'System', timestamp: new Date()
});
```

### Typing Indicators

Use `addTypingIndicator()` and `removeTypingIndicator()` to show typing state.

```javascript
chat.addTypingIndicator('Alice');

setTimeout(() => {
  chat.removeTypingIndicator('Alice');
  chat.addMessage({
    type: 'text', content: 'Sorry for the delay!', author: 'Alice', timestamp: new Date()
  });
}, 2000);
```

## Accessibility

- Keyboard navigation for messages and controls
- ARIA roles for chat structure
- Screen reader friendly message announcements
