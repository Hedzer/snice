<!-- AI: For a low-token version of this doc, use docs/ai/components/command-palette.md instead -->

# Command Palette Component

A searchable command palette overlay (⌘K) for quick access to application commands and actions.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [CommandItem Interface](#commanditem-interface)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Palette visibility |
| `commands` | `CommandItem[]` | `[]` | Array of commands |
| `placeholder` | `string` | `'Type a command or search...'` | Search input placeholder |
| `noResultsText` | `string` | `'No results found'` | Empty state text |
| `maxResults` | `number` | `50` | Maximum results to display |
| `showRecentCommands` | `boolean` | `true` | Show recent commands when search is empty |
| `recentCommandsLimit` | `number` | `5` | Number of recent commands to track |
| `caseSensitive` | `boolean` | `false` | Case-sensitive search |

## Methods

- `show()` - Open the palette
- `close()` - Close the palette
- `toggle()` - Toggle palette visibility
- `addCommand(command: CommandItem)` - Add a command
- `removeCommand(id: string)` - Remove a command
- `executeCommand(id: string)` - Execute command by ID
- `clearSearch()` - Clear search input
- `focus()` - Focus search input

## Events

- `command-palette-open` - Fired when palette opens
- `command-palette-close` - Fired when palette closes
- `command-select` - Fired when command is selected (detail: { command, palette })
- `command-execute` - Fired when command is executed (detail: { command, palette })
- `command-search` - Fired when search changes (detail: { query, results, palette })

## Basic Usage

```html
<snice-command-palette id="palette"></snice-command-palette>

<script>
  const palette = document.getElementById('palette');
  palette.commands = [
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      icon: '📄',
      shortcut: '⌘N',
      category: 'File',
      action: () => console.log('New file created')
    },
    {
      id: 'save',
      label: 'Save',
      description: 'Save the current file',
      icon: '💾',
      shortcut: '⌘S',
      category: 'File',
      action: () => console.log('File saved')
    }
  ];

  // Opens automatically with ⌘K or Ctrl+K
</script>
```

## Examples

### Basic Commands

```html
<snice-command-palette id="palette"></snice-command-palette>

<script>
  document.getElementById('palette').commands = [
    { id: '1', label: 'New File', icon: '📄', category: 'File' },
    { id: '2', label: 'Open File', icon: '📂', category: 'File' },
    { id: '3', label: 'Cut', icon: '✂️', category: 'Edit' },
    { id: '4', label: 'Copy', icon: '📋', category: 'Edit' }
  ];
</script>
```

### With Actions

```javascript
palette.commands = [
  {
    id: 'theme-toggle',
    label: 'Toggle Theme',
    icon: '🌓',
    action: () => {
      document.body.classList.toggle('dark-mode');
    }
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: '🚪',
    action: async () => {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  }
];
```

### Custom Trigger

```html
<button onclick="palette.show()">Open Commands</button>
<snice-command-palette id="palette"></snice-command-palette>
```

### Event Handling

```javascript
palette.addEventListener('command-execute', (e) => {
  console.log('Executed:', e.detail.command.label);
  analytics.track('command_executed', { command: e.detail.command.id });
});
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `container` | `<div>` | Main palette container |
| `search` | `<div>` | Search area wrapper |
| `input` | `<input>` | Search input element |
| `results` | `<div>` | Results list container |
| `empty` | `<div>` | Empty state message |
| `category` | `<div>` | Category group header |
| `item` | `<button>` | Individual command item |
| `item-icon` | `<div>` | Item icon wrapper |
| `item-icon-image` | `<img>` | Item icon image |
| `item-content` | `<div>` | Item label and description wrapper |
| `item-label` | `<div>` | Item label text |
| `item-description` | `<div>` | Item description text |
| `item-shortcut` | `<div>` | Keyboard shortcut badge |

```css
snice-command-palette::part(container) {
  max-width: 800px;
}

snice-command-palette::part(item) {
  border-radius: 0.25rem;
}
```

## CommandItem Interface

```typescript
interface CommandItem {
  id: string;              // Unique identifier
  label: string;           // Command name
  description?: string;    // Command description
  icon?: string;           // Text/emoji icon
  iconImage?: string;      // Icon image URL
  shortcut?: string;       // Keyboard shortcut display
  category?: string;       // Command category for grouping
  disabled?: boolean;      // Disable command
  action?: () => void | Promise<void>;  // Command action
  data?: any;             // Custom data
}
```

## Keyboard Shortcuts

- `⌘K` or `Ctrl+K` - Toggle palette
- `Escape` - Close palette
- `↑` / `↓` - Navigate commands
- `Enter` - Execute active command

## Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Focus trap when open
- Screen reader announcements

## Browser Support

Modern browsers with Custom Elements v1 support
