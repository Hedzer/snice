import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the ChatMessage component
 */
export interface ChatMessageProps extends SniceBaseProps {
    author?: any;
    avatar?: any;
    type?: any;
    format?: any;
    edited?: any;
    authorColor?: any;
    reactions?: any;
    attachment?: any;
    thread?: any;
}
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
export declare const ChatMessage: SniceReactComponent<ChatMessageProps, SniceComponentRef>;
//# sourceMappingURL=chat-message.d.ts.map