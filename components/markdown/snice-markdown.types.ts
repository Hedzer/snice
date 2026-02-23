export type MarkdownTheme = 'default' | 'github';

export interface SniceMarkdownElement extends HTMLElement {
  content: string;
  sanitize: boolean;
  theme: MarkdownTheme;
  setContent(markdown: string): void;
}

export interface SniceMarkdownEventMap {
  'markdown-render': CustomEvent<{ html: string }>;
  'link-click': CustomEvent<{ href: string; text: string }>;
}
