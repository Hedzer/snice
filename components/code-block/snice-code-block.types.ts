import type { GrammarDefinition } from './highlighter';

export type CodeLanguage = 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'python' | 'bash' | 'plaintext' | string;

export type HighlighterFunction = (code: string, language: string) => string | Promise<string>;

export interface SniceCodeBlockElement extends HTMLElement {
  code: string;
  language: CodeLanguage;
  grammar: GrammarDefinition | string | null;
  showLineNumbers: boolean;
  startLine: number;
  highlightLines: number[];
  copyable: boolean;
  filename: string;
  highlighter?: HighlighterFunction;

  copy(): Promise<void>;
  highlight(): Promise<void>;
  setHighlighter(highlighter: HighlighterFunction): void;
}

export interface CodeCopyDetail {
  code: string;
  codeBlock: SniceCodeBlockElement;
}

export interface CodeHighlightDetail {
  code: string;
  language: string;
  codeBlock: SniceCodeBlockElement;
}

export interface SniceCodeBlockEventMap {
  '@snice/code-copy': CustomEvent<CodeCopyDetail>;
  '@snice/code-before-highlight': CustomEvent<CodeHighlightDetail>;
  '@snice/code-after-highlight': CustomEvent<CodeHighlightDetail>;
}
