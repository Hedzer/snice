// GENERATED FILE — DO NOT EDIT.
// Source: components/chat/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const ChatMessage: SniceReactComponent<ChatMessageProps, SniceComponentRef> = createReactAdapter<ChatMessageProps, false>({
  tagName: 'snice-chat-message',
  properties: ["author","avatar","type","format","edited","authorColor","reactions","attachment","thread"],
  events: {},
  formAssociated: false
});
