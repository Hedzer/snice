export type PdfFitMode = 'width' | 'height' | 'page';

export interface SnicePdfViewerElement extends HTMLElement {
  src: string;
  page: number;
  zoom: number;
  fit: PdfFitMode;
  readonly totalPages: number;

  goToPage(page: number): void;
  nextPage(): void;
  prevPage(): void;
  print(): void;
  download(): void;
}

export interface SnicePdfViewerEventMap {
  'page-change': CustomEvent<{ page: number; totalPages: number }>;
  'pdf-loaded': CustomEvent<{ totalPages: number }>;
  'pdf-error': CustomEvent<{ error: string }>;
}
