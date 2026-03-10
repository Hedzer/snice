<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/command-palette.md -->

# Command Palette Component

A searchable command palette overlay for quick access to application commands and actions. Opens with Cmd+K / Ctrl+K.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Palette visibility |
| `commands` | `CommandItem[]` | `[]` | Array of command objects |
| `placeholder` | `string` | `'Type a command or search...'` | Search input placeholder text |
| `noResultsText` (attr: `no-results-text`) | `string` | `'No results found'` | Text shown when search yields no results |
| `maxResults` (attr: `max-results`) | `number` | `50` | Maximum number of results to display |
| `showRecentCommands` (attr: `show-recent-commands`) | `boolean` | `true` | Show recently used commands when search is empty |
| `recentCommandsLimit` (attr: `recent-commands-limit`) | `number` | `5` | Number of recent commands to track |
| `caseSensitive` (attr: `case-sensitive`) | `boolean` | `false` | Enable case-sensitive search matching |

### CommandItem Interface

```typescript
interface CommandItem {
  id: string;              // Unique identifier
  label: string;           // Command name
  description?: string;    // Command description
  icon?: string;           // Text/emoji icon
  iconImage?: string;      // Icon image URL
  shortcut?: string;       // Keyboard shortcut display text
  category?: string;       // Category for grouping
  disabled?: boolean;      // Disable command
  action?: () => void | Promise<void>;  // Command action
  data?: any;              // Custom data
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `show()` | -- | Open the palette |
| `close()` | -- | Close the palette |
| `toggle()` | -- | Toggle palette visibility |
| `addCommand()` | `command: CommandItem` | Add a command dynamically |
| `removeCommand()` | `id: string` | Remove a command by ID |
| `executeCommand()` | `id: string` | Execute a command by ID |
| `clearSearch()` | -- | Clear the search input |
| `focus()` | -- | Focus the search input |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `command-palette-open` | `{ palette }` | Fired when the palette opens |
| `command-palette-close` | `{ palette }` | Fired when the palette closes |
| `command-select` | `{ command, palette }` | Fired when a command is highlighted/selected |
| `command-execute` | `{ command, palette }` | Fired when a command is executed |
| `command-search` | `{ query, results, palette }` | Fired when the search input changes |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main palette container |
| `search` | Search area wrapper |
| `input` | Search input element |
| `results` | Results list container |
| `empty` | Empty state message |
| `category` | Category group header |
| `item` | Individual command item button |
| `item-icon` | Item icon wrapper |
| `item-icon-image` | Item icon image element |
| `item-content` | Item label and description wrapper |
| `item-label` | Item label text |
| `item-description` | Item description text |
| `item-shortcut` | Keyboard shortcut badge |

```css
snice-command-palette::part(container) {
  max-width: 800px;
}

snice-command-palette::part(item) {
  border-radius: 0.25rem;
}
```

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
      icon: '💾',
      shortcut: '⌘S',
      category: 'File',
      action: () => console.log('File saved')
    }
  ];
</script>
```

```typescript
import 'snice/components/command-palette/snice-command-palette';
```

## Examples

### Categorized Commands

Group commands by category for organized navigation.

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

### Commands with Actions

Attach action functions to commands for immediate execution.

```javascript
palette.commands = [
  {
    id: 'theme-toggle',
    label: 'Toggle Theme',
    icon: '🌓',
    action: () => document.body.classList.toggle('dark-mode')
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

Use `show()` to open the palette from a custom button instead of the keyboard shortcut.

```html
<button onclick="palette.show()">Open Commands</button>
<snice-command-palette id="palette"></snice-command-palette>
```

### Event Handling

Listen for command execution to log analytics or trigger side effects.

```javascript
palette.addEventListener('command-execute', (e) => {
  console.log('Executed:', e.detail.command.label);
  analytics.track('command_executed', { command: e.detail.command.id });
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Cmd+K` / `Ctrl+K` | Toggle palette |
| `Escape` | Close palette |
| `Arrow Up` / `Arrow Down` | Navigate commands |
| `Enter` | Execute active command |

## Accessibility

- Full keyboard navigation with arrow keys
- ARIA labels and roles on all interactive elements
- Focus trap when palette is open
- Screen reader announcements for search results
