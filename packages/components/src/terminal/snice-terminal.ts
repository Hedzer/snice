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
    // Limit lines if needed — splice in place rather than slice()/reassign so
    // we don't allocate a fresh array per write under high-frequency streaming.
    const overflow = this.lines.length - this.maxLines;
    if (overflow > 0) {
      this.lines.splice(0, overflow);
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
        <div class="terminal-output" part="output" role="log" aria-live="polite" aria-atomic="false">
          ${this.lines.map(line => this.renderLine(line))}
        </div>

        <if ${!this.readonly}>
          <div class="terminal-input-line" part="input-line">
            <span class="terminal-prompt" part="prompt">${this.prompt}</span>
            <input
              type="text"
              class="terminal-input"
              part="input"
              aria-label="Terminal command"
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


  // ANSI color parsing. Escapes HTML first so untrusted input cannot inject
  // markup; only the ANSI escape sequences produce real <span> tags. Each SGR
  // code becomes the matching .ansi-* class, so the colour is resolved by the
  // documented --snice-terminal-ansi-* custom properties and the component's
  // own stylesheet — never a hardcoded inline literal (MATRIX-terminal-2).
  private parseAnsiColors(text: string): string {
    const ansiColorMap: Record<number, string> = {
      30: 'ansi-black',
      31: 'ansi-red',
      32: 'ansi-green',
      33: 'ansi-yellow',
      34: 'ansi-blue',
      35: 'ansi-magenta',
      36: 'ansi-cyan',
      37: 'ansi-white',
      90: 'ansi-bright-black',
      91: 'ansi-bright-red',
      92: 'ansi-bright-green',
      93: 'ansi-bright-yellow',
      94: 'ansi-bright-blue',
      95: 'ansi-bright-magenta',
      96: 'ansi-bright-cyan',
      97: 'ansi-bright-white',
    };

    const escape = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Split on ANSI escape sequences, escape text segments, pass through
    // recognized color/reset codes as <span> tags.
    const parts: string[] = [];
    const re = /\x1b\[([0-9;]+)m/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      parts.push(escape(text.slice(lastIndex, match.index)));
      const codeList = match[1].split(';').map(Number);
      if (codeList.includes(0)) {
        parts.push('</span>');
      } else {
        for (const code of codeList) {
          if (ansiColorMap[code]) {
            parts.push(`<span class="${ansiColorMap[code]}">`);
            break;
          }
        }
      }
      lastIndex = match.index + match[0].length;
    }
    parts.push(escape(text.slice(lastIndex)));
    return parts.join('');
  }

  // Public API
  write(content: string, type: TerminalLineType = 'output') {
    if (!content) return;

    // Parse ANSI colors
    const parsedContent = this.parseAnsiColors(content);

    const lines = parsedContent.split('\n');
    for (const line of lines) {
      this.lines.push({
        id: crypto.randomUUID(),
        type,
        content: line,
        timestamp: new Date(),
      });
    }
    this.updateLines();
  }

  writeln(content: string, type: TerminalLineType = 'output') {
    this.write(content, type);
  }

  writeError(content: string) {
    this.write(content, 'error');
  }

  clear() {
    this.lines.length = 0;
    this.liveLineBuffer = '';
    this.liveLine = null;
    this.updateLines();
    this.dispatchClearEvent();
  }

  focus() {
    this.inputElement?.focus();
  }

  writeLines(lines: Array<{ content: string; type?: TerminalLineType }>) {
    for (const line of lines) {
      this.lines.push({
        id: crypto.randomUUID(),
        type: line.type || 'output',
        // Route through parseAnsiColors so content is HTML-escaped first
        // (same safety path as write()); bypassing this was a stored XSS vector.
        content: this.parseAnsiColors(line.content),
        timestamp: new Date(),
      });
    }
    this.updateLines();
  }

  // ─── Streaming API ─────────────────────────────────────────────────────────
  // appendChunk + pipeFrom let callers feed raw chunks (e.g. from a child
  // process stdout, a WebSocket, or an LLM token stream) without splitting on
  // newlines themselves. A trailing partial line stays "live" — a single
  // TerminalLine whose content grows as more chunks arrive — until a newline
  // commits it.

  private liveLineBuffer = '';
  private liveLine: TerminalLine | null = null;
  private liveLineType: TerminalLineType = 'output';

  appendChunk(chunk: string, type: TerminalLineType = 'output') {
    if (!chunk) return;

    // If the type changed mid-stream, commit the existing live line first.
    if (this.liveLine && type !== this.liveLineType) {
      this.commitLiveLine();
    }
    this.liveLineType = type;

    // Combine pending tail with new chunk, then split on \n.
    const combined = this.liveLineBuffer + chunk;
    const parts = combined.split('\n');
    // Last element is whatever follows the final \n (or all of it, if no \n).
    const tail = parts.pop() ?? '';

    // Each complete part becomes its own committed line.
    for (const raw of parts) {
      const escaped = this.parseAnsiColors(raw);
      // Reuse the live line for the first complete part if present, otherwise push.
      if (this.liveLine) {
        this.liveLine.content = escaped;
        this.liveLine = null;
      } else {
        this.lines.push({
          id: crypto.randomUUID(),
          type,
          content: escaped,
          timestamp: new Date(),
        });
      }
    }

    // Tail (no trailing newline) keeps growing as a live line.
    this.liveLineBuffer = tail;
    if (tail) {
      const escaped = this.parseAnsiColors(tail);
      if (this.liveLine) {
        this.liveLine.content = escaped;
      } else {
        this.liveLine = {
          id: crypto.randomUUID(),
          type,
          content: escaped,
          timestamp: new Date(),
        };
        this.lines.push(this.liveLine);
      }
    }

    this.updateLines();
  }

  /** Force the current live (un-newlined) buffer to be treated as a finished line. */
  commitLiveLine() {
    this.liveLine = null;
    this.liveLineBuffer = '';
  }

  /**
   * Consume an AsyncIterable<string> or a ReadableStream<string|Uint8Array> until
   * exhaustion, calling appendChunk on each chunk. Cancellation: throw / return
   * from the source, or call `terminal.clear()` to stop displaying — the pipe
   * itself just runs to completion.
   */
  async pipeFrom(source: AsyncIterable<string> | ReadableStream<string | Uint8Array>, type: TerminalLineType = 'output'): Promise<void> {
    const iter = (source as ReadableStream).getReader
      ? readableStreamToAsyncIterable(source as ReadableStream<string | Uint8Array>)
      : (source as AsyncIterable<string>);

    const decoder = new TextDecoder();
    for await (const chunk of iter) {
      const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
      if (text) this.appendChunk(text, type);
    }
    // Flush any pending decoder state (no-op for string sources).
    const flush = decoder.decode();
    if (flush) this.appendChunk(flush, type);
  }

  getHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory() {
    this.commandHistory = [];
    this.historyIndex = -1;
  }
}

/** Adapt a ReadableStream to an async iterable (Safari < 14.1 lacks the
 *  built-in `Symbol.asyncIterator` on streams). */
async function* readableStreamToAsyncIterable<T>(stream: ReadableStream<T>): AsyncIterable<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      yield value as T;
    }
  } finally {
    reader.releaseLock();
  }
}
