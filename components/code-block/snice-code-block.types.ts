export type { FormatRules } from './formatter';

export type CodeLanguage = 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'python' | 'bash' | 'plaintext' | string;

export type FetchMode = 'native' | 'virtual' | 'event';

export const LOAD_GRAMMAR_REQUEST = 'snice/code-block/load-grammar';

export type HighlighterFunction = (code: string, language: string) => string | Promise<string>;

export type FormatterFunction = (code: string, language: string) => string | Promise<string>;

export interface GrammarRequestDetail {
  url: string;
  language: CodeLanguage;
  codeBlock: SniceCodeBlockElement;
}

export interface GrammarLoadedDetail {
  grammar: any;
  url: string;
  language: CodeLanguage;
  codeBlock: SniceCodeBlockElement;
}

export interface SniceCodeBlockElement extends HTMLElement {
  code: string;
  language: CodeLanguage;
  grammar: string;
  fetchMode: FetchMode;
  showLineNumbers: boolean;
  startLine: number;
  highlightLines: number[];
  copyable: boolean;
  filename: string;
  format: string;
  theme: '' | 'dark' | 'light';
  highlighter?: HighlighterFunction;

  copy(): Promise<void>;
  highlight(): Promise<void>;
  setHighlighter(highlighter: HighlighterFunction): void;
  setFormatter(formatter: FormatterFunction): void;
  setGrammar(grammar: any): void;
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

export interface CodeFormatDetail {
  code: string;
  language: string;
  codeBlock: SniceCodeBlockElement;
}

export interface SniceCodeBlockEventMap {
  'code-copy': CustomEvent<CodeCopyDetail>;
  'code-before-format': CustomEvent<CodeFormatDetail>;
  'code-after-format': CustomEvent<CodeFormatDetail>;
  'code-before-highlight': CustomEvent<CodeHighlightDetail>;
  'code-after-highlight': CustomEvent<CodeHighlightDetail>;
  'grammar-request': CustomEvent<GrammarRequestDetail>;
  'grammar-loaded': CustomEvent<GrammarLoadedDetail>;
}
