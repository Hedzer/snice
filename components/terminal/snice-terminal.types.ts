/**
 * Types for the snice-terminal component
 */

/**
 * Terminal line type
 */
export type TerminalLineType = 'input' | 'output' | 'error' | 'info' | 'success' | 'warning';

/**
 * Terminal line
 */
export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: Date;
}

/**
 * Command handler result
 */
export interface CommandResult {
  output?: string;
  error?: string;
  exitCode?: number;
}

/**
 * Command handler function
 */
export type CommandHandler = (args: string[]) => CommandResult | Promise<CommandResult>;

/**
 * Terminal theme
 */
export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

/**
 * Custom events
 */
export interface SniceTerminalEventMap {
  'terminal-command': CustomEvent<{ command: string; args: string[] }>;
  'terminal-clear': CustomEvent<{}>;
  'terminal-ready': CustomEvent<{}>;
}

/**
 * snice-terminal element interface
 */
export interface SniceTerminalElement extends HTMLElement {
  /**
   * Terminal lines
   */
  lines: TerminalLine[];

  /**
   * Terminal prompt
   */
  prompt: string;

  /**
   * Current working directory
   */
  cwd: string;

  /**
   * Whether terminal is readonly
   */
  readonly: boolean;

  /**
   * Maximum number of lines to keep in history
   */
  maxLines: number;

  /**
   * Whether to show timestamps
   */
  showTimestamps: boolean;

  /**
   * Write output to terminal
   */
  write(content: string, type?: TerminalLineType): void;

  /**
   * Write line to terminal
   */
  writeln(content: string, type?: TerminalLineType): void;

  /**
   * Write error to terminal
   */
  writeError(content: string): void;

  /**
   * Clear terminal
   */
  clear(): void;

  /**
   * Focus terminal input
   */
  focus(): void;

  /**
   * Register a command handler
   */
  registerCommand(command: string, handler: CommandHandler): void;

  /**
   * Unregister a command handler
   */
  unregisterCommand(command: string): void;

  /**
   * Execute a command
   */
  executeCommand(command: string): Promise<void>;

  /**
   * Get command history
   */
  getHistory(): string[];

  /**
   * Clear command history
   */
  clearHistory(): void;
}
