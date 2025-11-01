# snice-terminal

A shell terminal emulator component with command execution, history navigation, ANSI color support, and keyboard shortcuts.

## Features

- **Command execution** - Execute commands with @request/@respond pattern
- **Command history** - Navigate with arrow keys (↑/↓)
- **ANSI colors** - Support for ANSI escape sequences
- **Keyboard shortcuts** - Ctrl+C, Ctrl+L, Tab (planned)
- **Readonly mode** - Display-only terminal output
- **Line management** - Auto-scroll and line limit
- **Timestamps** - Optional timestamp display
- **Customizable styling** - CSS custom properties for theming

## Basic Usage

```html
<snice-terminal id="terminal" prompt="$ " cwd="~"></snice-terminal>

<script type="module">
  import 'snice';

  const terminal = document.getElementById('terminal');

  // Write to terminal
  terminal.writeln('Welcome to the terminal!', 'info');
  terminal.writeln('Type "help" for commands', 'output');
</script>
```

## Properties

| Property          | Attribute          | Type      | Default    | Description                           |
| ----------------- | ------------------ | --------- | ---------- | ------------------------------------- |
| `prompt`          | `prompt`           | `string`  | `"$ "`     | Terminal prompt string                |
| `cwd`             | `cwd`              | `string`  | `"~"`      | Current working directory             |
| `readonly`        | `readonly`         | `boolean` | `false`    | Disable input (display only)          |
| `maxLines`        | `max-lines`        | `number`  | `1000`     | Maximum lines to keep in history      |
| `showTimestamps`  | `show-timestamps`  | `boolean` | `false`    | Show timestamps on each line          |

## Methods

### `write(content: string, type?: TerminalLineType): void`

Write content to terminal without adding a newline.

```javascript
terminal.write('Loading', 'output');
terminal.write('...', 'output');
```

### `writeln(content: string, type?: TerminalLineType): void`

Write a line to the terminal with a newline.

```javascript
terminal.writeln('Command completed successfully', 'success');
terminal.writeln('Warning: Low disk space', 'warning');
```

### `writeLines(lines: Array<{ content: string; type?: TerminalLineType }>): void`

Write multiple lines at once.

```javascript
terminal.writeLines([
  { content: 'File listing:', type: 'info' },
  { content: 'file1.txt', type: 'output' },
  { content: 'file2.txt', type: 'output' },
  { content: 'file3.txt', type: 'output' },
]);
```

### `writeError(content: string): void`

Write an error message to the terminal.

```javascript
terminal.writeError('Error: File not found');
```

### `clear(): void`

Clear all terminal output.

```javascript
terminal.clear();
```

### `focus(): void`

Focus the terminal input.

```javascript
terminal.focus();
```

### `getHistory(): string[]`

Get the command history.

```javascript
const history = terminal.getHistory();
console.log('Command history:', history);
```

### `clearHistory(): void`

Clear the command history.

```javascript
terminal.clearHistory();
```

## Events

### `@snice/terminal-command`

Emitted when a command is entered.

```javascript
terminal.addEventListener('@snice/terminal-command', (e) => {
  console.log('Command:', e.detail.command);
  console.log('Args:', e.detail.args);
});
```

**Detail:**
- `command: string` - The command name
- `args: string[]` - Command arguments

### `@snice/terminal-clear`

Emitted when the terminal is cleared.

```javascript
terminal.addEventListener('@snice/terminal-clear', () => {
  console.log('Terminal was cleared');
});
```

### `@snice/terminal-ready`

Emitted when the terminal is ready.

```javascript
terminal.addEventListener('@snice/terminal-ready', () => {
  console.log('Terminal is ready');
});
```

## Command Execution Pattern

The terminal uses Snice's `@request`/`@respond` pattern for command execution:

