export type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end';
export type MenuTrigger = 'click' | 'hover' | 'manual';

export interface SniceMenuElement extends HTMLElement {
  open: boolean;
  placement: MenuPlacement;
  trigger: MenuTrigger;
  closeOnSelect: boolean;
  distance: number;
  openMenu(): void;
  closeMenu(): void;
  toggleMenu(): void;
}

export interface MenuOpenDetail {
  menu: SniceMenuElement;
}

export interface MenuCloseDetail {
  menu: SniceMenuElement;
}
