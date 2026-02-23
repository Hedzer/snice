export type InfiniteScrollDirection = 'down' | 'up';

export interface SniceInfiniteScrollElement extends HTMLElement {
  threshold: number;
  loading: boolean;
  hasMore: boolean;
  direction: InfiniteScrollDirection;
}

export interface SniceInfiniteScrollEventMap {
  'load-more': CustomEvent<void>;
}
