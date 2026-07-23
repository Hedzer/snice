import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Chat component
 */
export interface ChatProps extends SniceBaseProps {
    messages?: any;
    currentUser?: any;
    currentAvatar?: any;
    placeholder?: any;
    allowFiles?: any;
    showTyping?: any;
    showAvatars?: any;
    showTimestamps?: any;
    authorColors?: any;
    colorAuthors?: any;
    markdown?: any;
    layout?: any;
    onMessageSend?: (event: any) => void;
    onMessageEdit?: (event: any) => void;
    onMessageDelete?: (event: any) => void;
    onMessageReact?: (event: any) => void;
    onTypingStart?: (event: any) => void;
    onTypingStop?: (event: any) => void;
}
/**
 * Chat - React adapter for snice-chat
 *
 * This is an auto-generated React wrapper for the Snice chat component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chat/snice-chat';
 * import { Chat } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chat />;
 * }
 * ```
 */
export declare const Chat: SniceReactComponent<ChatProps, SniceComponentRef>;
//# sourceMappingURL=chat.d.ts.map