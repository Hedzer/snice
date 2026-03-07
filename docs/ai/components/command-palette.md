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

- `command-palette-open` - Opened (detail: { palette })
- `command-palette-close` - Closed (detail: { palette })
- `command-select` - Command selected (detail: { command, palette })
- `command-execute` - Command executed (detail: { command, palette })
- `command-search` - Search changed (detail: { query, results, palette })

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
  palette.addEventListener('command-execute', (e) => {
    console.log('Executed:', e.detail.command.label);
  });
</script>
```

## CSS Parts

- `container` - Main palette container
- `search` - Search area wrapper
- `input` - Search input element
- `results` - Results list container
- `empty` - Empty state message
- `category` - Category header
- `item` - Command item button
- `item-icon` - Item icon wrapper
- `item-icon-image` - Item icon image
- `item-content` - Item label + description wrapper
- `item-label` - Item label text
- `item-description` - Item description text
- `item-shortcut` - Item keyboard shortcut badge
