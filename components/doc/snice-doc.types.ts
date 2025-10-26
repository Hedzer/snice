/**
 * Types for the snice-doc component
 */

/**
 * Block types supported by the editor
 */
export type BlockType =
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bulleted-list'
  | 'numbered-list'
  | 'todo'
  | 'code'
  | 'quote'
  | 'divider';

/**
 * Inline format types
 */
export type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';

/**
 * Text range for inline formatting
 */
export interface TextRange {
  start: number;
  end: number;
  format: InlineFormat;
  value?: string; // For links
}

/**
 * Document block
 */
export interface DocBlock {
  id: string;
  type: BlockType;
  content: string;
  formats: TextRange[];
  checked?: boolean; // For todo blocks
  indent?: number; // For nested lists
}

/**
 * Editor selection
 */
export interface EditorSelection {
  blockId: string;
  start: number;
  end: number;
}

/**
 * Editor state
 */
export interface EditorState {
  blocks: DocBlock[];
  selection: EditorSelection | null;
}

/**
 * Block menu item
 */
export interface BlockMenuItem {
  type: BlockType;
  label: string;
  icon: string;
  keywords: string[];
}

/**
 * Custom events
 */
export interface SniceDocEventMap {
  'doc-change': CustomEvent<{ blocks: DocBlock[] }>;
  'doc-focus': CustomEvent<{ blockId: string }>;
  'doc-blur': CustomEvent<{ blockId: string }>;
}

/**
 * snice-doc element interface
 */
export interface SniceDocElement extends HTMLElement {
  /**
   * Document blocks
   */
  blocks: DocBlock[];

  /**
   * Placeholder text when empty
   */
  placeholder: string;

  /**
   * Whether the editor is readonly
   */
  readonly: boolean;

  /**
   * Get current blocks
   */
  getBlocks(): DocBlock[];

  /**
   * Set blocks
   */
  setBlocks(blocks: DocBlock[]): void;

  /**
   * Export document as JSON
   */
  toJSON(): string;

  /**
   * Import document from JSON
   */
  fromJSON(json: string): void;

  /**
   * Export document as markdown
   */
  toMarkdown(): string;

  /**
   * Export document as HTML
   */
  toHTML(): string;

  /**
   * Focus the editor
   */
  focus(): void;

  /**
   * Clear all content
   */
  clear(): void;
}
