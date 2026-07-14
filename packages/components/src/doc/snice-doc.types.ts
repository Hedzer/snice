export type DocIconSet = 'default' | 'material' | 'fontawesome';
export type DocDownloadFormat = 'html' | 'markdown' | 'text';

export interface SniceDocElement extends HTMLElement {
  placeholder: string;
  readonly: boolean;
  icons: DocIconSet;
  getHTML(): string;
  setHTML(html: string): void;
  getText(): string;
  getMarkdown(): string;
  downloadAs(format: DocDownloadFormat, filename?: string): void;
  clear(): void;
}
