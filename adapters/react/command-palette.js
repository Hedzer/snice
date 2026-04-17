// GENERATED FILE — DO NOT EDIT.
// Source: components/command-palette/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const CommandPalette = createReactAdapter({
    tagName: 'snice-command-palette',
    properties: ["open", "commands", "placeholder", "noResultsText", "maxResults", "showRecentCommands", "recentCommandsLimit", "caseSensitive"],
    events: { "command-palette-open": "onCommandPaletteOpen", "command-palette-close": "onCommandPaletteClose", "command-select": "onCommandSelect", "command-execute": "onCommandExecute", "command-search": "onCommandSearch" },
    formAssociated: false
});
//# sourceMappingURL=command-palette.js.map