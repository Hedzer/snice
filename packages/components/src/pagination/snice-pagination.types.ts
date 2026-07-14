export type PaginationSize = 'small' | 'medium' | 'large';
export type PaginationVariant = 'default' | 'rounded' | 'text';

export interface SnicePaginationElement extends HTMLElement {
  current: number;
  total: number;
  siblings: number;
  showFirst: boolean;
  showLast: boolean;
  showPrev: boolean;
  showNext: boolean;
  size: PaginationSize;
  variant: PaginationVariant;
  
  // Methods
  goToPage(page: number): void;
  nextPage(): void;
  previousPage(): void;
  firstPage(): void;
  lastPage(): void;
}