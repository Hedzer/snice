# snice-terminal

Shell terminal emulator with command execution, history, and ANSI colors.

## Properties

```typescript
prompt: string = '$ ';
cwd: string = '~';
readonly: boolean = false;
maxLines: number = 1000;       // attr: max-lines
showTimestamps: boolean = false; // attr: show-timestamps
```

## Events

- `terminal-command` → `{ command, args }` - Command entered
- `terminal-clear` → `{}` - Terminal cleared
- `terminal-ready` → `{}` - Terminal ready

## Methods

- `write(content, type?)` - Write without newline
- `writeln(content, type?)` - Write with newline
- `writeLines(lines)` - Write multiple lines
- `writeError(content)` - Write error line
- `clear()` - Clear terminal
- `focus()` - Focus input
- `getHistory()` - Get command history
- `clearHistory()` - Clear command history

## Line Types

`input` | `output` | `error` | `info` | `success` | `warning`

## CSS Custom Properties

```css
--snice-terminal-background
--snice-terminal-foreground
--snice-terminal-border
--snice-terminal-prompt-color
--snice-terminal-input-color
--snice-terminal-output-color
--snice-terminal-error-color
--snice-terminal-info-color
--snice-terminal-success-color
--snice-terminal-warning-color
```

## Usage

```html
<snice-terminal prompt="$ " cwd="~"></snice-terminal>

<script>
  const terminal = document.querySelector('snice-terminal');
  terminal.writeln('Welcome!', 'info');
  terminal.writeError('Something failed');

  terminal.addEventListener('terminal-command', (e) => {
    console.log('Command:', e.detail.command, e.detail.args);
  });
</script>
```
