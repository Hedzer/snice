export type TabsPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface SniceTabElement extends HTMLElement {
  disabled: boolean;
  closable: boolean;
  focus(options?: FocusOptions): void;
  blur(): void;
}

export interface SniceTabPanelElement extends HTMLElement {
  name: string;
  hidden: boolean;
}

export interface TabChangeDetail {
  index: number;
  oldIndex: number;
  tab: SniceTabElement;
  panel: SniceTabPanelElement;
}

export interface TabSelectDetail {
  tab: SniceTabElement;
}

export interface TabCloseDetail {
  tab: SniceTabElement;
}