export interface SniceListElement extends HTMLElement {
  dividers: boolean;
  searchable: boolean;
  search: string;
  infinite: boolean;
  loading: boolean;
  noResults: boolean;
  threshold: number;
  skeletonCount: number;
}
