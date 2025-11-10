import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
  onMessageSend?: (event: any) => void;
  onMessageEdit?: (event: any) => void;
  onMessageDelete?: (event: any) => void;
  onMessageReact?: (event: any) => void;
  onMessageThread?: (event: any) => void;
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
 * import 'snice/components/chat';
 * import { Chat } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chat />;
 * }
 * ```
 */
export const Chat = createReactAdapter<ChatProps>({
  tagName: 'snice-chat',
  properties: ["messages","currentUser","currentAvatar","placeholder","allowFiles","showTyping","showAvatars","showTimestamps"],
  events: {"message-send":"onMessageSend","message-edit":"onMessageEdit","message-delete":"onMessageDelete","message-react":"onMessageReact","message-thread":"onMessageThread","typing-start":"onTypingStart","typing-stop":"onTypingStop"},
  formAssociated: false
});
