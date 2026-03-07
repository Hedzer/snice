<!-- AI: For a low-token version of this doc, use docs/ai/components/chat.md instead -->

# snice-chat

A Slack-style chat interface component with messages, typing indicators, reactions, and file attachments.

## Properties

| Property          | Attribute          | Type      | Default                  | Description                           |
| ----------------- | ------------------ | --------- | ------------------------ | ------------------------------------- |
| `messages`        | -                  | `ChatMessage[]` | `[]`            | Chat messages (property only)          |
| `currentUser`     | `current-user`     | `string`  | `"You"`                  | Current user name                     |
| `currentAvatar`   | `current-avatar`   | `string`  | `""`                     | Current user avatar URL               |
| `placeholder`     | `placeholder`      | `string`  | `"Type a message..."`    | Input placeholder text                |
| `allowFiles`      | `allow-files`      | `boolean` | `true`                   | Whether file uploads are enabled      |
| `showTyping`      | `show-typing`      | `boolean` | `true`                   | Whether to show typing indicators     |
| `showAvatars`     | `show-avatars`     | `boolean` | `true`                   | Whether to show user avatars          |
| `showTimestamps`  | `show-timestamps`  | `boolean` | `true`                   | Whether to show message timestamps    |

## Methods

### `addMessage(message: Omit<ChatMessage, 'id'>): void`

Add a new message to the chat.

```javascript
chat.addMessage({
  type: 'text',
  content: 'Hello, world!',
  author: 'Alice',
  avatar: 'https://example.com/alice.jpg',
  timestamp: new Date(),
});
```

### `updateMessage(messageId: string, updates: Partial<ChatMessage>): void`

Update an existing message.

```javascript
chat.updateMessage(messageId, {
  content: 'Updated content',
  edited: true,
});
```

### `deleteMessage(messageId: string): void`

Delete a message by ID.

```javascript
chat.deleteMessage(messageId);
```

### `addTypingIndicator(user: string): void`

Add a typing indicator for a user.

```javascript
chat.addTypingIndicator('Alice');
```

### `removeTypingIndicator(user: string): void`

Remove a typing indicator for a user.

```javascript
chat.removeTypingIndicator('Alice');
```

### `clear(): void`

Clear all messages.

```javascript
chat.clear();
```

### `scrollToBottom(): void`

Scroll to the bottom of the chat.

```javascript
chat.scrollToBottom();
```

### `scrollToMessage(messageId: string): void`

Scroll to a specific message.

```javascript
chat.scrollToMessage(messageId);
```

## Events

### `message-send`

Emitted when the user sends a message.

```javascript
chat.addEventListener('message-send', (e) => {
  console.log('Message:', e.detail.message);
  console.log('Attachments:', e.detail.attachments);
});
```

**Detail:**
- `message: string` - The message text
- `attachments?: File[]` - Optional file attachments

### `message-edit`

Emitted when the user edits a message.

```javascript
chat.addEventListener('message-edit', (e) => {
  console.log('Message ID:', e.detail.messageId);
  console.log('New content:', e.detail.newContent);
});
```

**Detail:**
- `messageId: string` - The message ID
- `newContent: string` - The new message content

### `message-delete`

Emitted when the user deletes a message.

```javascript
chat.addEventListener('message-delete', (e) => {
  console.log('Deleted:', e.detail.messageId);
});
```

**Detail:**
- `messageId: string` - The message ID

### `message-react`

Emitted when the user reacts to a message.

```javascript
chat.addEventListener('message-react', (e) => {
  console.log('Message ID:', e.detail.messageId);
  console.log('Emoji:', e.detail.emoji);
});
```

**Detail:**
- `messageId: string` - The message ID
- `emoji: string` - The emoji reaction

### `message-thread`

Emitted when the user starts a thread.

```javascript
chat.addEventListener('message-thread', (e) => {
  console.log('Thread for:', e.detail.messageId);
});
```

**Detail:**
- `messageId: string` - The message ID

### `typing-start`

Emitted when the current user starts typing.

```javascript
chat.addEventListener('typing-start', () => {
  console.log('User started typing');
});
```

### `typing-stop`

Emitted when the current user stops typing.

```javascript
chat.addEventListener('typing-stop', () => {
  console.log('User stopped typing');
});
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The chat container |
| `messages` | `<div>` | The scrollable messages area |
| `input-area` | `<div>` | The input area wrapper |
| `input-container` | `<div>` | Container holding the input and buttons |
| `input` | `<textarea>` | The message input field |

```css
snice-chat::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-chat::part(messages) {
  padding: 1rem;
}

snice-chat::part(input) {
  font-size: 0.875rem;
}
```

## Basic Usage

```html
<snice-chat id="chat" current-user="You"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  // Listen for messages
  chat.addEventListener('message-send', (e) => {
    console.log('New message:', e.detail.message);

    // Add message to chat
    chat.addMessage({
      type: 'text',
      content: e.detail.message,
      author: 'You',
      timestamp: new Date(),
    });
  });
</script>
```

## Examples

### Basic Chat

```html
<snice-chat id="chat"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  chat.addEventListener('message-send', (e) => {
    chat.addMessage({
      type: 'text',
      content: e.detail.message,
      author: 'You',
      timestamp: new Date(),
    });
  });
