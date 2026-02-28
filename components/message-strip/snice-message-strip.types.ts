export type MessageStripVariant = 'info' | 'success' | 'warning' | 'danger';

export interface SniceMessageStripElement extends HTMLElement {
  variant: MessageStripVariant;
  dismissable: boolean;
  icon: string;
  show(): void;
  hide(): void;
}

export interface SniceMessageStripEventMap {
  'dismiss': CustomEvent<{ variant: MessageStripVariant }>;
}
