export interface SniceBinpackElement extends HTMLElement {
  gap: string;
  columnWidth: number;
  rowHeight: number;
  horizontal: boolean;
  originLeft: boolean;
  originTop: boolean;
  transitionDuration: string;
  stagger: number;
  resize: boolean;
  draggable: boolean;
  dragThrottle: number;

  layout(): void;
  fit(element: HTMLElement, x?: number, y?: number): void;
  reloadItems(): void;
  stamp(elements: HTMLElement | HTMLElement[]): void;
  unstamp(elements: HTMLElement | HTMLElement[]): void;
  getItemElements(): HTMLElement[];
  getLayout(): BinpackLayout;
  setLayout(layout: BinpackLayout): void;
}

export interface BinpackLayoutCompleteDetail {
  items: HTMLElement[];
}

export interface BinpackFitCompleteDetail {
  item: HTMLElement;
  x: number;
  y: number;
}

export interface BinpackDragItemPositionedDetail {
  item: HTMLElement;
  x: number;
  y: number;
}

export interface BinpackEventMap {
  'binpack-layout-complete': CustomEvent<BinpackLayoutCompleteDetail>;
  'binpack-fit-complete': CustomEvent<BinpackFitCompleteDetail>;
  'binpack-drag-item-positioned': CustomEvent<BinpackDragItemPositionedDetail>;
}

export interface BinpackLayoutEntry {
  order: number;
  hidden?: boolean;
  col?: number;
  row?: number;
}

export type BinpackLayout = Record<string, BinpackLayoutEntry>;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
