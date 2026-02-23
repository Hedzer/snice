export type DiffMode = 'split' | 'unified';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLine: number | null;
  newLine: number | null;
  content: string;
}

export interface DiffHunk {
  lines: DiffLine[];
  collapsed: boolean;
}

export interface SniceDiffElement extends HTMLElement {
  oldText: string;
  newText: string;
  language: string;
  mode: DiffMode;
  lineNumbers: boolean;
  contextLines: number;
}

export interface SniceDiffEventMap {
  'diff-computed': CustomEvent<{ hunks: DiffHunk[]; additions: number; deletions: number }>;
}
