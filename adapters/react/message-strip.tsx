// GENERATED FILE — DO NOT EDIT.
// Source: components/message-strip/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the MessageStrip component
 */
export interface MessageStripProps extends SniceBaseProps {
  variant?: any;
  dismissible?: any;
  icon?: any;
  onDismiss?: (event: any) => void;
}

/**
 * MessageStrip - React adapter for snice-message-strip
 *
 * This is an auto-generated React wrapper for the Snice message-strip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/message-strip/snice-message-strip';
 * import { MessageStrip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MessageStrip />;
 * }
 * ```
 */
export const MessageStrip: SniceReactComponent<MessageStripProps, SniceComponentRef> = createReactAdapter<MessageStripProps, false>({
  tagName: 'snice-message-strip',
  properties: ["variant","dismissible","icon"],
  events: {"dismiss":"onDismiss"},
  formAssociated: false
});
