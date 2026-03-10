export interface SniceGridElement extends HTMLElement {
  gap: string;
  columnWidth: number;
  rowHeight: number;
  columns: number;
  rows: number;
  originLeft: boolean;
  originTop: boolean;
  transitionDuration: string;
  stagger: number;
  resize: boolean;
  draggable: boolean;
  dragThrottle: number;

  layout(): void;
  fit(element: HTMLElement, col?: number, row?: number): void;
  reloadItems(): void;
  getItemElements(): HTMLElement[];
  getLayout(): GridLayout;
  setLayout(layout: GridLayout): void;
}

export interface GridLayoutEntry {
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
  order: number;
  hidden?: boolean;
}

export type GridLayout = Record<string, GridLayoutEntry>;

export interface GridLayoutCompleteDetail {
  items: HTMLElement[];
}

export interface GridDragItemPositionedDetail {
  item: HTMLElement;
  col: number;
  row: number;
}

export interface GridEventMap {
  'grid-layout-complete': CustomEvent<GridLayoutCompleteDetail>;
  'grid-drag-item-positioned': CustomEvent<GridDragItemPositionedDetail>;
}
