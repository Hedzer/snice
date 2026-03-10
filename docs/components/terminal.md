<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/terminal.md -->

# Terminal
`<snice-terminal>`

A shell terminal emulator with command execution, history navigation, and ANSI color support.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `prompt` | `string` | `'$ '` | Terminal prompt string |
| `cwd` | `string` | `'~'` | Current working directory display |
| `readonly` | `boolean` | `false` | Disable input (display only) |
| `maxLines` (attr: `max-lines`) | `number` | `1000` | Maximum lines in buffer |
| `showTimestamps` (attr: `show-timestamps`) | `boolean` | `false` | Show timestamps on each line |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `write()` | `content: string, type?: TerminalLineType` | Write without newline |
| `writeln()` | `content: string, type?: TerminalLineType` | Write with newline |
| `writeLines()` | `lines: Array<{ content: string, type?: TerminalLineType }>` | Write multiple lines |
| `writeError()` | `content: string` | Write error message |
| `clear()` | -- | Clear terminal output |
| `focus()` | -- | Focus the input |
| `getHistory()` | -- | Get command history, returns `string[]` |
| `clearHistory()` | -- | Clear command history |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `terminal-command` | `{ command: string, args: string[] }` | Command entered |
| `terminal-clear` | `{}` | Terminal cleared |
| `terminal-ready` | `{}` | Terminal initialized |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-terminal-height` | Terminal height | `400px` |
| `--snice-terminal-font-size` | Font size | `0.875rem` |
| `--snice-terminal-line-height` | Line height | `1.2` |
| `--snice-terminal-background` | Terminal background | `#1e1e1e` |
| `--snice-terminal-foreground` | Default text color | `#d4d4d4` |
| `--snice-terminal-border-radius` | Border radius | `var(--snice-border-radius-md, 0.25rem)` |
| `--snice-terminal-scrollbar-color` | Scrollbar thumb color | `var(--snice-color-border)` |
| `--snice-terminal-input-color` | Input text color | `#d4d4d4` |
| `--snice-terminal-output-color` | Output text color | `#d4d4d4` |
| `--snice-terminal-error-color` | Error text color | `#f48771` |
| `--snice-terminal-info-color` | Info text color | `#75beff` |
| `--snice-terminal-success-color` | Success text color | `#89d185` |
| `--snice-terminal-warning-color` | Warning text color | `#dcdcaa` |
| `--snice-terminal-timestamp-color` | Timestamp color | `hsl(0 0% 40%)` |
| `--snice-terminal-prompt-color` | Prompt color | `#89d185` |
| `--snice-terminal-cursor-color` | Cursor color | `#d4d4d4` |
| `--snice-terminal-selection-color` | Text selection color | `hsl(210 52% 31% / 0.6)` |
| `--snice-terminal-hint-color` | Empty state hint color | `hsl(0 0% 40%)` |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The terminal container |
| `output` | The scrollable output area |
| `input-line` | The input line wrapper |
| `prompt` | The prompt text |
| `input` | The text input field |
| `line` | Individual output line |
| `timestamp` | Line timestamp |
| `line-content` | Line text content |

## Basic Usage

```typescript
import 'snice/components/terminal/snice-terminal';
```

```html
<snice-terminal prompt="$ " cwd="~"></snice-terminal>
```

## Examples

### Writing Output

Use the `writeln` method with a line type to display styled output.

```typescript
terminal.writeln('Welcome!', 'info');
terminal.writeln('File saved', 'success');
terminal.writeln('Disk space low', 'warning');
terminal.writeError('File not found');
```

### Readonly Log Viewer

Set the `readonly` attribute to disable input and use as a display-only log viewer.

```html
<snice-terminal readonly show-timestamps></snice-terminal>
```

### With Command Handler

Use the `@request`/`@respond` pattern to handle commands.

```html
<snice-terminal prompt="myapp $ " controller="shell-handler"></snice-terminal>
```

```typescript
import { controller, respond, IController } from 'snice';

@controller('shell-handler')
class ShellHandler implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach() {}

  @respond('terminal-command')
  async handleCommand(payload) {
    const { command, args } = payload;

    switch (command) {
      case 'hello':
        return { output: `Hello, ${args[0] || 'World'}!`, exitCode: 0 };
      case 'clear':
        return { output: '\x1B[CLEAR]' };
      default:
        return { error: `Unknown: ${command}`, exitCode: 127 };
    }
  }
}
```

### ANSI Colors

The terminal renders ANSI escape sequences for colored output.

```javascript
terminal.writeln('\x1b[31mRed text\x1b[0m', 'output');
terminal.writeln('\x1b[32mGreen text\x1b[0m', 'output');
terminal.writeln('\x1b[33mYellow text\x1b[0m', 'output');
terminal.writeln('\x1b[34mBlue text\x1b[0m', 'output');
```

### Line Types

```javascript
terminal.writeln('User input echoed', 'input');
terminal.writeln('Standard output', 'output');
terminal.writeln('Error message', 'error');
terminal.writeln('Information', 'info');
terminal.writeln('Success message', 'success');
terminal.writeln('Warning message', 'warning');
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Enter | Execute command |
| ArrowUp / ArrowDown | Navigate command history |
| Ctrl+C | Cancel current input |
| Ctrl+L | Clear terminal |
| Tab | Command completion (placeholder) |
