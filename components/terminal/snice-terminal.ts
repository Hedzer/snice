import { element, property, dispatch, request, render, styles, html, css, query, unsafeHTML, ready } from 'snice';
import cssContent from './snice-terminal.css?inline';
import type {
  SniceTerminalElement,
  TerminalLine,
  TerminalLineType,
  TerminalCommandRequest,
  TerminalCommandResponse,
  SniceTerminalEventMap
} from './snice-terminal.types';

@element('snice-terminal')
export class SniceTerminal extends HTMLElement implements SniceTerminalElement {
  private lines: TerminalLine[] = [];

  @property({ type: Number })
  private renderTrigger = 0;

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

  private commandHistory: string[] = [];
  private historyIndex = -1;
  private currentInput = '';

  @dispatch('terminal-command', { bubbles: true, composed: true })
  private dispatchCommandEvent(command: string, args: string[]) {
    return { command, args };
  }

  @dispatch('terminal-clear', { bubbles: true, composed: true })
  private dispatchClearEvent() {
    return {};
  }

  @dispatch('terminal-ready', { bubbles: true, composed: true })
  private dispatchReadyEvent() {
    return {};
  }

  @ready()
  onReady() {
    this.dispatchReadyEvent();
  }

  @request('terminal-command')
  async *executeCommand(commandLine: string): any {
    const parts = commandLine.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const payload: TerminalCommandRequest = {
      command,
      args,
      cwd: this.cwd,
      history: [...this.commandHistory]
    };

    try {
      const response: TerminalCommandResponse = await (yield payload);
      return response;
    } catch (error) {
      // No handler found or error occurred
      console.error('[Terminal] Command execution error:', error);
      return {
        error: error instanceof Error ? error.message : `Command not found: ${command}`,
        exitCode: 127
      };
    }
  }

  private updateLines() {
    // Limit lines if needed
    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines);
    }

    // Trigger re-render by updating a tracked property
    this.renderTrigger++;

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
        <span class="line-content" part="line-content">${unsafeHTML(line.content)}</span>
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

    // Parse command for event
    const parts = commandLine.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    // Dispatch event
    this.dispatchCommandEvent(command, args);

    // Execute command via @request
    const result = await this.executeCommand(commandLine);

    // Handle response
    if (result.output) {
      // Check for special clear marker
      if (result.output === '\x1B[CLEAR]') {
        this.clear();
      } else {
        this.writeln(result.output, 'output');
      }
    }

    if (result.error) {
      this.writeError(result.error);
    }
  }


  // ANSI color parsing
  private parseAnsiColors(text: string): string {
    const ansiColorMap: Record<number, string> = {
      30: '#000000', // Black
      31: '#ff5555', // Red
      32: '#50fa7b', // Green
      33: '#f1fa8c', // Yellow
      34: '#bd93f9', // Blue
      35: '#ff79c6', // Magenta
      36: '#8be9fd', // Cyan
      37: '#f8f8f2', // White
      90: '#6272a4', // Bright Black (Gray)
      91: '#ff6e6e', // Bright Red
      92: '#69ff94', // Bright Green
      93: '#ffffa5', // Bright Yellow
      94: '#d6acff', // Bright Blue
      95: '#ff92df', // Bright Magenta
      96: '#a4ffff', // Bright Cyan
      97: '#ffffff'  // Bright White
    };

    // Replace ANSI escape sequences with HTML spans
    return text.replace(/\x1b\[([0-9;]+)m/g, (match, codes) => {
      const codeList = codes.split(';').map(Number);

      // Handle reset code
      if (codeList.includes(0)) {
        return '</span>';
      }

      // Handle color codes
      for (const code of codeList) {
        if (ansiColorMap[code]) {
          return `<span style="color: ${ansiColorMap[code]}">`;
        }
      }

      return '';
    });
  }

  // Public API
  write(content: string, type: TerminalLineType = 'output') {
    if (!content) return;

    // Parse ANSI colors
    const parsedContent = this.parseAnsiColors(content);

    const lines = parsedContent.split('\n');
    const newLines: TerminalLine[] = lines.map(line => ({
      id: crypto.randomUUID(),
      type,
      content: line,
      timestamp: new Date()
    }));

    this.lines = [...this.lines, ...newLines];
    this.updateLines();
  }

  writeln(content: string, type: TerminalLineType = 'output') {
    this.write(content, type);
  }

  writeError(content: string) {
    this.write(content, 'error');
  }

  clear() {
    this.lines = [];
    this.updateLines();
    this.dispatchClearEvent();
  }

  focus() {
    this.inputElement?.focus();
  }

  writeLines(lines: Array<{ content: string; type?: TerminalLineType }>) {
    const newLines: TerminalLine[] = lines.map(line => ({
      id: crypto.randomUUID(),
      type: line.type || 'output',
      content: line.content,
      timestamp: new Date()
    }));

    this.lines = [...this.lines, ...newLines];
    this.updateLines();
  }

  getHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory() {
    this.commandHistory = [];
    this.historyIndex = -1;
  }
}
