import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the MessageStrip component
 */
export interface MessageStripProps extends SniceBaseProps {
  variant?: any;
  dismissable?: any;
  icon?: any;

}

/**
 * MessageStrip - React adapter for snice-message-strip
 *
 * This is an auto-generated React wrapper for the Snice message-strip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/message-strip';
 * import { MessageStrip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MessageStrip />;
 * }
 * ```
 */
export const MessageStrip = createReactAdapter<MessageStripProps>({
  tagName: 'snice-message-strip',
  properties: ["variant","dismissable","icon"],
  events: {},
  formAssociated: false
});