```javascript
import { element, respond } from 'snice';

@element('terminal-controller')
class TerminalController extends HTMLElement {
  @respond('terminal-command')
  async handleCommand(payload) {
    const { command, args, cwd, history } = payload;

    // Handle different commands
    switch (command) {
      case 'echo':
        return { output: args.join(' '), exitCode: 0 };

      case 'pwd':
        return { output: cwd, exitCode: 0 };

      case 'clear':
        // Special marker to trigger clear
        return { output: '\x1B[CLEAR]' };

      case 'history':
        return { output: history.join('\n'), exitCode: 0 };

      default:
        return {
          error: `Command not found: ${command}`,
          exitCode: 127,
        };
    }
  }
}
```

## Line Types

The terminal supports different line types for styling:

- `input` - User input echoed back
- `output` - Standard command output
- `error` - Error messages (red)
- `info` - Information messages (blue)
- `success` - Success messages (green)
- `warning` - Warning messages (yellow)

```javascript
terminal.writeln('This is output', 'output');
terminal.writeln('This is an error', 'error');
terminal.writeln('This is info', 'info');
terminal.writeln('This is success', 'success');
terminal.writeln('This is a warning', 'warning');
```

## Keyboard Shortcuts

| Key         | Action                     |
| ----------- | -------------------------- |
| `Enter`     | Execute command            |
| `↑`         | Previous command (history) |
| `↓`         | Next command (history)     |
| `Ctrl+C`    | Cancel current input       |
| `Ctrl+L`    | Clear terminal             |
| `Tab`       | Auto-complete (TODO)       |

## ANSI Color Support

The terminal supports ANSI escape sequences for colored output:

```javascript
// Standard colors (30-37)
terminal.writeln('\x1b[31mRed text\x1b[0m', 'output');
terminal.writeln('\x1b[32mGreen text\x1b[0m', 'output');
terminal.writeln('\x1b[33mYellow text\x1b[0m', 'output');
terminal.writeln('\x1b[34mBlue text\x1b[0m', 'output');
terminal.writeln('\x1b[35mMagenta text\x1b[0m', 'output');
terminal.writeln('\x1b[36mCyan text\x1b[0m', 'output');
terminal.writeln('\x1b[37mWhite text\x1b[0m', 'output');

// Bright colors (90-97)
terminal.writeln('\x1b[91mBright Red\x1b[0m', 'output');
terminal.writeln('\x1b[92mBright Green\x1b[0m', 'output');
terminal.writeln('\x1b[93mBright Yellow\x1b[0m', 'output');
terminal.writeln('\x1b[94mBright Blue\x1b[0m', 'output');

// Reset
terminal.writeln('\x1b[0mReset to default\x1b[0m', 'output');
```

**ANSI Color Map:**
- `30` / `90` - Black / Bright Black
- `31` / `91` - Red / Bright Red
- `32` / `92` - Green / Bright Green
- `33` / `93` - Yellow / Bright Yellow
- `34` / `94` - Blue / Bright Blue
- `35` / `95` - Magenta / Bright Magenta
- `36` / `96` - Cyan / Bright Cyan
- `37` / `97` - White / Bright White
- `0` - Reset

## Styling

The component can be styled using CSS custom properties:

```css
snice-terminal {
  /* Container */
  --snice-terminal-background: #1e1e1e;
  --snice-terminal-foreground: #d4d4d4;
  --snice-terminal-border: #3c3c3c;

  /* Scrollbar */
  --snice-terminal-scrollbar: #424242;
  --snice-terminal-scrollbar-thumb: #686868;

  /* Line types */
  --snice-terminal-input-color: #d4d4d4;
  --snice-terminal-output-color: #cccccc;
  --snice-terminal-error-color: #ff5555;
  --snice-terminal-info-color: #569cd6;
  --snice-terminal-success-color: #50fa7b;
  --snice-terminal-warning-color: #f1fa8c;

  /* Prompt */
  --snice-terminal-prompt-color: #569cd6;

  /* Selection */
  --snice-terminal-selection: rgba(255, 255, 255, 0.2);
}
```

