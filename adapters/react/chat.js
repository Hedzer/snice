import { createReactAdapter } from './wrapper';
/**
 * Chat - React adapter for snice-chat
 *
 * This is an auto-generated React wrapper for the Snice chat component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chat';
 * import { Chat } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chat />;
 * }
 * ```
 */
export const Chat = createReactAdapter({
    tagName: 'snice-chat',
    properties: ["messages", "currentUser", "currentAvatar", "placeholder", "allowFiles", "showTyping", "showAvatars", "showTimestamps"],
    events: { "message-send": "onMessageSend", "message-edit": "onMessageEdit", "message-delete": "onMessageDelete", "message-react": "onMessageReact", "message-thread": "onMessageThread", "typing-start": "onTypingStart", "typing-stop": "onTypingStop" },
    formAssociated: false
});
//# sourceMappingURL=chat.js.map