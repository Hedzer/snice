# snice-terminal

Shell terminal emulator with command execution, history, ANSI colors, and keyboard navigation.

## Usage

```html
<snice-terminal prompt="$ " cwd="~"></snice-terminal>
```

## Properties

- `prompt: string` - Terminal prompt (default: `"$ "`)
- `cwd: string` - Current working directory (default: `"~"`)
- `readonly: boolean` - Disable input (default: `false`)
- `maxLines: number` - Max lines in history (default: `1000`)
- `showTimestamps: boolean` - Show line timestamps (default: `false`)

## Methods

- `write(content: string, type?: TerminalLineType): void` - Write without newline
- `writeln(content: string, type?: TerminalLineType): void` - Write with newline
- `writeLines(lines: Array<{ content: string; type?: TerminalLineType }>): void` - Write multiple lines
- `writeError(content: string): void` - Write error line
- `clear(): void` - Clear terminal
- `focus(): void` - Focus input
- `getHistory(): string[]` - Get command history
- `clearHistory(): void` - Clear command history

## Events

- `@snice/terminal-command: CustomEvent<{ command: string; args: string[] }>` - Command entered
- `@snice/terminal-clear: CustomEvent<{}>` - Terminal cleared
- `@snice/terminal-ready: CustomEvent<{}>` - Terminal ready

## Request/Response Pattern

Terminal uses `@request('terminal-command')` decorator pattern:

```typescript
// Terminal component makes request
@request('terminal-command')
async *executeCommand(commandLine: string): any {
  const response = await (yield payload);
  return response;
}

// Controller responds
@respond('terminal-command')
async handleCommand(payload: TerminalCommandRequest) {
  const { command, args, cwd } = payload;
  // Execute command
  return { output: 'result', exitCode: 0 };
}
```

## Line Types

- `input` - User input
- `output` - Command output
- `error` - Error message
- `info` - Info message
- `success` - Success message
- `warning` - Warning message

## Keyboard Shortcuts

- `Enter` - Execute command
- `↑/↓` - Navigate history
- `Ctrl+C` - Cancel input
- `Ctrl+L` - Clear terminal
- `Tab` - Command completion (TODO)

## ANSI Color Support

Supports ANSI escape codes for colors:
- `30-37` - Standard colors
- `90-97` - Bright colors

Special output `\x1B[CLEAR]` clears terminal.

## CSS Variables

```css
--snice-terminal-background
--snice-terminal-foreground
--snice-terminal-border
--snice-terminal-scrollbar
--snice-terminal-scrollbar-thumb
--snice-terminal-input-color
--snice-terminal-output-color
--snice-terminal-error-color
--snice-terminal-info-color
--snice-terminal-success-color
--snice-terminal-warning-color
--snice-terminal-prompt-color
--snice-terminal-selection
```

## Types

```typescript
type TerminalLineType = 'input' | 'output' | 'error' | 'info' | 'success' | 'warning';

interface TerminalCommandRequest {
  command: string;
  args: string[];
  cwd?: string;
  history?: string[];
}

interface TerminalCommandResponse {
  output?: string;
  error?: string;
  exitCode?: number;
}
```

## Example

```javascript
const terminal = document.querySelector('snice-terminal');

// Listen for commands (event pattern)
terminal.addEventListener('terminal-command', (e) => {
  console.log('Command:', e.detail.command, e.detail.args);
});

// Handle commands (@respond pattern)
class TerminalController extends HTMLElement {
  @respond('terminal-command')
  async handleCommand(req) {
    if (req.command === 'echo') {
      return { output: req.args.join(' '), exitCode: 0 };
    }
    if (req.command === 'clear') {
      return { output: '\x1B[CLEAR]' };
    }
    return { error: `Command not found: ${req.command}`, exitCode: 127 };
  }
}

// Write to terminal
terminal.writeln('Welcome to the terminal!', 'info');
terminal.writeln('\x1b[32mGreen text\x1b[0m', 'output');
terminal.writeError('Error: Something went wrong');
```
