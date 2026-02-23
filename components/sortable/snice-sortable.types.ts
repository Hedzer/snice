export type SortableDirection = 'vertical' | 'horizontal';

export interface SortableChangeDetail {
  oldIndex: number;
  newIndex: number;
  item: HTMLElement;
}

export interface SniceSortableElement extends HTMLElement {
  direction: SortableDirection;
  handle: string;
  disabled: boolean;
  group: string;
}

export interface SniceSortableEventMap {
  'sort-start': CustomEvent<{ index: number; item: HTMLElement }>;
  'sort-end': CustomEvent<SortableChangeDetail>;
  'sort-change': CustomEvent<SortableChangeDetail>;
}
