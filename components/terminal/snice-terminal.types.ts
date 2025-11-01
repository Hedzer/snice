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
 * Terminal command request payload
 */
export interface TerminalCommandRequest {
  command: string;
  args: string[];
  cwd?: string;
  history?: string[];
}

/**
 * Terminal command response
 */
export interface TerminalCommandResponse {
  output?: string;
  error?: string;
  exitCode?: number;
}

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
   * Write content to terminal (without newline)
   */
  write(content: string, type?: TerminalLineType): void;

  /**
   * Write line to terminal (with newline)
   */
  writeln(content: string, type?: TerminalLineType): void;

  /**
   * Write multiple lines to terminal
   */
  writeLines(lines: Array<{ content: string; type?: TerminalLineType }>): void;

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
   * Get command history
   */
  getHistory(): string[];

  /**
   * Clear command history
   */
  clearHistory(): void;
}
