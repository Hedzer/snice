export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  iconImage?: string;
  shortcut?: string;
  category?: string;
  disabled?: boolean;
  action?: () => void | Promise<void>;
  data?: any;
}

export interface SniceCommandPaletteElement extends HTMLElement {
  open: boolean;
  commands: CommandItem[];
  placeholder: string;
  noResultsText: string;
  maxResults: number;
  showRecentCommands: boolean;
  recentCommandsLimit: number;
  caseSensitive: boolean;

  show(): void;
  close(): void;
  toggle(): void;
  addCommand(command: CommandItem): void;
  removeCommand(id: string): void;
  executeCommand(id: string): void;
  clearSearch(): void;
  focus(): void;
}

export interface CommandSelectDetail {
  command: CommandItem;
  palette: SniceCommandPaletteElement;
}

export interface CommandExecuteDetail {
  command: CommandItem;
  palette: SniceCommandPaletteElement;
}

export interface CommandSearchDetail {
  query: string;
  results: CommandItem[];
  palette: SniceCommandPaletteElement;
}

export interface CommandPaletteOpenDetail {
  palette: SniceCommandPaletteElement;
}

export interface CommandPaletteCloseDetail {
  palette: SniceCommandPaletteElement;
}
