# snice-chat

Slack-style chat interface with messages, typing indicators, reactions, and file attachments.

## Components

- `snice-chat` - container
- `snice-chat-message` - declarative message child (rendered first; `messages`-array entries append after)

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
authorColors: Record<string,string> = {};  // property only; per-author colors
colorAuthors: boolean = false;         // attribute: color-authors; auto color per author
markdown: boolean = false;             // render bodies as markdown by default
layout: 'default' | 'bubbles' = 'default';  // 'bubbles' = aligned colored bubbles
```

ChatMessage adds: `format?: 'text'|'markdown'` (unset = chat-level `markdown` applies), `authorColor?: string` (CSS color; values containing `;`/`{`/`}` are rejected).

### snice-chat-message attributes

```typescript
author: string = '';
avatar: string = '';
type: 'text'|'file'|'image'|'system' = 'text';
format?: 'text'|'markdown';            // unset = chat-level markdown applies
edited: boolean = false;
authorColor: string = '';              // attribute: author-color
reactions?: MessageReaction[];         // property only
attachment?: MessageAttachment;        // property only
// body = element text content
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
- `typing-start` -> `{}`
- `typing-stop` -> `{}`

React, edit, and delete self-apply to the local `messages` model AND emit the event — don't also mutate in the handler or it double-applies. On backend rejection, revert via `updateMessage()`. Delete is confirmed inline first. `message-send` does not self-add; the consumer adds the sent message.

## CSS Parts

- `base` - Chat container
- `messages` - Messages scrollable area
- `message` / `message-own` / `message-other` - message row (+ own/other variants)
- `system-message` - system message row
- `avatar`, `author`, `timestamp`, `edited`, `message-text` - message internals
- `attachment` - message attachment
- `reactions` / `reaction` / `reaction-active` - reactions
- `actions` - hover action menu (react on any message; edit/delete owner-only)
- `edit-input` / `edit-save` / `edit-cancel` - inline editor (shown while editing)
- `delete-confirm` / `delete-confirm-yes` / `delete-confirm-no` - inline delete confirmation
- `typing-indicator` - typing indicator row
- `input-area` - Input area wrapper
- `input-container` - Input + buttons container
- `input` - Textarea input field

Per-author color is injected inline as `--snice-chat-author-color`; `::part(author)` reads it.

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

```html
<!-- declarative messages (slot first; messages array appends after) -->
<snice-chat current-user="Me" color-authors layout="bubbles" markdown>
  <snice-chat-message slot="messages" author="Alice">shipped **v5.3**</snice-chat-message>
  <snice-chat-message slot="messages" author="Me" format="text">on it</snice-chat-message>
</snice-chat>
```

```typescript
chat.authorColors = { Alice: '#e11d48' };      // explicit per-author color
chat.addMessage({ type:'text', author:'Alice', timestamp:new Date(),
  format:'markdown', content:'run `npm i snice@latest`' });
```

```css
snice-chat::part(author)      { font-family: 'Inter'; }
snice-chat::part(message-own) { background: rgba(37,99,235,.06); }
```

## CSS Custom Properties

- `--snice-chat-height` - Chat height

## Accessibility

- Keyboard navigation for messages and controls
- ARIA roles for chat structure
