export type PageTurnDirection = 'forward' | 'backward';

export interface BookPage {
  front?: string;
  back?: string;
}

export interface SniceBookElement extends HTMLElement {
  currentPage: number;
  readonly totalPages: number;

  goToPage(page: number): void;
  nextPage(): void;
  prevPage(): void;
  firstPage(): void;
  lastPage(): void;
}

export interface PageTurnDetail {
  page: number;
  direction: PageTurnDirection;
}

export interface PageFlipStartDetail {
  fromPage: number;
  toPage: number;
  direction: PageTurnDirection;
}

export interface SniceBookEventMap {
  'page-turn': CustomEvent<PageTurnDetail>;
  'page-flip-start': CustomEvent<PageFlipStartDetail>;
  'page-flip-end': CustomEvent<PageTurnDetail>;
}
