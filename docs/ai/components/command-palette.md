# snice-command-palette

Searchable command palette overlay (⌘K) for quick command access.

## Properties

```typescript
open: boolean = false;
commands: CommandItem[] = [];
placeholder: string = 'Type a command or search...';
noResultsText: string = 'No results found';
maxResults: number = 50;
showRecentCommands: boolean = true;
recentCommandsLimit: number = 5;
caseSensitive: boolean = false;
```

## CommandItem Interface

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
- `removeCommand(id: string)` - Remove command
- `executeCommand(id: string)` - Execute by ID
- `clearSearch()` - Clear search
- `focus()` - Focus input

## Events

- `@snice/command-palette-open` - Opened (detail: { palette })
- `@snice/command-palette-close` - Closed (detail: { palette })
- `@snice/command-select` - Command selected (detail: { command, palette })
- `@snice/command-execute` - Command executed (detail: { command, palette })
- `@snice/command-search` - Search changed (detail: { query, results, palette })

## Usage

```html
<!-- Basic -->
<snice-command-palette id="pal"></snice-command-palette>
<script>
  document.getElementById('pal').commands = [
    {
      id: 'new',
      label: 'New File',
      description: 'Create a new file',
      icon: '📄',
      shortcut: '⌘N',
      category: 'File',
      action: () => console.log('New file')
    },
    {
      id: 'save',
      label: 'Save',
      icon: '💾',
      shortcut: '⌘S',
      category: 'File',
      action: () => console.log('Saved')
    }
  ];
</script>

<!-- Opens with ⌘K or Ctrl+K -->

<!-- Manual trigger -->
<button onclick="palette.show()">Open</button>

<!-- With async actions -->
<script>
  palette.commands = [{
    id: 'logout',
    label: 'Logout',
    action: async () => {
      await fetch('/api/logout', { method: 'POST' });
      location.href = '/login';
    }
  }];
</script>

<!-- Events -->
<script>
  palette.addEventListener('@snice/command-execute', (e) => {
    console.log('Executed:', e.detail.command.label);
  });
</script>
```

## Features

- ⌘K/Ctrl+K keyboard shortcut
- Arrow key navigation
- Fuzzy search filtering
- Command categories/grouping
- Recent commands tracking
- Icons and keyboard shortcuts display
- Async action support
- Focus trap when open
- Backdrop click to close
- Escape to close
