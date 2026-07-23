import { type SniceReactComponent } from './wrapper';
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
export declare const MessageStrip: SniceReactComponent<MessageStripProps, SniceComponentRef>;
//# sourceMappingURL=message-strip.d.ts.map