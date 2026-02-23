[//]: # (AI: For a low-token version of this doc, use docs/ai/components/terminal.md instead)

# Terminal
`<snice-terminal>`

A shell terminal emulator with command execution, history navigation, and ANSI color support.

## Basic Usage

```typescript
import 'snice/components/terminal/snice-terminal';
```

```html
<snice-terminal prompt="$ " cwd="~"></snice-terminal>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/terminal/snice-terminal';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-terminal.min.js"></script>
```

## Examples

### Writing Output

Use the `writeln` method with a line type to display styled output.

```javascript
const terminal = document.querySelector('snice-terminal');
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
<my-controller></my-controller>
<snice-terminal prompt="myapp $ "></snice-terminal>

<script type="module">
  import { element, respond } from 'snice';

  @element('my-controller')
  class MyController extends HTMLElement {
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
</script>
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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `prompt` | `string` | `'$ '` | Terminal prompt string |
| `cwd` | `string` | `'~'` | Current working directory display |
| `readonly` | `boolean` | `false` | Disable input (display only) |
| `maxLines` (attr: `max-lines`) | `number` | `1000` | Maximum lines in buffer |
| `showTimestamps` (attr: `show-timestamps`) | `boolean` | `false` | Show timestamps on each line |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `terminal-command` | `{ command: string, args: string[] }` | Command entered |
| `terminal-clear` | -- | Terminal cleared |
| `terminal-ready` | -- | Terminal initialized |

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

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-terminal-background` | Terminal background | `#1e1e1e` |
| `--snice-terminal-foreground` | Default text color | `#d4d4d4` |
| `--snice-terminal-border` | Border color | `#3c3c3c` |
| `--snice-terminal-prompt-color` | Prompt color | `#569cd6` |
| `--snice-terminal-error-color` | Error text | `#ff5555` |
| `--snice-terminal-info-color` | Info text | `#569cd6` |
| `--snice-terminal-success-color` | Success text | `#50fa7b` |
| `--snice-terminal-warning-color` | Warning text | `#f1fa8c` |
