import { createReactAdapter } from './wrapper';
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
export const CommandPalette = createReactAdapter<CommandPaletteProps>({
  tagName: 'snice-command-palette',
  properties: ["open","commands","placeholder","noResultsText","maxResults","showRecentCommands","recentCommandsLimit","caseSensitive"],
  events: {},
  formAssociated: false
});
