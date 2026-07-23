// GENERATED FILE — DO NOT EDIT.
// Source: components/chat/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * ChatMessage - React adapter for snice-chat-message
 *
 * This is an auto-generated React wrapper for the Snice chat-message component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chat/snice-chat-message';
 * import { ChatMessage } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ChatMessage />;
 * }
 * ```
 */
export const ChatMessage = createReactAdapter({
    tagName: 'snice-chat-message',
    properties: ["author", "avatar", "type", "format", "edited", "authorColor", "reactions", "attachment", "thread"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=chat-message.js.map