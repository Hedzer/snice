export interface SniceSignatureElement extends HTMLElement {
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  readonly: boolean;
  clear(): void;
  toDataURL(type?: string): string;
  toBlob(): Promise<Blob | null>;
  isEmpty(): boolean;
}

export interface SniceSignatureEventMap {
  'signature-change': CustomEvent<{ empty: boolean }>;
  'signature-clear': CustomEvent<void>;
}
