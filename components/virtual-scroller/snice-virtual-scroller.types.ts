export interface VirtualScrollerItem {
  id: string | number;
  data: any;
  height?: number;
}

export interface SniceVirtualScrollerElement extends HTMLElement {
  items: VirtualScrollerItem[];
  itemHeight: number;
  bufferSize: number;
  estimatedItemHeight: number;
  renderItem: (item: VirtualScrollerItem, index: number) => string | HTMLElement;

  scrollToIndex(index: number): void;
  scrollToItem(id: string | number): void;
  refresh(): void;
  getVisibleRange(): { start: number; end: number };
}
