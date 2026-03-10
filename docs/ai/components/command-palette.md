# snice-command-palette

Searchable command palette overlay (Cmd+K / Ctrl+K) for quick command access.

## Properties

```typescript
open: boolean = false;
commands: CommandItem[] = [];
placeholder: string = 'Type a command or search...';
noResultsText: string = 'No results found';    // attribute: no-results-text
maxResults: number = 50;                        // attribute: max-results
showRecentCommands: boolean = true;             // attribute: show-recent-commands
recentCommandsLimit: number = 5;               // attribute: recent-commands-limit
caseSensitive: boolean = false;                // attribute: case-sensitive
```

### CommandItem Interface

```typescript
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  iconImage?: string;
  shortcut?: string;
  category?: string;
  disabled?: boolean;
  action?: () => void | Promise<void>;
  data?: any;
}
```

## Methods

- `show()` - Open palette
- `close()` - Close palette
- `toggle()` - Toggle visibility
- `addCommand(command: CommandItem)` - Add command
- `removeCommand(id: string)` - Remove command by ID
- `executeCommand(id: string)` - Execute command by ID
- `clearSearch()` - Clear search input
- `focus()` - Focus search input

## Events

- `command-palette-open` -> `{ palette }` - Palette opened
- `command-palette-close` -> `{ palette }` - Palette closed
- `command-select` -> `{ command, palette }` - Command highlighted
- `command-execute` -> `{ command, palette }` - Command executed
- `command-search` -> `{ query, results, palette }` - Search changed

## CSS Parts

- `container` - Main palette container
- `search` - Search area wrapper
- `input` - Search input element
- `results` - Results list container
- `empty` - Empty state message
- `category` - Category group header
- `item` - Command item button
- `item-icon` - Item icon wrapper
- `item-icon-image` - Item icon image
- `item-content` - Item label + description wrapper
- `item-label` - Item label text
- `item-description` - Item description text
- `item-shortcut` - Keyboard shortcut badge

## Basic Usage

```html
<snice-command-palette id="palette"></snice-command-palette>
```

```typescript
import 'snice/components/command-palette/snice-command-palette';

palette.commands = [
  { id: 'new', label: 'New File', icon: '📄', shortcut: '⌘N', category: 'File', action: () => {} },
  { id: 'save', label: 'Save', icon: '💾', shortcut: '⌘S', category: 'File', action: () => {} }
];

palette.addEventListener('command-execute', (e) => console.log(e.detail.command.label));
```

## Keyboard Navigation

- `Cmd+K` / `Ctrl+K` - Toggle palette
- `Escape` - Close palette
- `Arrow Up` / `Arrow Down` - Navigate commands
- `Enter` - Execute active command

## Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Focus trap when open
- Screen reader announcements
