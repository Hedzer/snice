import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Terminal component
 */
export interface TerminalProps extends SniceBaseProps {
  private?: any;
  prompt?: any;
  cwd?: any;
  readonly?: any;
  maxLines?: any;
  showTimestamps?: any;

}

/**
 * Terminal - React adapter for snice-terminal
 *
 * This is an auto-generated React wrapper for the Snice terminal component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/terminal';
 * import { Terminal } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Terminal />;
 * }
 * ```
 */
export const Terminal = createReactAdapter<TerminalProps>({
  tagName: 'snice-terminal',
  properties: ["private","prompt","cwd","readonly","maxLines","showTimestamps"],
  events: {},
  formAssociated: false
});
