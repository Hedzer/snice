export type CodeLanguage = 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'python' | 'bash' | 'plaintext';

export interface SniceCodeBlockElement extends HTMLElement {
  code: string;
  language: CodeLanguage;
  showLineNumbers: boolean;
  startLine: number;
  highlightLines: number[];
  copyable: boolean;
  filename: string;

  copy(): Promise<void>;
}

export interface CodeCopyDetail {
  code: string;
  codeBlock: SniceCodeBlockElement;
}