</script>
```

### With Avatars

```html
<snice-chat id="chat" current-user="Alice" current-avatar="https://example.com/alice.jpg"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  chat.addMessage({
    type: 'text',
    content: 'Hello!',
    author: 'Bob',
    avatar: 'https://example.com/bob.jpg',
    timestamp: new Date(),
  });
</script>
```

### With File Attachments

```html
<snice-chat id="chat"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  chat.addMessage({
    type: 'image',
    content: '',
    author: 'Alice',
    timestamp: new Date(),
    attachment: {
      type: 'image',
      url: 'https://example.com/image.jpg',
      name: 'vacation.jpg',
    },
  });

  chat.addMessage({
    type: 'file',
    content: '',
    author: 'Bob',
    timestamp: new Date(),
    attachment: {
      type: 'file',
      url: 'https://example.com/document.pdf',
      name: 'report.pdf',
      size: 245760,
    },
  });
</script>
```

### With Reactions

```html
<snice-chat id="chat"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  chat.addMessage({
    type: 'text',
    content: 'Great work!',
    author: 'Alice',
    timestamp: new Date(),
    reactions: [
      { emoji: '👍', count: 3, users: ['Bob', 'Charlie', 'Diana'] },
      { emoji: '🎉', count: 1, users: ['Eve'] },
    ],
  });

  chat.addEventListener('message-react', (e) => {
    const message = chat.messages.find((m) => m.id === e.detail.messageId);
    if (message) {
      const reactions = message.reactions || [];
      const existing = reactions.find((r) => r.emoji === e.detail.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(chat.currentUser);
      } else {
        reactions.push({ emoji: e.detail.emoji, count: 1, users: [chat.currentUser] });
      }
      chat.updateMessage(e.detail.messageId, { reactions });
    }
  });
</script>
```

### System Messages

```html
<snice-chat id="chat"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  chat.addMessage({
    type: 'system',
    content: 'Alice joined the channel',
    author: 'System',
    timestamp: new Date(),
  });
</script>
```

### Typing Indicators

```html
<snice-chat id="chat"></snice-chat>

<script type="module">
  import 'snice';

  const chat = document.getElementById('chat');

  // Simulate Alice typing
  chat.addTypingIndicator('Alice');

  setTimeout(() => {
    chat.removeTypingIndicator('Alice');
    chat.addMessage({
      type: 'text',
      content: 'Sorry for the delay!',
      author: 'Alice',
      timestamp: new Date(),
    });
  }, 2000);
</script>
```

## Features

- **Message types** - Text, images, files, and system messages
- **Rich interactions** - Edit, delete, react to messages
- **Typing indicators** - Show when users are typing
- **File attachments** - Support for images and files
- **Message reactions** - Emoji reactions with count
- **User avatars** - Display user profile images or initials
- **Timestamps** - Show message times
- **Auto-scroll** - Automatically scroll to new messages
- **Customizable styling** - CSS custom properties for theming

## Message Types

The chat supports different message types:

- `text` - Regular text message
- `image` - Image attachment
- `file` - File attachment
- `system` - System notification

## Styling

The component can be styled using CSS custom properties:

```css
snice-chat {
  /* Dimensions */
  --snice-chat-height: 600px;
  --snice-chat-border-radius: 8px;

  /* Colors */
  --snice-chat-text-color: #1d1c1d;
  --snice-chat-background: #fff;
  --snice-chat-border-color: #ddd;
  --snice-chat-author-color: #1d1c1d;
  --snice-chat-timestamp-color: #616061;
  --snice-chat-system-color: #616061;
  --snice-chat-placeholder-color: #616061;

  /* Scrollbar */
  --snice-chat-scrollbar-color: #ccc;
  --snice-chat-scrollbar-hover-color: #999;

  /* Avatar */
  --snice-chat-avatar-background: #e0e0e0;
  --snice-chat-avatar-text-color: #fff;

  /* Attachments */
  --snice-chat-attachment-border: #ddd;
  --snice-chat-attachment-background: #f8f8f8;
  --snice-chat-attachment-icon-background: #e0e0e0;
  --snice-chat-attachment-icon-color: #666;

  /* Reactions */
  --snice-chat-reaction-background: #f0f0f0;
  --snice-chat-reaction-border: #ddd;
  --snice-chat-reaction-hover-background: #e0e0e0;
  --snice-chat-reaction-active-background: #1264a3;
  --snice-chat-reaction-active-color: #fff;
  --snice-chat-reaction-active-border: #1264a3;

  /* Actions */
  --snice-chat-actions-background: #fff;
  --snice-chat-action-color: #616061;
  --snice-chat-action-hover-background: #f0f0f0;

  /* Typing indicator */
  --snice-chat-typing-color: #616061;
  --snice-chat-typing-dot-color: #616061;

  /* Input */
  --snice-chat-input-background: #fff;
  --snice-chat-input-container-background: #fff;
  --snice-chat-input-border: #ddd;
  --snice-chat-input-focus-border: #1264a3;
  --snice-chat-button-color: #616061;
  --snice-chat-button-hover-background: #f0f0f0;
  --snice-chat-send-color: #fff;
  --snice-chat-send-background: #1264a3;
  --snice-chat-send-hover-background: #0e5a8e;

  /* Empty state */
  --snice-chat-empty-color: #616061;
}
```

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM
- ES2020+

## TypeScript

Full TypeScript support with exported types:

```typescript
import type { ChatMessage, MessageType, SniceChatElement } from 'snice/chat';
```
