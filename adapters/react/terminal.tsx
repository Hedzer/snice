// GENERATED FILE — DO NOT EDIT.
// Source: components/terminal/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Terminal component
 */
export interface TerminalProps extends SniceBaseProps {
  prompt?: any;
  cwd?: any;
  readonly?: any;
  maxLines?: any;
  showTimestamps?: any;
  onTerminalCommand?: (event: any) => void;
  onTerminalClear?: (event: any) => void;
  onTerminalReady?: (event: any) => void;
}

/**
 * Terminal - React adapter for snice-terminal
 *
 * This is an auto-generated React wrapper for the Snice terminal component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/terminal/snice-terminal';
 * import { Terminal } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Terminal />;
 * }
 * ```
 */
export const Terminal: SniceReactComponent<TerminalProps, SniceComponentRef> = createReactAdapter<TerminalProps, false>({
  tagName: 'snice-terminal',
  properties: ["prompt","cwd","readonly","maxLines","showTimestamps"],
  events: {"terminal-command":"onTerminalCommand","terminal-clear":"onTerminalClear","terminal-ready":"onTerminalReady"},
  formAssociated: false
});
