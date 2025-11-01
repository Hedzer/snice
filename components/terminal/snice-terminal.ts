import { element, property, dispatch, render, styles, html, css, query, watch } from 'snice';
import cssContent from './snice-terminal.css?inline';
import type {
  SniceTerminalElement,
  TerminalLine,
  TerminalLineType,
  CommandHandler,
  CommandResult,
  SniceTerminalEventMap
} from './snice-terminal.types';

@element('snice-terminal')
export class SniceTerminal extends HTMLElement implements SniceTerminalElement {
  @property({ type: Array })
  lines: TerminalLine[] = [];

  @property()
  prompt = '$ ';

  @property()
  cwd = '~';

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Number, attribute: 'max-lines' })
  maxLines = 1000;

  @property({ type: Boolean, attribute: 'show-timestamps' })
  showTimestamps = false;

  @query('.terminal-input')
  private inputElement?: HTMLInputElement;

  @query('.terminal-output')
  private outputElement?: HTMLDivElement;

  private commandHandlers = new Map<string, CommandHandler>();
  private commandHistory: string[] = [];
  private historyIndex = -1;
  private currentInput = '';

  @dispatch('@snice/terminal-command', { bubbles: true, composed: true })
  private dispatchCommandEvent(command: string, args: string[]) {
    return { command, args };
  }

  @dispatch('@snice/terminal-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return {};
  }

  @dispatch('@snice/terminal-ready', { bubbles: true, composed: true })
  private dispatchReadyEvent() {
    return {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupDefaultCommands();
    this.dispatchReadyEvent();
  }

  @watch('lines')
  private handleLinesChange() {
    // Limit lines if needed
    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines);
    }

    // Scroll to bottom
    requestAnimationFrame(() => {
      if (this.outputElement) {
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
      }
    });
  }

  @render()
  render() {
    return html/*html*/`
      <div class="terminal-container" part="container" @click="${() => this.handleContainerClick()}">
        <div class="terminal-output" part="output">
          ${this.lines.map(line => this.renderLine(line))}
        </div>

        <if ${!this.readonly}>
          <div class="terminal-input-line" part="input-line">
            <span class="terminal-prompt" part="prompt">${this.prompt}</span>
            <input
              type="text"
              class="terminal-input"
              part="input"
              @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e)}"
              autocomplete="off"
              spellcheck="false"
              autofocus
            />
          </div>
        </if>
      </div>
    `;
  }

  private handleContainerClick() {
    if (!this.readonly) {
      this.focus();
    }
  }

  private renderLine(line: TerminalLine) {
    const timestamp = this.showTimestamps
      ? line.timestamp.toLocaleTimeString('en-US', { hour12: false })
      : '';

    return html/*html*/`
      <div class="terminal-line ${line.type}" part="line" data-type="${line.type}">
        <if ${this.showTimestamps}>
          <span class="line-timestamp" part="timestamp">${timestamp}</span>
        </if>
        <span class="line-content" part="line-content">${line.content}</span>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Event handlers
  private handleKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this.handleCommand(input.value);
        input.value = '';
        this.historyIndex = -1;
        this.currentInput = '';
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.navigateHistory('up', input);
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.navigateHistory('down', input);
        break;

      case 'Tab':
        e.preventDefault();
        // TODO: Add command completion
        break;

      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          input.value = '';
          this.writeln('^C', 'info');
        }
        break;

      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          this.clear();
        }
        break;
    }
  }

  private navigateHistory(direction: 'up' | 'down', input: HTMLInputElement) {
    if (this.commandHistory.length === 0) return;

    if (direction === 'up') {
      if (this.historyIndex === -1) {
        this.currentInput = input.value;
        this.historyIndex = this.commandHistory.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }
      input.value = this.commandHistory[this.historyIndex];
    } else {
      if (this.historyIndex === -1) return;

      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        input.value = this.commandHistory[this.historyIndex];
      } else {
        this.historyIndex = -1;
        input.value = this.currentInput;
      }
    }
  }

  private async handleCommand(commandLine: string) {
    commandLine = commandLine.trim();
    if (!commandLine) return;

    // Add to history
    this.commandHistory.push(commandLine);

    // Write input line
    this.writeln(`${this.prompt}${commandLine}`, 'input');

    // Parse command
    const parts = commandLine.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    // Dispatch event
    this.dispatchCommandEvent(command, args);

    // Execute command
    await this.executeCommand(commandLine);
  }

  private setupDefaultCommands() {
    // Clear command
    this.registerCommand('clear', () => {
      this.clear();
      return { exitCode: 0 };
    });

    // Help command
    this.registerCommand('help', () => {
      const commands = Array.from(this.commandHandlers.keys()).sort();
      return {
        output: `Available commands:\n${commands.join('\n')}`,
        exitCode: 0
      };
    });

    // Echo command
    this.registerCommand('echo', (args) => {
      return {
        output: args.join(' '),
        exitCode: 0
      };
    });

    // History command
    this.registerCommand('history', () => {
      return {
        output: this.commandHistory.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n'),
        exitCode: 0
      };
    });
  }

  // Public API
  write(content: string, type: TerminalLineType = 'output') {
    if (!content) return;

    const lines = content.split('\n');
    const newLines: TerminalLine[] = lines.map(line => ({
      id: crypto.randomUUID(),
      type,
      content: line,
      timestamp: new Date()
    }));

    this.lines = [...this.lines, ...newLines];
  }

  writeln(content: string, type: TerminalLineType = 'output') {
    this.write(content, type);
  }

  writeError(content: string) {
    this.write(content, 'error');
  }

  clear() {
    this.lines = [];
    this.dispatchClearEvent();
  }

  focus() {
    this.inputElement?.focus();
  }

  registerCommand(command: string, handler: CommandHandler) {
    this.commandHandlers.set(command, handler);
  }

  unregisterCommand(command: string) {
    this.commandHandlers.delete(command);
  }

  async executeCommand(commandLine: string): Promise<void> {
    const parts = commandLine.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const handler = this.commandHandlers.get(command);

    if (!handler) {
      this.writeError(`Command not found: ${command}`);
      return;
    }

    try {
      const result = await handler(args);

      if (result.output) {
        this.writeln(result.output, 'output');
      }

      if (result.error) {
        this.writeError(result.error);
      }
    } catch (error) {
      this.writeError(`Error executing command: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory() {
    this.commandHistory = [];
    this.historyIndex = -1;
  }
}
