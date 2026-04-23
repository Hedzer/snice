import type { SniceBaseProps } from './types';
/**
 * Props for the CommandPalette component
 */
export interface CommandPaletteProps extends SniceBaseProps {
    open?: any;
    commands?: any;
    placeholder?: any;
    noResultsText?: any;
    maxResults?: any;
    showRecentCommands?: any;
    recentCommandsLimit?: any;
    caseSensitive?: any;
    searchQuery?: any;
    activeIndex?: any;
    filteredCommands?: any;
    recentCommands?: any;
    onCommandPaletteOpen?: (event: any) => void;
    onCommandPaletteClose?: (event: any) => void;
    onCommandSelect?: (event: any) => void;
    onCommandExecute?: (event: any) => void;
    onCommandSearch?: (event: any) => void;
}
/**
 * CommandPalette - React adapter for snice-command-palette
 *
 * This is an auto-generated React wrapper for the Snice command-palette component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/command-palette';
 * import { CommandPalette } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CommandPalette />;
 * }
 * ```
 */
export declare const CommandPalette: import("react").ForwardRefExoticComponent<Omit<CommandPaletteProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=command-palette.d.ts.map