## Examples

### Basic Terminal

```html
<snice-terminal id="terminal"></snice-terminal>

<script type="module">
  import 'snice';

  const terminal = document.getElementById('terminal');

  terminal.writeln('Welcome to the terminal!', 'info');
  terminal.writeln('Type commands to get started', 'output');
</script>
```

### With Command Handler

```html
<terminal-controller></terminal-controller>
<snice-terminal id="terminal" prompt="myapp $ "></snice-terminal>

<script type="module">
  import { element, respond } from 'snice';

  @element('terminal-controller')
  class TerminalController extends HTMLElement {
    @respond('terminal-command')
    async handleCommand(payload) {
      const { command, args } = payload;

      switch (command) {
        case 'hello':
          return { output: `Hello, ${args[0] || 'World'}!`, exitCode: 0 };

        case 'date':
          return { output: new Date().toString(), exitCode: 0 };

        case 'help':
          return {
            output: 'Available commands:\n  hello [name]\n  date\n  help\n  clear',
            exitCode: 0,
          };

        case 'clear':
          return { output: '\x1B[CLEAR]' };

        default:
          return {
            error: `Unknown command: ${command}`,
            exitCode: 1,
          };
      }
    }
  }

  const terminal = document.getElementById('terminal');
  terminal.writeln('Type "help" for available commands', 'info');
</script>
```

### Readonly Terminal

```html
<snice-terminal id="log-viewer" readonly show-timestamps></snice-terminal>

<script type="module">
  import 'snice';

  const logViewer = document.getElementById('log-viewer');

  // Simulate log streaming
  setInterval(() => {
    const logTypes = ['info', 'warning', 'error', 'success'];
    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
    const message = `Log entry at ${new Date().toISOString()}`;
    logViewer.writeln(message, type);
  }, 2000);
</script>
```

### With ANSI Colors

```html
<snice-terminal id="terminal"></snice-terminal>

<script type="module">
  import 'snice';

  const terminal = document.getElementById('terminal');

  terminal.writeln('\x1b[1m\x1b[32mSuccess!\x1b[0m Operation completed', 'output');
  terminal.writeln('\x1b[31mError:\x1b[0m Something went wrong', 'output');
  terminal.writeln('\x1b[33mWarning:\x1b[0m Disk space low', 'output');
  terminal.writeln('\x1b[36mInfo:\x1b[0m Processing...', 'output');
</script>
```

### Async Command Execution

```html
<terminal-controller></terminal-controller>
<snice-terminal id="terminal"></snice-terminal>

<script type="module">
  import { element, respond } from 'snice';

  @element('terminal-controller')
  class TerminalController extends HTMLElement {
    @respond('terminal-command')
    async handleCommand(payload) {
      const { command, args } = payload;

      if (command === 'fetch') {
        const url = args[0];
        if (!url) {
          return { error: 'Usage: fetch <url>', exitCode: 1 };
        }

        try {
          const response = await fetch(url);
          const data = await response.json();
          return { output: JSON.stringify(data, null, 2), exitCode: 0 };
        } catch (error) {
          return { error: `Fetch failed: ${error.message}`, exitCode: 1 };
        }
      }

      if (command === 'sleep') {
        const seconds = parseInt(args[0]) || 1;
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        return { output: `Slept for ${seconds} seconds`, exitCode: 0 };
      }

      return { error: `Unknown command: ${command}`, exitCode: 127 };
    }
  }
</script>
```

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM
- ES2020+

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  SniceTerminalElement,
  TerminalLine,
  TerminalLineType,
  TerminalCommandRequest,
  TerminalCommandResponse,
} from 'snice/terminal';
```

## Security Note

The terminal uses `unsafeHTML` for rendering ANSI-colored output. Only use trusted content or sanitize user input before displaying.
