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

## Methods

- `write(content, type?)` - Write without newline
- `writeln(content, type?)` - Write with newline
- `writeLines(lines)` - Write multiple lines
- `writeError(content)` - Write error line
- `clear()` - Clear terminal
- `focus()` - Focus input
- `getHistory()` - Get command history
- `clearHistory()` - Clear command history

## Events

- `terminal-command` -> `{ command, args }` - Command entered
- `terminal-clear` -> `{}` - Terminal cleared
- `terminal-ready` -> `{}` - Terminal ready

## CSS Custom Properties

```css
--snice-terminal-height            /* 400px */
--snice-terminal-font-size         /* 0.875rem */
--snice-terminal-line-height       /* 1.2 */
--snice-terminal-background        /* #1e1e1e */
--snice-terminal-foreground        /* #d4d4d4 */
--snice-terminal-border-radius     /* var(--snice-border-radius-md, 0.25rem) */
--snice-terminal-scrollbar-color
--snice-terminal-input-color       /* #d4d4d4 */
--snice-terminal-output-color      /* #d4d4d4 */
--snice-terminal-error-color       /* #f48771 */
--snice-terminal-info-color        /* #75beff */
--snice-terminal-success-color     /* #89d185 */
--snice-terminal-warning-color     /* #dcdcaa */
--snice-terminal-timestamp-color   /* hsl(0 0% 40%) */
--snice-terminal-prompt-color      /* #89d185 */
--snice-terminal-cursor-color      /* #d4d4d4 */
--snice-terminal-selection-color   /* hsl(210 52% 31% / 0.6) */
--snice-terminal-hint-color        /* hsl(0 0% 40%) */
```

## CSS Parts

- `container` - Terminal container
- `output` - Output scrollable area
- `input-line` - Input line wrapper
- `prompt` - Prompt text
- `input` - Text input field
- `line` - Individual output line
- `timestamp` - Line timestamp
- `line-content` - Line text content

## Line Types

`input` | `output` | `error` | `info` | `success` | `warning`

## Basic Usage

```html
<snice-terminal prompt="$ " cwd="~"></snice-terminal>
```

```typescript
terminal.writeln('Welcome!', 'info');
terminal.writeError('Something failed');

terminal.addEventListener('terminal-command', (e) => {
  console.log('Command:', e.detail.command, e.detail.args);
});
```
