import { type SniceReactComponent } from './wrapper';
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
export declare const Terminal: SniceReactComponent<TerminalProps, SniceComponentRef>;
//# sourceMappingURL=terminal.d.ts.map